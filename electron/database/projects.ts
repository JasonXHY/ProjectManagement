import { getDatabase, saveDatabase } from './index'

export interface Project {
  id: number
  name: string
  category_type: 'stage' | 'content' | 'smart'
  custom_stages: string | null
  current_stage: string
  ai_suggested_stage: string | null
  created_at: string
  updated_at: string
}

// Column whitelist to prevent SQL injection via dynamic key names
const ALLOWED_PROJECT_FIELDS = ['name', 'category_type', 'custom_stages', 'current_stage', 'ai_suggested_stage'] as const

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

export function createProject(name: string, categoryType: Project['category_type'], customStages?: string[]): number {
  const db = getDatabase()
  db.run(
    `INSERT INTO projects (name, category_type, custom_stages) VALUES (?, ?, ?)`,
    [name, categoryType, customStages ? JSON.stringify(customStages) : null]
  )

  // 获取最后插入的ID（必须在saveDatabase之前）
  const results = db.exec('SELECT last_insert_rowid() as id')
  const id = results[0].values[0][0] as number

  saveDatabase()

  return id
}

export function listProjects(): Project[] {
  const db = getDatabase()
  const results = db.exec('SELECT * FROM projects ORDER BY created_at DESC')
  return rowsToObjectArray(results) as Project[]
}

export function getProject(id: number): Project | undefined {
  const db = getDatabase()
  const results = db.exec('SELECT * FROM projects WHERE id = ?', [id])
  const rows = rowsToObjectArray(results)
  return rows[0] as Project | undefined
}

export function updateProject(id: number, data: Partial<Project>) {
  const db = getDatabase()

  // Filter to only allowed fields to prevent SQL injection
  const allowedKeys = Object.keys(data).filter(k => ALLOWED_PROJECT_FIELDS.includes(k as typeof ALLOWED_PROJECT_FIELDS[number]))

  if (allowedKeys.length === 0) return

  const fields = allowedKeys.map(k => `${k} = ?`).join(', ')
  const values = allowedKeys.map(k => (data as Record<string, unknown>)[k] as string | number | null)

  db.run(`UPDATE projects SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id])
  saveDatabase()
}

export function deleteProject(id: number) {
  const db = getDatabase()

  // Wrap in transaction to ensure atomicity
  db.run('BEGIN TRANSACTION')
  try {
    db.run('DELETE FROM files WHERE project_id = ?', [id])
    db.run('DELETE FROM conversations WHERE project_id = ?', [id])
    db.run('DELETE FROM chat_messages WHERE project_id = ?', [id])
    db.run('DELETE FROM projects WHERE id = ?', [id])
    db.run('COMMIT')
  } catch (e) {
    db.run('ROLLBACK')
    throw e
  }
  saveDatabase()
}
