import { app, BrowserWindow } from 'electron'
import path from 'path'
import { initDatabase } from './database'
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
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  initDatabase()
  initDefaultSettings()

  // 注册IPC处理器
  registerProjectHandlers()
  registerFileHandlers()
  registerSettingsHandlers()
  registerAIHandlers()

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
