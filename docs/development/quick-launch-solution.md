# 快速启动方案

## 1. 需求背景

用户需要在开发阶段频繁启动 Electron 应用进行 UI 验证，当前 `npm run electron:dev` 虽然可用，但需要每次打开终端并手动输入命令。用户希望有一种"一键启动"的方式，且不想每次都重新打包（electron-builder 打包耗时太长）。

**目标**：创建一个桌面快捷方式，双击即可启动开发模式的应用，Vite 热更新保持生效，代码改动后无需重启。

## 2. 当前开发模式分析

当前 `package.json` 中的启动命令：

```json
"electron:dev": "concurrently \"vite\" \"wait-on http://localhost:1234 && cross-env NODE_ENV=development electron .\""
```

流程：concurrently 并行启动 Vite dev server (port 1234) 和 Electron，Electron 等待 Vite 就绪后加载 `http://localhost:1234`。

**问题**：
- 需要打开终端 → 切到项目目录 → 输入命令
- `electron/main.ts` 需要先编译为 `electron/dist/main.js`（当前由 `electron:compile` 脚本处理）
- 如果 Electron 主进程代码有改动，需要重新编译 + 重启

## 3. 方案设计

### 3.1 创建启动脚本

在项目根目录创建两个文件：

#### `start-dev.bat`（双击入口）

```bat
@echo off
title Project Manager - Dev Mode
cd /d "%~dp0"
echo ========================================
echo   Project Manager - Development Mode
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [!] node_modules not found, running npm install...
    call npm install
    echo.
)

:: Compile electron main process TypeScript
echo [*] Compiling Electron main process...
call npx tsc -p electron/tsconfig.json
echo.

:: Start Vite + Electron
echo [*] Starting dev server and Electron...
call npx concurrently "npx vite" "npx wait-on http://localhost:1234 && npx cross-env NODE_ENV=development npx electron ."

pause
```

**说明**：
- `cd /d "%~dp0"` 确保无论从哪启动，工作目录都切换到脚本所在目录（即项目根目录）
- 自动检查 `node_modules`，首次运行自动安装依赖
- 自动编译 Electron 主进程 TypeScript
- 最后的 `pause` 让用户在出错时能看到错误信息

#### `start-dev-quick.bat`（跳过编译的快速版本）

```bat
@echo off
title Project Manager - Dev Mode (Quick)
cd /d "%~dp0"
echo [*] Starting dev server and Electron (quick mode)...
call npx concurrently "npx vite" "npx wait-on http://localhost:1234 && npx cross-env NODE_ENV=development npx electron ."
pause
```

**说明**：适用于 Electron 主进程代码没有改动、只改了前端代码的情况。跳过 TypeScript 编译步骤，启动更快。

### 3.2 创建桌面快捷方式

使用 PowerShell 脚本自动创建快捷方式：

#### `create-shortcut.ps1`

```powershell
$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath('Desktop')
$ProjectRoot = $PSScriptRoot

# Create shortcut for full dev mode
$Shortcut = $WshShell.CreateShortcut("$Desktop\项目管理助手 (Dev).lnk")
$Shortcut.TargetPath = "$ProjectRoot\start-dev.bat"
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.IconLocation = "shell32.dll,176"  # Use a system icon as placeholder
$Shortcut.Description = "项目管理助手 - 开发模式（含编译）"
$Shortcut.Save()

# Create shortcut for quick dev mode
$Shortcut2 = $WshShell.CreateShortcut("$Desktop\项目管理助手 (Quick).lnk")
$Shortcut2.TargetPath = "$ProjectRoot\start-dev-quick.bat"
$Shortcut2.WorkingDirectory = $ProjectRoot
$Shortcut2.IconLocation = "shell32.dll,176"
$Shortcut2.Description = "项目管理助手 - 快速启动（跳过编译）"
$Shortcut2.Save()

Write-Host "Desktop shortcuts created successfully!" -ForegroundColor Green
Write-Host "  - 项目管理助手 (Dev).lnk   : Full dev mode with TypeScript compile"
Write-Host "  - 项目管理助手 (Quick).lnk : Quick start, skip compile"
```

### 3.3 可选：应用图标

后续可用 `electron-builder` 的 icon 配置生成 `.ico` 文件，替换快捷方式的 `IconLocation`，让桌面快捷方式显示应用自己的图标。当前阶段使用系统图标即可。

## 4. 使用场景说明

| 场景 | 使用方式 | 说明 |
|------|----------|------|
| 首次启动 / 依赖变更后 | 双击 `项目管理助手 (Dev).lnk` | 自动 npm install + 编译 + 启动 |
| 只改了前端代码 | 双击 `项目管理助手 (Quick).lnk` | 跳过编译，最快启动 |
| 改了 Electron 主进程代码 | 双击 `项目管理助手 (Dev).lnk` | 需要重新编译 main.ts |
| 只改了样式/CSS | 无需重启 | Vite HMR 自动热更新 |
| 在终端中使用 | `npm run electron:dev` | 原有方式不变 |

## 5. Vite HMR 支持

Vite dev server 的 HMR（Hot Module Replacement）在 Electron 中正常工作：
- 前端 `.tsx` / `.css` 文件修改 → 浏览器自动热更新，无需重启 Electron
- Electron 主进程 `electron/*.ts` 修改 → 需要重新编译 + 重启 Electron
- `electron/preload.ts` 修改 → 需要重新编译 + 重启 Electron

## 6. 实施步骤

1. 在项目根目录创建 `start-dev.bat`
2. 在项目根目录创建 `start-dev-quick.bat`
3. 在项目根目录创建 `create-shortcut.ps1`
4. 运行 `create-shortcut.ps1` 创建桌面快捷方式
5. 在 `.gitignore` 中排除这些文件（可选，也可以提交到仓库）

## 7. 文件清单

| 文件 | 位置 | 用途 |
|------|------|------|
| `start-dev.bat` | 项目根目录 | 完整开发模式启动（含编译） |
| `start-dev-quick.bat` | 项目根目录 | 快速开发模式启动（跳过编译） |
| `create-shortcut.ps1` | 项目根目录 | 一次性运行，创建桌面快捷方式 |
