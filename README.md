# Local Chat

A minimal, offline, black-and-white desktop chat UI for local [Ollama](https://ollama.com) models — built with Electron. Once installed, it never talks to the internet: everything runs against your local Ollama server.

## Install (if you just want to use the app)

You don't need Node, npm, or this source code — grab a built release from the [Releases page](../../releases) and:

**Linux — `.deb` (recommended, integrates with your app menu):**
```bash
sudo dpkg -i local-chat_1.0.0_amd64.deb
```
Then launch "Local Chat" from your applications menu, or run `local-chat` in a terminal. Uninstall anytime with `sudo apt remove local-chat`.

**Linux — `.AppImage` (no install, portable):**
```bash
chmod +x "Local Chat-1.0.0.AppImage"
./"Local Chat-1.0.0.AppImage"
```


One prerequisite either way: you need [Ollama](https://ollama.com/download) installed and at least one model pulled, since this app is just a chat interface for it:
```bash
ollama pull qwen2.5-coder:1.5b
```

## Prerequisites (for building from source instead)

- [Node.js](https://nodejs.org) 18+ and npm
- [Ollama](https://ollama.com) installed and at least one model pulled

## Setup

```bash
npm install
npm start
```

## Using it

- **New chat** — top of the sidebar, or `Ctrl/Cmd+N`
- **Search chats** — `Ctrl/Cmd+K` focuses the search box
- **Stop a response** — click Stop, or press `Esc` while generating
- **Change model / temperature / system prompt** — gear icon in the sidebar footer
- **Regenerate / copy** — hover the buttons under the last assistant reply
- **Collapse the sidebar** — arrow button top-left of the sidebar

Chats and settings are saved to disk under Electron's per-OS app-data folder, so they persist across restarts without any cloud sync.



e
## License

MIT
