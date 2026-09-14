let state = {
  chats: [],
  currentChatId: null,
  settings: {
    ollamaUrl: 'http://localhost:11434',
    defaultModel: 'qwen2.5-coder:1.5b',
    temperature: 0.7,
    systemPrompt: '',
    theme: 'dark',
    confirmDelete: true
  },
  models: [],
  isGenerating: false,
  isConnected: false,
  sidebarCollapsed: false,
  currentStreamContent: '',
};

// DOM Elements
const els = {
  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  sidebarToggleMobile: document.getElementById('sidebar-toggle-mobile'),
  newChatBtn: document.getElementById('new-chat-btn'),
  chatSearch: document.getElementById('chat-search'),
  chatList: document.getElementById('chat-list'),
  connectionDot: document.getElementById('connection-dot'),
  connectionText: document.getElementById('connection-text'),
  settingsBtn: document.getElementById('settings-btn'),

  modelSelector: document.getElementById('model-selector'),
  refreshModelsBtn: document.getElementById('refresh-models-btn'),
  chatContainer: document.getElementById('chat-container'),
  welcomeScreen: document.getElementById('welcome-screen'),
  messagesContainer: document.getElementById('messages-container'),

  messageForm: document.getElementById('message-form'),
  messageInput: document.getElementById('message-input'),
  clearBtn: document.getElementById('clear-btn'),
  stopBtn: document.getElementById('stop-btn'),
  sendBtn: document.getElementById('send-btn'),

  settingsModal: document.getElementById('settings-modal'),
  settingsCloseBtn: document.getElementById('settings-close-btn'),
  ollamaUrlInput: document.getElementById('ollama-url-input'),
  settingsConnectionStatus: document.getElementById('settings-connection-status'),
  testConnectionBtn: document.getElementById('test-connection-btn'),
  refreshModelsBtnSettings: document.getElementById('refresh-models-btn-settings'),
  defaultModelSelect: document.getElementById('default-model-select'),
  temperatureValue: document.getElementById('temperature-value'),
  temperatureInput: document.getElementById('temperature-input'),
  systemPromptInput: document.getElementById('system-prompt-input'),
  themeDark: document.getElementById('theme-dark'),
  themeLight: document.getElementById('theme-light'),
  themeSystem: document.getElementById('theme-system'),
  clearAllChatsBtn: document.getElementById('clear-all-chats-btn'),
  confirmDeleteToggle: document.getElementById('confirm-delete-toggle'),
  saveSettingsBtn: document.getElementById('save-settings-btn')
};

// Initialization
async function init() {
  await loadSettings();
  applyTheme(state.settings.theme);
  await loadChats();

  setupEventListeners();
  setupStreamListeners();
  setupKeyboardShortcuts();

  await checkConnection();
  if (state.isConnected) {
    await loadModels();
  }

  setInterval(checkConnection, 30000);

  if (state.chats.length > 0) {
    renderChatList();
  } else {
    renderWelcomeScreen();
  }
}

document.addEventListener('DOMContentLoaded', init);

// Event Listeners
function setupEventListeners() {
  // Sidebar
  const toggleSidebar = () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    els.sidebar.classList.toggle('collapsed', state.sidebarCollapsed);

    const icon = document.getElementById('sidebar-toggle-icon');
    if (icon) icon.classList.toggle('rotate-180', state.sidebarCollapsed);

    const label = state.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
    els.sidebarToggle.setAttribute('aria-label', label);
    els.sidebarToggle.setAttribute('title', label);
  };
  els.sidebarToggle.addEventListener('click', toggleSidebar);
  els.sidebarToggleMobile.addEventListener('click', toggleSidebar);

  els.newChatBtn.addEventListener('click', createNewChat);

  els.chatSearch.addEventListener('input', (e) => {
    searchChats(e.target.value);
  });

  els.chatList.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-chat-btn');
    if (deleteBtn) {
      e.stopPropagation();
      deleteChat(deleteBtn.dataset.chatId);
      return;
    }

    const chatItem = e.target.closest('.chat-item');
    if (chatItem) {
      selectChat(chatItem.dataset.chatId);
    }
  });

  // Header
  els.refreshModelsBtn.addEventListener('click', async () => {
    await loadModels();
    showToast('Models refreshed', 'success');
  });

  // Chat Input
  els.messageInput.addEventListener('input', () => {
    els.messageInput.style.height = 'auto';
    els.messageInput.style.height = Math.min(els.messageInput.scrollHeight, 150) + 'px';
  });

  els.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(els.messageInput.value.trim());
    }
  });

  els.clearBtn.addEventListener('click', () => {
    els.messageInput.value = '';
    els.messageInput.style.height = 'auto';
  });

  els.messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(els.messageInput.value.trim());
  });

  els.stopBtn.addEventListener('click', stopGenerating);

  // Settings
  els.settingsBtn.addEventListener('click', openSettings);
  els.settingsCloseBtn.addEventListener('click', closeSettings);
  els.saveSettingsBtn.addEventListener('click', saveSettings);

  els.temperatureInput.addEventListener('input', (e) => {
    els.temperatureValue.textContent = e.target.value;
  });

  els.testConnectionBtn.addEventListener('click', async () => {
    const url = els.ollamaUrlInput.value;
    try {
      if (window.api && window.api.ollama) {
        const connected = await window.api.ollama.checkConnection(url);
        if (connected) {
          els.settingsConnectionStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-white"></span> Connected successfully';
        } else {
          els.settingsConnectionStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Connection failed';
        }
      } else {
        els.settingsConnectionStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-gray-500"></span> API unavailable';
      }
    } catch (e) {
      els.settingsConnectionStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Error connecting';
    }
  });

  els.refreshModelsBtnSettings.addEventListener('click', loadModels);

  const setThemeBtns = (theme) => {
    els.themeDark.classList.toggle('bg-white', theme === 'dark');
    els.themeDark.classList.toggle('text-black', theme === 'dark');

    els.themeLight.classList.toggle('bg-white', theme === 'light');
    els.themeLight.classList.toggle('text-black', theme === 'light');

    els.themeSystem.classList.toggle('bg-white', theme === 'system');
    els.themeSystem.classList.toggle('text-black', theme === 'system');
  };

  els.themeDark.addEventListener('click', () => { state.settings.theme = 'dark'; setThemeBtns('dark'); applyTheme('dark'); });
  els.themeLight.addEventListener('click', () => { state.settings.theme = 'light'; setThemeBtns('light'); applyTheme('light'); });
  els.themeSystem.addEventListener('click', () => { state.settings.theme = 'system'; setThemeBtns('system'); applyTheme('system'); });

  els.clearAllChatsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
      state.chats = [];
      state.currentChatId = null;
      saveChats();
      renderChatList();
      renderWelcomeScreen();
      showToast('All conversations deleted', 'info');
      closeSettings();
    }
  });

  // Suggestion Cards
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.dataset.prompt;
      if (!state.currentChatId) {
        createNewChat();
      }
      els.messageInput.value = prompt;
      sendMessage(prompt);
    });
  });

  // Message Actions (Delegation)
  els.messagesContainer.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-response-btn');
    if (copyBtn) {
      const content = copyBtn.closest('.message-bubble').querySelector('.message-content').textContent;
      navigator.clipboard.writeText(content);
      showToast('Response copied!', 'success');
    }

    const regenBtn = e.target.closest('.regenerate-btn');
    if (regenBtn) {
      regenerateResponse();
    }
  });
}

function setupStreamListeners() {
  if (window.api && window.api.on) {
    window.api.on.streamChunk((chunk) => handleStreamChunk(chunk));
    window.api.on.streamEnd((data) => handleStreamEnd(data));
    window.api.on.streamError((error) => handleStreamError(error));
  }
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      createNewChat();
    }
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      els.chatSearch.focus();
    }
    if (e.key === 'Escape' && state.isGenerating) {
      e.preventDefault();
      stopGenerating();
    }
  });
}

// Data & Settings Load/Save
async function loadSettings() {
  if (window.api && window.api.storage) {
    try {
      const loaded = await window.api.storage.loadSettings();
      if (loaded) state.settings = { ...state.settings, ...loaded };
      return;
    } catch (e) { console.error('Error loading settings', e); }
  }
  const savedSettings = localStorage.getItem('aioSettings');
  if (savedSettings) {
    state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
  }
}

async function loadChats() {
  if (window.api && window.api.storage) {
    try {
      const loaded = await window.api.storage.loadChats();
      if (loaded) state.chats = loaded;
    } catch(e) { console.error('Error loading chats', e); }
  } else {
    const local = localStorage.getItem('aioChats');
    if (local) state.chats = JSON.parse(local);
  }

  state.chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function saveChats() {
  state.chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (window.api && window.api.storage) {
    window.api.storage.saveChats(state.chats);
  } else {
    localStorage.setItem('aioChats', JSON.stringify(state.chats));
  }
}

function saveSettingsToLocal() {
  if (window.api && window.api.storage) {
    window.api.storage.saveSettings(state.settings);
  } else {
    localStorage.setItem('aioSettings', JSON.stringify(state.settings));
  }
}

// Ollama interactions
async function checkConnection() {
  try {
    if (window.api && window.api.ollama) {
      state.isConnected = await window.api.ollama.checkConnection(state.settings.ollamaUrl);
    } else {
      state.isConnected = false;
    }

    if (state.isConnected) {
      els.connectionDot.className = 'w-2.5 h-2.5 rounded-full bg-white shrink-0 pulse-white';
      els.connectionText.textContent = 'Ollama Connected';
    } else {
      els.connectionDot.className = 'w-2.5 h-2.5 rounded-full bg-red-500 shrink-0';
      els.connectionText.textContent = 'Ollama Offline';
    }
  } catch (e) {
    state.isConnected = false;
  }
}

async function loadModels() {
  if (!state.isConnected) return;
  try {
    if (window.api && window.api.ollama) {
      state.models = await window.api.ollama.listModels(state.settings.ollamaUrl);

      els.modelSelector.innerHTML = '';
      els.defaultModelSelect.innerHTML = '<option value="">Select a model...</option>';

      state.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = model.name;

        els.modelSelector.appendChild(option.cloneNode(true));
        els.defaultModelSelect.appendChild(option);
      });

      const preferredModel = state.settings.defaultModel || 'qwen2.5-coder:1.5b';
      const targetModel = state.models.find(m => m.name === preferredModel) ||
                          state.models.find(m => m.name.includes('qwen2.5-coder')) ||
                          state.models[0];
      if (targetModel) {
        els.modelSelector.value = targetModel.name;
        if (els.defaultModelSelect) {
          els.defaultModelSelect.value = targetModel.name;
        }
      }
    }
  } catch(e) {
    console.error('Error loading models', e);
  }
}

function createNewChat() {
  const newChat = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    title: 'New Chat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    model: els.modelSelector.value || state.settings.defaultModel || (state.models[0] ? state.models[0].name : ''),
    messages: []
  };

  state.chats.unshift(newChat);
  saveChats();

  selectChat(newChat.id);
  renderChatList();
}

function selectChat(id) {
  state.currentChatId = id;
  const chat = state.chats.find(c => c.id === id);
  if (chat) {
    if (chat.model) els.modelSelector.value = chat.model;
    renderChatList(); // update active styling
    renderChatView();
    renderMessages();
  }
}

function deleteChat(id) {
  if (state.settings.confirmDelete) {
    if (!confirm('Are you sure you want to delete this chat?')) return;
  }

  state.chats = state.chats.filter(c => c.id !== id);
  saveChats();

  if (state.currentChatId === id) {
    state.currentChatId = null;
    if (state.chats.length > 0) {
      selectChat(state.chats[0].id);
    } else {
      renderWelcomeScreen();
    }
  }

  renderChatList();
}

function searchChats(query) {
  if (!query) {
    renderChatList();
    return;
  }

  const q = query.toLowerCase();
  const filtered = state.chats.filter(c => c.title.toLowerCase().includes(q));
  renderFilteredChatList(filtered);
}

function generateChatTitle(firstMessage) {
  return firstMessage.length > 40 ? firstMessage.substring(0, 40) + '...' : firstMessage;
}

async function sendMessage(content) {
  if (!content) return;

  if (!state.isConnected) {
    showErrorInChat('Ollama is not running. Start Ollama and try again. URL: ' + state.settings.ollamaUrl);
    return;
  }

  if (!state.currentChatId) {
    createNewChat();
  }

  const chat = state.chats.find(c => c.id === state.currentChatId);
  if (!chat) return;

  if (chat.messages.length === 0) {
    chat.title = generateChatTitle(content);
    renderChatList();
  }

  els.messageInput.value = '';
  els.messageInput.style.height = 'auto';

  const userMsg = {
    role: 'user',
    content: content,
    timestamp: new Date().toISOString()
  };

  chat.messages.push(userMsg);
  chat.updatedAt = new Date().toISOString();
  saveChats();

  renderChatView();
  addMessageToDOM('user', content, userMsg.timestamp);

  const messagesForApi = [];
  if (state.settings.systemPrompt) {
    messagesForApi.push({ role: 'system', content: state.settings.systemPrompt });
  }
  chat.messages.forEach(m => messagesForApi.push({ role: m.role, content: m.content }));

  const model = els.modelSelector.value;
  if (!model) {
    showToast('Please select a model first', 'error');
    return;
  }
  chat.model = model;

  state.isGenerating = true;
  state.currentStreamContent = '';
  els.sendBtn.classList.add('hidden');
  els.stopBtn.classList.remove('hidden');

  showTypingIndicator();
  scrollToBottom();

  if (window.api && window.api.ollama) {
    try {
      await window.api.ollama.chat({
        url: state.settings.ollamaUrl,
        model: model,
        messages: messagesForApi,
        options: { temperature: parseFloat(state.settings.temperature) }
      });
      // The stream handlers will take over
    } catch (e) {
      handleStreamError(e);
    }
  } else {
    // Mock response for browser env
    setTimeout(() => {
      handleStreamChunk('This is a simulated response because window.api is missing.');
      setTimeout(() => handleStreamEnd({}), 500);
    }, 1000);
  }
}

function stopGenerating() {
  if (window.api && window.api.ollama) {
    window.api.ollama.abort();
  }
  state.isGenerating = false;
  els.stopBtn.classList.add('hidden');
  els.sendBtn.classList.remove('hidden');
  removeTypingIndicator();
}

function regenerateResponse() {
  if (state.isGenerating || !state.currentChatId) return;
  const chat = state.chats.find(c => c.id === state.currentChatId);
  if (!chat || chat.messages.length === 0) return;

  // Remove last assistant message if present
  if (chat.messages[chat.messages.length - 1].role === 'assistant') {
    chat.messages.pop();
  }

  // Find last user message
  let lastUserMsg = null;
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    if (chat.messages[i].role === 'user') {
      lastUserMsg = chat.messages[i].content;
      break;
    }
  }

  if (lastUserMsg) {
    // Remove it so we can re-send it
    chat.messages.pop();
    renderMessages();
    sendMessage(lastUserMsg);
  }
}

// Stream Handlers
let currentAssistantMsgElement = null;

function handleStreamChunk(chunk) {
  if (state.currentStreamContent === '') {
    removeTypingIndicator();
    currentAssistantMsgElement = addMessageToDOM('assistant', '', new Date().toISOString());
  }

  state.currentStreamContent += chunk;
  updateStreamingMessage(currentAssistantMsgElement, state.currentStreamContent);
}

function handleStreamEnd(data) {
  state.isGenerating = false;
  els.stopBtn.classList.add('hidden');
  els.sendBtn.classList.remove('hidden');

  if (state.currentStreamContent && state.currentChatId) {
    const chat = state.chats.find(c => c.id === state.currentChatId);
    if (chat) {
      chat.messages.push({
        role: 'assistant',
        content: state.currentStreamContent,
        timestamp: new Date().toISOString()
      });
      chat.updatedAt = new Date().toISOString();
      saveChats();
      renderChatList(); // Updates ordering if needed

      // re-render the last message to ensure buttons are present
      renderMessages();
    }
  }

  state.currentStreamContent = '';
  currentAssistantMsgElement = null;
}

function handleStreamError(error) {
  state.isGenerating = false;
  els.stopBtn.classList.add('hidden');
  els.sendBtn.classList.remove('hidden');
  removeTypingIndicator();

  showErrorInChat('An error occurred: ' + (error.message || error));
}

// Rendering
function renderChatList() {
  renderFilteredChatList(state.chats);
}

function renderFilteredChatList(list) {
  els.chatList.innerHTML = '';
  list.forEach(chat => {
    const isActive = chat.id === state.currentChatId;
    const div = document.createElement('div');
    div.className = `chat-item group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-[#1c1c1c] text-white' : 'text-gray-400 hover:bg-[#161616]'}`;
    div.dataset.chatId = chat.id;

    div.innerHTML = `
      <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      <span class="flex-1 text-sm truncate">${escapeHTML(chat.title)}</span>
      <button class="delete-chat-btn opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition" data-chat-id="${chat.id}">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;
    els.chatList.appendChild(div);
  });
}

function renderWelcomeScreen() {
  els.welcomeScreen.classList.remove('hidden');
  els.messagesContainer.classList.add('hidden');
}

function renderChatView() {
  els.welcomeScreen.classList.add('hidden');
  els.messagesContainer.classList.remove('hidden');
}

function renderMessages() {
  els.messagesContainer.innerHTML = '';
  const chat = state.chats.find(c => c.id === state.currentChatId);
  if (!chat) return;

  chat.messages.forEach((msg, idx) => {
    const el = addMessageToDOM(msg.role, msg.content, msg.timestamp);
    if (msg.role === 'assistant' && idx === chat.messages.length - 1) {
      addMessageActions(el);
    } else if (msg.role === 'assistant') {
      addMessageActions(el, false);
    }
  });
  scrollToBottom();
}

function addMessageToDOM(role, content, timestamp) {
  const div = document.createElement('div');
  div.className = 'message-bubble flex gap-4 w-full message-fade-in ' + (role === 'user' ? 'justify-end' : 'justify-start');

  const timeStr = formatTime(timestamp);

  let innerHTML = '';

  if (role === 'user') {
    innerHTML = `
      <div class="flex flex-col items-end max-w-[85%]">
        <div class="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-4 text-gray-100 message-content break-words whitespace-pre-wrap">${escapeHTML(content)}</div>
        <span class="text-[11px] text-gray-600 mt-1">${timeStr}</span>
      </div>
    `;
  } else {
    // assistant
    let renderedContent = content;
    if (window.api && window.api.markdown) {
      renderedContent = window.api.markdown.render(content);
    } else {
      renderedContent = `<p>${escapeHTML(content)}</p>`;
    }

    innerHTML = `
      <div class="w-8 h-8 rounded-full bg-white/5 border border-[#2a2a2a] flex items-center justify-center shrink-0 mt-1">
        <svg class="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
      </div>
      <div class="flex flex-col items-start max-w-[85%]">
        <div class="bg-[#111111] border border-[#242424] rounded-2xl p-4 w-full overflow-hidden">
          <div class="message-content text-gray-200">${renderedContent}</div>
          <div class="message-actions mt-3 flex gap-2 hidden">
            <!-- actions added later -->
          </div>
        </div>
        <span class="text-[11px] text-gray-600 mt-1">${timeStr}</span>
      </div>
    `;
  }

  div.innerHTML = innerHTML;
  els.messagesContainer.appendChild(div);
  scrollToBottom();
  return div;
}

function updateStreamingMessage(element, content) {
  if (!element) return;
  const contentEl = element.querySelector('.message-content');
  if (contentEl) {
    if (window.api && window.api.markdown) {
      contentEl.innerHTML = window.api.markdown.render(content);
    } else {
      contentEl.textContent = content;
    }
    scrollToBottom();
  }
}

function addMessageActions(element, showRegen = true) {
  const actionsContainer = element.querySelector('.message-actions');
  if (!actionsContainer) return;

  actionsContainer.classList.remove('hidden');
  actionsContainer.innerHTML = `
    <button class="copy-response-btn flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-[#1c1c1c] hover:bg-[#242424] px-2 py-1 rounded transition-colors">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
      Copy
    </button>
    ${showRegen ? `
    <button class="regenerate-btn flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-[#1c1c1c] hover:bg-[#242424] px-2 py-1 rounded transition-colors">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
      Regenerate
    </button>
    ` : ''}
  `;
}

function showTypingIndicator() {
  removeTypingIndicator();
  const div = document.createElement('div');
  div.id = 'typing-indicator';
  div.className = 'flex items-start gap-4 w-full message-fade-in p-2';
  div.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-white/5 border border-[#2a2a2a] flex items-center justify-center shrink-0">
      <svg class="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
    </div>
    <div class="bg-[#111111] border border-[#242424] rounded-2xl p-4 flex items-center h-10">
      <div class="typing-indicator flex items-center gap-1">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  els.messagesContainer.appendChild(div);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function showErrorInChat(msg) {
  const div = document.createElement('div');
  div.className = 'flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 w-full max-w-4xl mx-auto my-4';
  div.innerHTML = `
    <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
    <div>
      <p class="font-medium text-sm">${escapeHTML(msg)}</p>
    </div>
  `;
  els.messagesContainer.appendChild(div);
  scrollToBottom();
}

// Settings Modal
function openSettings() {
  els.ollamaUrlInput.value = state.settings.ollamaUrl || 'http://localhost:11434';
  els.temperatureInput.value = state.settings.temperature || 0.7;
  els.temperatureValue.textContent = els.temperatureInput.value;
  els.systemPromptInput.value = state.settings.systemPrompt || '';
  els.confirmDeleteToggle.checked = state.settings.confirmDelete !== false;

  if (state.models.length > 0) {
    els.defaultModelSelect.value = state.settings.defaultModel || '';
  }

  els.settingsConnectionStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-gray-500"></span> Not tested yet';
  els.settingsModal.classList.remove('hidden');
}

function closeSettings() {
  els.settingsModal.classList.add('hidden');
}

function saveSettings() {
  state.settings.ollamaUrl = els.ollamaUrlInput.value;
  state.settings.defaultModel = els.defaultModelSelect.value;
  state.settings.temperature = parseFloat(els.temperatureInput.value);
  state.settings.systemPrompt = els.systemPromptInput.value;
  state.settings.confirmDelete = els.confirmDeleteToggle.checked;
  // theme already updated in state via buttons

  saveSettingsToLocal();
  applyTheme(state.settings.theme);
  checkConnection();
  showToast('Settings saved successfully', 'success');
  closeSettings();
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
    html.classList.remove('light');
  } else if (theme === 'light') {
    html.classList.add('light');
    html.classList.remove('dark');
  } else {
    // system
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      html.classList.add('light');
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
      html.classList.remove('light');
    }
  }
}

// Utilities
function scrollToBottom() {
  els.chatContainer.scrollTop = els.chatContainer.scrollHeight;
}

function formatTime(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch(e) {
    return '';
  }
}

function showToast(message, type = 'info') {
  const div = document.createElement('div');
  div.className = `toast fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg text-sm z-50 transition-all font-medium border ${type === 'success' ? 'bg-white text-black border-white' : type === 'error' ? 'bg-red-600 text-white border-red-600' : 'bg-[#1c1c1c] text-white border-[#2a2a2a]'}`;
  div.style.animation = 'fadeIn 0.3s ease-out';
  div.textContent = message;

  document.body.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transform = 'translateY(-10px)';
    setTimeout(() => div.remove(), 300);
  }, 3000);
}

function escapeHTML(str) {
  const p = document.createElement('p');
  p.appendChild(document.createTextNode(str));
  return p.innerHTML;
}
