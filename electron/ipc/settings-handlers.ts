import { ipcMain, dialog } from 'electron'
import * as settingsDb from '../database/settings'
import { aiService } from '../services/ai-service'
import { validateType, validateSettingsKey } from '../utils/validators'
import { getProviderList } from '../shared/model-registry'
import { CLASSIFY_PROMPT_STAGES, CLASSIFY_PROMPT_CONTENT } from '../prompts/classify'
import { ANALYZE_SYSTEM_PROMPT } from '../prompts/analyze'

const ALLOWED_SETTINGS_FIELDS = [
  'ai_provider', 'ai_model', 'ai_api_key', 'ai_billing_mode', 'ai_base_url',
  'classify_provider', 'classify_model', 'classify_api_key', 'classify_base_url', 'classify_prompt',
  'classify_prompt_stages', 'classify_prompt_content', 'analyze_prompt',
  'extraction_txt', 'extraction_pdf_text', 'extraction_pdf_scanned', 'extraction_word', 'extraction_excel', 'extraction_image',
  'zhipu_api_key', 'mimo_api_key', 'zhipu_api_url', 'mimo_api_url',
  'user_role', 'custom_stages', 'custom_subcategories', 'project_storage_path', 'first_launch_done',
]

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async () => {
    const settings = settingsDb.getAllSettings()
    return { success: true, data: settings }
  })

  ipcMain.handle('settings:update', async (_, settings: Record<string, string>) => {
    const typeValidation = validateType(settings, 'object', 'settings')
    if (!typeValidation.valid) {
      return { success: false, error: typeValidation.error }
    }

    for (const [key, value] of Object.entries(settings)) {
      const keyValidation = validateSettingsKey(key, ALLOWED_SETTINGS_FIELDS)
      if (!keyValidation.valid) continue
      
      const valueValidation = validateType(value, 'string', `settings.${key}`)
      if (!valueValidation.valid) {
        return { success: false, error: valueValidation.error }
      }

      // 后端防线：拒绝写入掩码值，防止覆盖真实API Key
      if (key.endsWith('_api_key') && value === 'sk-***') {
        continue;
      }
      
      settingsDb.setSetting(key, value)
    }

    aiService.refreshProviders()

    return { success: true }
  })

  ipcMain.handle('settings:getModelList', async () => {
    const providerList = getProviderList()
    return { success: true, data: providerList }
  })

  ipcMain.handle('settings:getPrompts', async () => {
    const settings = settingsDb.getAllSettings()
    return {
      success: true,
      data: {
        classify_stages: settings.classify_prompt_stages || CLASSIFY_PROMPT_STAGES,
        classify_content: settings.classify_prompt_content || CLASSIFY_PROMPT_CONTENT,
        analyze: settings.analyze_prompt || ANALYZE_SYSTEM_PROMPT,
      }
    }
  })

  ipcMain.handle('settings:browseFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择项目文件存储位置',
    })
    if (result.canceled || !result.filePaths[0]) return { success: false }
    return { success: true, data: result.filePaths[0] }
  })
}
