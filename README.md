# Local Chat

A minimal, offline, black-and-white desktop chat UI for local [Ollama](https://ollama.com) models — built with Electron. Once installed, it never talks to the internet: everything runs against your local Ollama server.

## Prerequisites

- [Node.js](https://nodejs.org) 18+ and npm
- [Ollama](https://ollama.com) installed and at least one model pulled, e.g.:
  ```
  ollama pull qwen2.5-coder:1.5b
  ```

## Setup

```bash
npm install
npm start
```

That's it — the app opens, checks for Ollama on `http://localhost:11434`, and lists your installed models in the header dropdown.

## Using it

- **New chat** — top of the sidebar, or `Ctrl/Cmd+N`
- **Search chats** — `Ctrl/Cmd+K` focuses the search box
- **Stop a response** — click Stop, or press `Esc` while generating
- **Change model / temperature / system prompt** — gear icon in the sidebar footer
- **Regenerate / copy** — hover the buttons under the last assistant reply

Chats and settings are saved to disk under Electron's per-OS app-data folder (via `main.js`'s storage handlers), so they persist across restarts without any cloud sync.

## Project structure

```
main.js          Electron main process — creates the window, talks to Ollama's HTTP API,
                  streams responses back to the renderer, reads/writes chats & settings to disk
preload.js       contextBridge — exposes a safe window.api to the renderer, wires up
                  Markdown rendering (marked) for assistant messages
renderer.js      All UI logic: chat state, DOM rendering, event handling
index.html       App shell / layout
styles/
  tailwind.css   Precompiled Tailwind utilities (offline — no CDN)
  app.css        Fonts, animations, scrollbars, light-theme overrides
```

## Customizing the look

The UI classes are Tailwind utilities compiled ahead of time into `styles/tailwind.css`, so there's no runtime dependency on the Tailwind CDN. If you edit `index.html` or `renderer.js` and add new utility classes, rebuild the stylesheet:

```bash
npx tailwindcss -i styles/tailwind-input.css -o styles/tailwind.css --minify
```

## Building an installer to share with other people

[electron-builder](https://www.electron.build/) is already configured in `package.json`. After `npm install`, build an installer for the platform you're on:

```bash
npm run dist:win     # -> dist/Local Chat Setup <version>.exe   (NSIS installer)
npm run dist:mac     # -> dist/Local Chat-<version>.dmg
npm run dist:linux   # -> dist/Local Chat-<version>.AppImage and .deb
```

The finished file lands in `dist/`. That single file is what you hand to someone else — they run it like any other installer/app, no Node or npm required on their end.

**Important limitation:** electron-builder can only reliably build for the OS it's running on (a Mac can build Mac + Linux, Windows builds Windows, etc.) unless you set up cross-compilation tooling (Wine for Windows builds on Linux/Mac, for example). If you need installers for all three platforms, the simplest path is running the matching `npm run dist:*` command on a machine (or CI runner, e.g. GitHub Actions) of each OS.

**What each person still needs on their own machine:** Ollama itself. This app is a client for Ollama's local API — it doesn't bundle Ollama or any models. Each person you share it with needs to separately install Ollama (https://ollama.com/download) and pull at least one model (`ollama pull qwen2.5-coder:1.5b`) before the chat will work. There's no way around this without bundling and shipping model weights (multi-GB per model) inside your installer, which isn't practical for most distributions.

**Optional — a custom icon:** without one, electron-builder uses Electron's default icon. To set your own, add `build/icon.ico` (Windows), `build/icon.icns` (Mac), and `build/icon.png` (512x512+, Linux), then add `"icon": "build/icon.ico"` etc. under the relevant platform key in `package.json`'s `build` section.
