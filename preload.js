const { contextBridge, ipcRenderer } = require('electron');
let marked;
try {
  marked = require('marked').marked;
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  const renderer = new marked.Renderer();
  renderer.code = function(code, language) {
    const safeLang = language || 'code';
    const escapedCode = String(code).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
<div class="code-block-wrapper">
  <div class="code-block-header">
    <span class="code-lang">${safeLang}</span>
    <button class="copy-code-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block-wrapper').querySelector('code').textContent).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)})">Copy</button>
  </div>
  <pre><code class="language-${safeLang}">${escapedCode}</code></pre>
</div>
`;
  };
  marked.use({ renderer });
} catch (err) {
  console.warn('marked library not loaded, using fallback text renderer');
  marked = {
    parse: (text) => String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
  };
}

// Expose safe API to the renderer process
contextBridge.exposeInMainWorld('api', {
  ollama: {
    checkConnection: (url) => ipcRenderer.invoke('ollama:check-connection', url),
    listModels: (url) => ipcRenderer.invoke('ollama:list-models', url),
    chat: (payload) => ipcRenderer.invoke('ollama:chat', payload),
    abort: () => ipcRenderer.invoke('ollama:abort'),
  },
  storage: {
    loadChats: () => ipcRenderer.invoke('storage:load-chats'),
    saveChats: (chats) => ipcRenderer.invoke('storage:save-chats', chats),
    loadSettings: () => ipcRenderer.invoke('storage:load-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('storage:save-settings', settings),
  },
  markdown: {
    render: (text) => marked.parse(text),
  },
  on: {
    streamChunk: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('ollama:stream-chunk', listener);
      return () => ipcRenderer.removeListener('ollama:stream-chunk', listener);
    },
    streamEnd: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('ollama:stream-end', listener);
      return () => ipcRenderer.removeListener('ollama:stream-end', listener);
    },
    streamError: (callback) => {
      const listener = (_event, data) => callback(data);
      ipcRenderer.on('ollama:stream-error', listener);
      return () => ipcRenderer.removeListener('ollama:stream-error', listener);
    },
  },
  removeAllStreamListeners: () => {
    ipcRenderer.removeAllListeners('ollama:stream-chunk');
    ipcRenderer.removeAllListeners('ollama:stream-end');
    ipcRenderer.removeAllListeners('ollama:stream-error');
  },
});
