import { app, BrowserWindow, session } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase } from './database'
import { initDefaultSettings } from './database/settings'
import { registerProjectHandlers } from './ipc/project-handlers'
import { registerFileHandlers } from './ipc/file-handlers'
import { registerSettingsHandlers } from './ipc/settings-handlers'
import { registerAIHandlers } from './ipc/ai-handlers'
import { SignatureDetector } from './services/signature-detector'

// 使用 app.isPackaged 判断环境，比 process.env.NODE_ENV 更可靠
const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'PMAer',
    icon: isDev
      ? path.join(__dirname, '../build/icon.256x256.png')
      : path.join(process.resourcesPath, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:1234')
  } else {
    const indexPath = path.join(__dirname, '../../dist/index.html')
    console.log('Loading index from:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  // 渲染进程崩溃诊断
  mainWindow.on('unresponsive', () => {
    console.error('=== 渲染进程无响应 ===')
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('=== 渲染进程异常退出 ===')
    console.error('reason:', details.reason)
    console.error('exitCode:', details.exitCode)
  })

  // 仅在开发模式下打开DevTools
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' as const }))
}

function setupSecurityHeaders() {
  // 使用 isDev 判断，打包后的应用会启用CSP
  const csp = isDev
    ? "default-src 'self' http://localhost:1234 'unsafe-inline'; connect-src 'self' ws://localhost:1234 https:"
    : [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "object-src 'none'",
        "frame-src 'none'",
        "connect-src 'self' https:",  // 允许AI厂商HTTPS连接
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    })
  })

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })
}

app.whenReady().then(async () => {
  await initDatabase()
  initDefaultSettings()

  registerProjectHandlers()
  registerFileHandlers()
  registerSettingsHandlers()
  registerAIHandlers()

  SignatureDetector.init()

  setupSecurityHeaders()

  createWindow()
}).catch((error) => {
  console.error('应用初始化失败:', error)
  const { dialog } = require('electron')
  dialog.showErrorBox('启动失败', `应用初始化失败: ${error.message}`)
  app.quit()
})

app.on('window-all-closed', () => {
  SignatureDetector.destroy()
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  SignatureDetector.destroy()
  closeDatabase()
})
