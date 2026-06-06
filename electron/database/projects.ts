import { getDatabase } from './index'

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

export function createProject(name: string, categoryType: string, customStages?: string[]) {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO projects (name, category_type, custom_stages)
    VALUES (?, ?, ?)
  `)
  const result = stmt.run(name, categoryType, customStages ? JSON.stringify(customStages) : null)
  return result.lastInsertRowid
}

export function listProjects(): Project[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[]
}

export function getProject(id: number): Project | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined
}

export function updateProject(id: number, data: Partial<Project>) {
  const db = getDatabase()
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
  const values = Object.values(data)
  db.prepare(`UPDATE projects SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values, id)
}

export function deleteProject(id: number) {
  const db = getDatabase()
  db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  db.prepare('DELETE FROM files WHERE project_id = ?').run(id)
  db.prepare('DELETE FROM conversations WHERE project_id = ?').run(id)
}
