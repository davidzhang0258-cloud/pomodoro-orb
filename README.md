# Pomodoro Orb

A 60 px pomodoro orb that floats above everything on your macOS or Windows desktop. No Dock or taskbar entry, no window to manage — one hotkey (Alt+L by default) or a single click gives you a focus timer, a break timer, and a stopwatch with lap marks.

[简体中文](README.zh-CN.md)

<img src="docs/icon.png" width="128" alt="Pomodoro Orb icon">

**Download:** [Windows 10+ portable build (v1.0.0)](https://github.com/davidzhang0258-cloud/pomodoro-orb/releases/latest) — or run from source.

## Why another pomodoro app

Because a timer should stay out of the way until the moment you need it. The orb is transparent, frameless, always on top, draggable across monitors, and remembers where you left it. It is silent by design — no sounds, no notifications, no popups.

## Features

- **Floating orb** — 60×60, frameless and transparent, always on top, draggable anywhere (including across monitors), position persisted between launches. On macOS it also shows on every Space.
- **Focus / Break timers** — ring progress plus a color badge right on the orb; presets 15 / 25 / 45 / 60 min for focus and 5 / 10 / 15 min for break.
- **Stopwatch with laps** — count up and mark segments (for example, one reading passage); every finished session is logged.
- **Today's stats** — total focus time, total break time, and a list of today's sessions (focus / break / stopwatch).
- **Menu bar / notification area** — 🍅 in the macOS menu bar, a tomato icon in the Windows notification area (double-click toggles the orb). From there: show or hide the orb, move it to the top-right of the current screen, toggle launch at login, or quit.
- **Global hotkey** — Alt+L by default, changeable in Settings.
- **Launch at login** — LaunchAgent on macOS, a login item (registry `Run` key) on Windows.
- **Follows the system theme** — light and dark.
- **Fully local** — state lives in `localStorage`; the app makes no network requests.

## Requirements

| Platform | Minimum |
|---|---|
| macOS | macOS 11 or later (Apple Silicon or Intel) |
| Windows | Windows 10 or later, 64-bit |

Node.js 18+ and Electron 33 are needed only when running from source.

## Install on Windows

1. Download `PomodoroOrb-1.0.0-win-x64.zip` from [Releases](https://github.com/davidzhang0258-cloud/pomodoro-orb/releases/latest).
2. Extract the whole folder somewhere permanent (for example `D:\Apps\PomodoroOrb`).
3. Run `PomodoroOrb.exe`.

The build is not code-signed, so Windows SmartScreen will warn you the first time: choose **More info → Run anyway**. Keep the extracted folder intact — it is a portable app, not an installer.

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
- Press Alt+L (macOS: Option+L) to show or hide the orb; change the shortcut in ⚙️ Settings.
- Multi-monitor: tray menu → “Move to the top-right of the screen under the cursor”.

## Build installers

```bash
npm run dist:win   # NSIS installer + portable exe (run this on Windows)
npm run dist:mac   # dmg (run this on macOS)
```

`electron-builder` uses `assets/icon.ico` for Windows and `assets/icon.icns` for macOS. Building Windows targets on macOS requires Wine, so running `dist:win` on a Windows machine is the least painful path.

## How it works

Two files, no framework, no build step:

- `main.js` — the Electron main process: frameless transparent window, always-on-top, cross-monitor dragging by polling the global cursor position, tray menu, global shortcut, launch-at-login, and a single-instance lock. Platform-specific pieces (Dock hiding, Spaces, LaunchAgent) are guarded by `process.platform`.
- `index.html` — the entire UI in one file: the focus / break / stopwatch state machine, rendering, and `localStorage` persistence. It talks to the main process over a handful of IPC channels.

## Known limitations

- Not code-signed on either platform: Gatekeeper on macOS and SmartScreen on Windows will warn you.
- The Windows build is 64-bit only and portable; there is no installer in the repo (build one with `npm run dist:win`).
- By design the window is hidden from the taskbar and Alt-Tab on Windows; use the notification-area icon or the hotkey instead.
- “Launch at login” on Windows points at the exe you are running, so move the folder before enabling it if you plan to relocate the app.
- Silent by design: no audio and no system notifications.

## License

[MIT](LICENSE) © 2026 davidzhang0258-cloud
