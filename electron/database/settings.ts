import { getDatabase, saveDatabase } from './index'

function rowsToObjectArray(results: any[]): Record<string, any>[] {
  if (!results || !results[0] || !results[0].values) return []
  const columns = results[0].columns
  return results[0].values.map((row: any[]) => {
    const obj: Record<string, any> = {}
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i]
    })
    return obj
  })
}

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
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {})
}

export function initDefaultSettings() {
  const defaults: Record<string, string> = {
    ai_provider: 'zhipu',
    ai_model: 'glm-4-flash',
    ai_api_key: '',
    ai_base_url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
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
    extraction_image: 'cloud'
  }

  for (const [key, value] of Object.entries(defaults)) {
    if (getSetting(key) === null) {
      setSetting(key, value)
    }
  }
}
