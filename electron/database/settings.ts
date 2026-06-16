import { getDatabase, saveDatabase } from './index'
import { rowsToObjectArray } from './files'

const API_KEY_FIELDS = ['ai_api_key', 'classify_api_key', 'zhipu_api_key', 'mimo_api_key']

export function getSetting(key: string): string | null {
  const db = getDatabase()
  const results = db.exec('SELECT value FROM settings WHERE key = ?', [key])
  const rows = rowsToObjectArray(results)
  return rows[0]?.value ?? null
}

export function setSetting(key: string, value: string) {
  const db = getDatabase()
  db.run(
    `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
    [key, value]
  )
  saveDatabase()
}

export function getAllSettings(): Record<string, string> {
  const db = getDatabase()
  const results = db.exec('SELECT key, value FROM settings')
  const rows = rowsToObjectArray(results) as { key: string; value: string }[]
  return rows.reduce((acc, row) => {
    if (API_KEY_FIELDS.includes(row.key) && row.value) {
      return { ...acc, [row.key]: 'sk-***' }
    }
    return { ...acc, [row.key]: row.value }
  }, {})
}

export function getDecryptedApiKey(key: string): string {
  if (!API_KEY_FIELDS.includes(key)) return ''
  return getSetting(key) || ''
}

export function initDefaultSettings() {
  const defaults: Record<string, string> = {
    ai_provider: 'xiaomi',
    ai_model: 'mimo-v2.5',
    ai_api_key: 'sk-c3vuo9gj5zpepvrcc7u509lpv0iazs9ze76bfstbl528eonf',
    ai_base_url: '',
    classify_provider: '',
    classify_model: '',
    classify_api_key: '',
    classify_base_url: '',
    classify_prompt: '请分析这个文件的内容，将其分类到最合适的类别...',
    extraction_txt: 'local',
    extraction_pdf_text: 'local',
    extraction_pdf_scanned: 'cloud',
    extraction_word: 'local',
    extraction_excel: 'local',
    extraction_image: 'cloud',
    first_launch_done: 'false',
    beta_ai_shutdown_date: '2026-07-31'
  }

  for (const [key, value] of Object.entries(defaults)) {
    const existing = getSetting(key)
    if (existing === null || existing === '') {
      setSetting(key, value)
    }
  }
}
