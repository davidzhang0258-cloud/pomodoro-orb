# 番茄钟悬浮球 · Pomodoro Orb

一个 60 像素的番茄悬浮球，常驻在 macOS 或 Windows 桌面最上层。没有 Dock / 任务栏图标，没有需要管理的窗口 —— 按一个快捷键（默认 Alt+L）或点一下圆球，就能拿到专注计时、休息计时，以及带分段记录的正计时。

[English](README.md)

<img src="docs/icon.png" width="128" alt="番茄钟悬浮球图标">

**下载：**[Windows 10+ 免安装版（v1.0.0）](https://github.com/davidzhang0258-cloud/pomodoro-orb/releases/latest) —— 或者从源码运行。

## 为什么还要再做一个番茄钟

因为计时器就该在你不需要它的时候彻底隐身。悬浮球透明、无边框、始终置顶、可跨显示器拖动，还会记住你把它放在哪里。它刻意保持安静 —— 没有提示音、没有系统通知、没有弹窗。

## 功能

- **桌面悬浮球** —— 60×60，无边框透明，始终置顶，按住即可拖到任意位置（含跨显示器），退出重开还停在原处。macOS 上还会显示在所有桌面（Space）。
- **专注 / 休息双计时** —— 圆球上有环形进度和颜色徽章；专注时长预设 15 / 25 / 45 / 60 分钟，休息预设 5 / 10 / 15 分钟。
- **带分段记录的正计时** —— 往正方向计时，随时「记一段」，适合给单篇阅读、单项任务掐表；每段结束都会入库。
- **今日统计** —— 今日专注总时长、今日休息总时长，以及今日记录列表（专注 / 休息 / 正计时）。
- **菜单栏 / 通知区域** —— macOS 菜单栏显示 🍅，Windows 通知区域显示番茄图标（双击可显示 / 隐藏）。菜单里有：显示或隐藏悬浮球、移到当前鼠标所在屏幕的右上角、开机自启动开关、退出。
- **全局快捷键** —— 默认 Alt+L，可在设置里改。
- **开机自启动** —— macOS 走 LaunchAgent，Windows 走登录启动项（注册表 `Run`）。
- **跟随系统深浅色** —— 自动切换浅色 / 深色主题。
- **数据全部本地** —— 状态存在 `localStorage`，App 不发任何网络请求。

## 环境要求

| 平台 | 最低版本 |
|---|---|
| macOS | macOS 11 及以上（Apple Silicon / Intel） |
| Windows | Windows 10 及以上，64 位 |

只有从源码运行时才需要 Node.js 18+ 和 Electron 33。

## Windows 安装

1. 从 [Releases](https://github.com/davidzhang0258-cloud/pomodoro-orb/releases/latest) 下载 `PomodoroOrb-1.0.0-win-x64-portable.zip`。
2. 把整个文件夹解压到一个固定位置（例如 `D:\Apps\PomodoroOrb`）。
3. 双击 `PomodoroOrb.exe`。

这个版本没有代码签名，首次运行 Windows SmartScreen 会拦一下：点 **更多信息 → 仍要运行**。解压后的文件夹要整体保留 —— 它是免安装版，不是安装程序。

## 从源码运行

```bash
git clone https://github.com/davidzhang0258-cloud/pomodoro-orb.git
cd pomodoro-orb
npm install
npm start
```

首次 `npm install` 会下载 Electron 二进制（约 100 MB）。

## 使用说明

- 鼠标移到圆球上展开面板；单击圆球固定展开；再单击取消固定。
- 按住圆球拖动即可移动位置，下次启动还在这里。
- 按 Alt+L（macOS 上显示为 Option+L）显示或隐藏悬浮球；快捷键可在 ⚙️ 设置里修改。
- 多显示器：托盘菜单 →「移到当前鼠标所在屏幕右上角」。

## 打包安装包

```bash
npm run dist:win   # NSIS 安装包 + 免安装 exe（建议在 Windows 上跑）
npm run dist:mac   # dmg（在 macOS 上跑）
```

`electron-builder` 在 Windows 用 `assets/icon.ico`，在 macOS 用 `assets/icon.icns`。在 macOS 上打 Windows 包需要 Wine，所以 `dist:win` 在 Windows 机器上执行最省事。

## 实现方式

只有两个文件，没有框架、没有构建步骤：

- `main.js` —— Electron 主进程：无边框透明窗口、始终置顶、轮询全局鼠标坐标实现跨屏拖拽、托盘菜单、全局快捷键、开机自启动、单实例锁。平台相关部分（Dock 隐藏、Space、LaunchAgent）都用 `process.platform` 做了判断。
- `index.html` —— 整个界面都在一个文件里：专注 / 休息 / 正计时的状态机、渲染，以及 `localStorage` 持久化。与主进程之间只通过少量 IPC 通道通信。

## 已知限制

- 两个平台都没有代码签名：macOS 会被 Gatekeeper 拦，Windows 会被 SmartScreen 拦。
- Windows 版只有 64 位免安装版，仓库里不含安装包（需要时用 `npm run dist:win` 自己打）。
- Windows 上窗口按设计不在任务栏和 Alt+Tab 里出现，请用通知区域图标或快捷键。
- Windows 的「开机自启动」记录的是当前 exe 路径，如果打算挪动文件夹，请先启动一次再开启该选项。
- 刻意保持安静：没有提示音，也没有系统通知。

## 许可协议

[MIT](LICENSE) © 2026 davidzhang0258-cloud
