import { ipcMain } from 'electron'
import * as settingsDb from '../database/settings'
import { aiService } from '../services/ai-service'

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async () => {
    const settings = settingsDb.getAllSettings()
    return { success: true, data: settings }
  })

  ipcMain.handle('settings:update', async (_, settings: Record<string, string>) => {
    for (const [key, value] of Object.entries(settings)) {
      settingsDb.setSetting(key, value)
    }

    // 刷新AI供应商配置
    aiService.refreshProviders()

    return { success: true }
  })
}
