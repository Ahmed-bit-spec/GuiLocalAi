const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let currentAbortController = null;

const userDataPath = () => app.getPath('userData');
const chatsFile = () => path.join(userDataPath(), 'chats.json');
const settingsFile = () => path.join(userDataPath(), 'settings.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 760,
    minHeight: 480,
    backgroundColor: '#0d0d0d',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------- Ollama IPC ----------

ipcMain.handle('ollama:check-connection', async (_event, url) => {
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/tags`, {
      signal: AbortSignal.timeout(4000)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
});

ipcMain.handle('ollama:list-models', async (_event, url) => {
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      modifiedAt: m.modified_at
    }));
  } catch (err) {
    console.error('listModels error', err);
    return [];
  }
});

ipcMain.handle('ollama:chat', async (event, payload) => {
  const { url, model, messages, options } = payload;
  const sender = event.sender;
  currentAbortController = new AbortController();

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, options, stream: true }),
      signal: currentAbortController.signal
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama responded with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        let json;
        try {
          json = JSON.parse(line);
        } catch (e) {
          continue;
        }
        if (json.message && json.message.content) {
          sender.send('ollama:stream-chunk', json.message.content);
        }
        if (json.done) {
          sender.send('ollama:stream-end', {
            totalDuration: json.total_duration,
            evalCount: json.eval_count
          });
          currentAbortController = null;
          return { ok: true };
        }
      }
    }

    sender.send('ollama:stream-end', {});
    currentAbortController = null;
    return { ok: true };
  } catch (err) {
    currentAbortController = null;
    if (err.name === 'AbortError') {
      sender.send('ollama:stream-end', { aborted: true });
      return { ok: true, aborted: true };
    }
    sender.send('ollama:stream-error', { message: err.message });
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('ollama:abort', async () => {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  return true;
});

// ---------- Storage IPC ----------

function readJSON(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('readJSON error', filePath, err);
    return fallback;
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('writeJSON error', filePath, err);
    return false;
  }
}

ipcMain.handle('storage:load-chats', async () => readJSON(chatsFile(), []));
ipcMain.handle('storage:save-chats', async (_event, chats) => writeJSON(chatsFile(), chats));
ipcMain.handle('storage:load-settings', async () => readJSON(settingsFile(), null));
ipcMain.handle('storage:save-settings', async (_event, settings) => writeJSON(settingsFile(), settings));
