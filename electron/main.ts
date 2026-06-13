import { app, BrowserWindow, session } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase } from './database'
import { initDefaultSettings } from './database/settings'
import { registerProjectHandlers } from './ipc/project-handlers'
import { registerFileHandlers } from './ipc/file-handlers'
import { registerSettingsHandlers } from './ipc/settings-handlers'
import { registerAIHandlers } from './ipc/ai-handlers'
import { SignatureDetector } from './services/signature-detector'

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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:1234')
  } else {
    const indexPath = path.join(__dirname, '../../dist/index.html')
    console.log('Loading index from:', indexPath)
    mainWindow.loadFile(indexPath)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' as const }))
}

function setupSecurityHeaders() {
  if (process.env.NODE_ENV !== 'production') return

  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "connect-src 'self'",
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
