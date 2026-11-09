# Pomodoro Orb

A 60 px pomodoro orb that floats above everything on your macOS desktop. No Dock icon, no window to manage — one hotkey (Option+L by default) or a single click gives you a focus timer, a break timer, and a stopwatch with lap marks.

[简体中文](README.zh-CN.md)

<img src="docs/icon.png" width="128" alt="Pomodoro Orb icon">

## Why another pomodoro app

Because a timer should stay out of the way until the moment you need it. The orb is transparent, frameless, always on top, draggable across monitors, and remembers where you left it. It is silent by design — no sounds, no notifications, no popups.

## Features

- **Floating orb** — 60×60, frameless and transparent, always on top on every Space, draggable anywhere (including across monitors), position persisted between launches.
- **Focus / Break timers** — ring progress plus a color badge right on the orb; presets 15 / 25 / 45 / 60 min for focus and 5 / 10 / 15 min for break.
- **Stopwatch with laps** — count up and mark segments (for example, one reading passage); every finished session is logged.
- **Today's stats** — total focus time, total break time, and a list of today's sessions (focus / break / stopwatch).
- **Menu bar companion** — 🍅 in the menu bar to show or hide the orb, move it to the top-right of the current screen, toggle launch at login, or quit.
- **Global hotkey** — Option+L by default, changeable in Settings.
- **Launch at login** — implemented with a per-user LaunchAgent.
- **Follows macOS appearance** — light and dark themes.
- **Fully local** — state lives in `localStorage`; the app makes no network requests.

## Requirements

- macOS (developed on Apple Silicon)
- Node.js 18+
- Electron 33

## Run from source

```bash
git clone https://github.com/davidzhang0258-cloud/pomodoro-orb.git
cd pomodoro-orb
npm install
npm start
```

`npm install` downloads the Electron binary (about 100 MB) the first time.

## Usage

- Hover the orb to open the panel; click the orb to pin it open; click again to unpin.
- Hold and drag the orb to move it — the position is remembered between launches.
- Press Option+L to show or hide the orb; change the shortcut in ⚙️ Settings.
- Multi-monitor: menu bar 🍅 → “Move to the top-right of the screen under the cursor”.

## How it works

Two files, no framework, no build step:

- `main.js` — the Electron main process: frameless transparent window, always-on-top and visible on all workspaces, cross-monitor dragging by polling the global cursor position, tray menu, global shortcut, LaunchAgent auto-start, and a single-instance lock.
- `index.html` — the entire UI in one file: the focus / break / stopwatch state machine, rendering, and `localStorage` persistence. It talks to the main process over a handful of IPC channels.

## Known limitations

- macOS only — it relies on `app.dock`, LaunchAgents, and multi-display APIs.
- Not signed or notarized. Build your own `.app` if you want to use it on another machine, otherwise Gatekeeper will complain.
- “Launch at login” writes `~/Library/LaunchAgents/com.pomodoro.orb.plist` pointing at the app bundle path, so it only makes sense for a packaged `.app`, not for `npm start`.
- Silent by design: no audio and no system notifications.

## License

[MIT](LICENSE) © 2026 davidzhang0258-cloud
