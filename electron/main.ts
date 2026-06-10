import { app, BrowserWindow } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase } from './database'
import { initDefaultSettings } from './database/settings'
import { registerProjectHandlers } from './ipc/project-handlers'
import { registerFileHandlers } from './ipc/file-handlers'
import { registerSettingsHandlers } from './ipc/settings-handlers'
import { registerAIHandlers } from './ipc/ai-handlers'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:1234')
  } else {
    // __dirname 是 electron/dist/，需要向上两级到项目根目录
    const indexPath = path.join(__dirname, '../../dist/index.html')
    console.log('Loading index from:', indexPath)
    mainWindow.loadFile(indexPath)
  }
}

app.whenReady().then(async () => {
  // 初始化数据库（异步）
  await initDatabase()
  initDefaultSettings()

  // 注册IPC处理器
  registerProjectHandlers()
  registerFileHandlers()
  registerSettingsHandlers()
  registerAIHandlers()

  createWindow()
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
