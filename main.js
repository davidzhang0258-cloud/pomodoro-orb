const { app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray, nativeImage, nativeTheme, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const IS_MAC = process.platform === 'darwin';
const IS_WIN = process.platform === 'win32';

// 跟随系统深浅色模式
nativeTheme.themeSource = 'system';

// Windows 任务栏分组 / 通知归属需要 AppUserModelID
if (IS_WIN) app.setAppUserModelId('com.pomodoro.orb');

if (IS_MAC && app.dock) {
  app.dock.hide();
}

// 快捷键显示文案：mac 叫 Option，Windows 叫 Alt / Ctrl
function prettyHotkey(accel) {
  return IS_MAC ? accel.replace('Alt', 'Option') : accel.replace(/CommandOrControl|Command|Cmd/g, 'Ctrl');
}

let win = null;
let tray = null;
let dragTimer = null;
const WIN_WIDTH = 350;
const WIN_HEIGHT = 600;

// 当前运行的 .app 包路径（Resources/app 上三级）
const BUNDLE_PATH = path.dirname(path.dirname(path.dirname(app.getAppPath())));
const POS_FILE = path.join(app.getPath('userData'), 'orb-position.json');
const CFG_FILE = path.join(app.getPath('userData'), 'config.json');
const AGENT_LABEL = 'com.pomodoro.orb';
const AGENT_PLIST = path.join(app.getPath('home'), 'Library', 'LaunchAgents', AGENT_LABEL + '.plist');

// 快捷键（可在设置里改，存 userData/config.json）
let hotkey = 'Alt+L';
try {
  const cfg = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8'));
  if (cfg && typeof cfg.hotkey === 'string') hotkey = cfg.hotkey;
} catch {}

function saveConfig() {
  try { fs.writeFileSync(CFG_FILE, JSON.stringify({ hotkey })); } catch {}
}

// ---------- 悬浮球位置持久化（记住用户放的位置） ----------
function savePosition() {
  if (!win) return;
  try {
    const b = win.getBounds();
    fs.writeFileSync(POS_FILE, JSON.stringify({ x: b.x, y: b.y }));
  } catch {}
}

function loadPosition() {
  try {
    const p = JSON.parse(fs.readFileSync(POS_FILE, 'utf8'));
    if (typeof p.x === 'number' && typeof p.y === 'number') {
      const onScreen = screen.getAllDisplays().some((d) => {
        const a = d.workArea;
        return p.x >= a.x - 40 && p.x <= a.x + a.width - 40 && p.y >= a.y && p.y <= a.y + a.height - 40;
      });
      if (onScreen) return { x: p.x, y: p.y };
    }
  } catch {}
  return null;
}

// macOS 专属：窗口显示在所有桌面（Space）；Windows 上该调用无意义
function setOnAllSpaces(on) {
  if (IS_MAC) win.setVisibleOnAllWorkspaces(on);
}

// 移到指定屏幕右上角（仅手动触发：托盘菜单 / 设置按钮）
function attachToDisplay(display) {
  if (!win) return;
  const { x: areaX, y: areaY, width: areaW } = display.workArea;
  setOnAllSpaces(false);
  win.setBounds({
    x: areaX + Math.max(20, areaW - WIN_WIDTH - 24),
    y: areaY + 60,
    width: WIN_WIDTH,
    height: WIN_HEIGHT
  });
  setOnAllSpaces(true);
  savePosition();
}

// 拖拽结束后：把 all-workspaces 重新挂到窗口当前所在屏幕，并记住位置
function reattachToWindowDisplay() {
  if (!win) return;
  const bounds = win.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  setOnAllSpaces(false);
  setOnAllSpaces(true);
  savePosition();
  // Windows 拖动结束后重新声明置顶，避免被其他置顶窗口压住
  if (IS_WIN) win.setAlwaysOnTop(true, 'screen-saver');
}

function createWindow() {
  const saved = loadPosition();
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { x: areaX, y: areaY, width: areaW } = display.workArea;

  const pos = saved || {
    x: areaX + Math.max(20, areaW - WIN_WIDTH - 24),
    y: areaY + 60
  };

  win = new BrowserWindow({
    width: WIN_WIDTH,
    height: WIN_HEIGHT,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  setOnAllSpaces(true);
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, 'index.html'));
}

function moveToCurrentScreen() {
  if (!win) return;
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  attachToDisplay(display);
  win.showInactive();
  win.setAlwaysOnTop(true, 'screen-saver');
}

function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) {
    win.hide();
  } else {
    win.showInactive();
    win.setAlwaysOnTop(true, 'screen-saver');
  }
  updateTrayMenu();
}

function createTray() {
  if (IS_MAC) {
    // macOS：空图标 + emoji 标题，跟随菜单栏深浅色
    tray = new Tray(nativeImage.createEmpty());
    tray.setTitle('🍅');
  } else {
    // Windows：菜单栏（通知区域）必须给真实图标
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png')));
    tray.on('double-click', () => toggleWindow());
  }
  tray.setToolTip(`番茄钟悬浮球 (${prettyHotkey(hotkey)} 呼出/隐藏)`);
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: win && win.isVisible() ? `隐藏悬浮球 (${prettyHotkey(hotkey)})` : `显示悬浮球 (${prettyHotkey(hotkey)})`,
      click: () => toggleWindow()
    },
    {
      label: '🖥 移到当前鼠标所在的屏幕右上角',
      click: () => moveToCurrentScreen()
    },
    {
      label: agentEnabled() ? '✓ 开机自启动（点击关闭）' : '开机自启动（点击开启）',
      click: () => {
        setAutoStart(!agentEnabled());
        updateTrayMenu();
      }
    },
    { type: 'separator' },
    { label: '退出番茄钟', click: () => app.quit() }
  ]));
}

// ---------- 开机自启动 ----------
function agentEnabled() {
  if (IS_MAC) return fs.existsSync(AGENT_PLIST);
  try { return app.getLoginItemSettings().openAtLogin; } catch { return false; }
}

function writeAgentPlist() {
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pomodoro.orb</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/open</string>
        <string>${BUNDLE_PATH}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>LimitLoadToSessionType</key>
    <string>Aqua</string>
</dict>
</plist>
`;
  try { fs.writeFileSync(AGENT_PLIST, plist); } catch {}
}

function setAutoStart(enabled) {
  if (IS_WIN) {
    // Windows：写注册表 Run 项（打包后 process.execPath 就是 exe 本体）
    try {
      app.setLoginItemSettings({ openAtLogin: enabled, path: process.execPath });
    } catch {}
    return;
  }
  try {
    if (enabled) {
      writeAgentPlist();
      exec(`launchctl load -w "${AGENT_PLIST}"`, () => {});
    } else {
      exec(`launchctl unload "${AGENT_PLIST}"`, () => {});
      fs.unlinkSync(AGENT_PLIST);
    }
  } catch {}
}

// ---------- 设置 IPC ----------
ipcMain.handle('pomo:get-settings', () => ({
  hotkey,
  autoStart: agentEnabled()
}));

ipcMain.handle('pomo:set-auto-start', (_event, enabled) => {
  setAutoStart(Boolean(enabled));
  return agentEnabled();
});

ipcMain.handle('pomo:set-hotkey', (_event, accel) => {
  if (typeof accel !== 'string' || !accel.trim()) return { hotkey, ok: false };
  globalShortcut.unregister(hotkey);
  const ok = globalShortcut.register(accel, toggleWindow);
  if (ok) {
    hotkey = accel;
    saveConfig();
    if (tray) tray.setToolTip(`番茄钟悬浮球 (${prettyHotkey(hotkey)} 呼出/隐藏)`);
    updateTrayMenu();
  } else {
    globalShortcut.register(hotkey, toggleWindow);
  }
  return { hotkey, ok };
});

ipcMain.on('pomo:move-screen', () => moveToCurrentScreen());

// ---------- 悬浮球交互 IPC ----------
ipcMain.on('pomo:set-ignore-mouse', (_event, ignore) => {
  if (!win || dragTimer) return;
  win.setIgnoreMouseEvents(Boolean(ignore), ignore ? { forward: true } : undefined);
});

// 使用 macOS 系统级全局鼠标坐标实现跨外接显示器丝滑拖拽
ipcMain.on('pomo:drag-start', () => {
  if (!win) return;
  if (dragTimer) clearInterval(dragTimer);
  const startCursor = screen.getCursorScreenPoint();
  const startBounds = win.getBounds();
  const offsetX = startCursor.x - startBounds.x;
  const offsetY = startCursor.y - startBounds.y;

  win.setIgnoreMouseEvents(false);
  dragTimer = setInterval(() => {
    if (!win) return;
    const cur = screen.getCursorScreenPoint();
    win.setBounds({
      x: Math.round(cur.x - offsetX),
      y: Math.round(cur.y - offsetY),
      width: WIN_WIDTH,
      height: WIN_HEIGHT
    });
  }, 16);
});

ipcMain.on('pomo:drag-end', () => {
  if (dragTimer) {
    clearInterval(dragTimer);
    dragTimer = null;
  }
  reattachToWindowDisplay();
});

ipcMain.on('pomo:hide-window', () => {
  if (win && win.isVisible()) {
    win.hide();
    updateTrayMenu();
  }
});

// 单实例锁：防止重复启动导致多个悬浮球叠加出现
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      win.showInactive();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    globalShortcut.register(hotkey, toggleWindow);
  });
}

app.on('will-quit', () => {
  if (dragTimer) clearInterval(dragTimer);
  savePosition();
  globalShortcut.unregisterAll();
});
