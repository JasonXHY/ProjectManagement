import { getDatabase } from './index'

export interface FileRecord {
  id: number
  project_id: number
  filename: string
  original_path: string | null
  stored_path: string
  category: string | null
  stage: string | null
  file_type: string | null
  file_size: number | null
  content_extracted: string | null
  is_analyzed: boolean
  created_at: string
}

// Column whitelist to prevent SQL injection via dynamic key names
const ALLOWED_FILE_FIELDS = ['filename', 'original_path', 'stored_path', 'category', 'stage', 'file_type', 'file_size', 'content_extracted', 'is_analyzed'] as const

export function createFile(projectId: number, data: Omit<FileRecord, 'id' | 'created_at'>) {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO files (project_id, filename, original_path, stored_path, category, stage, file_type, file_size, content_extracted, is_analyzed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    projectId, data.filename, data.original_path, data.stored_path,
    data.category, data.stage, data.file_type, data.file_size,
    data.content_extracted, data.is_analyzed
  )
  return result.lastInsertRowid
}

export function listFiles(projectId: number): FileRecord[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM files WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId) as FileRecord[]
}

export function getFilesByCategory(projectId: number, category: string): FileRecord[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM files WHERE project_id = ? AND category = ?')
    .all(projectId, category) as FileRecord[]
}

export function getUnanalyzedFiles(projectId: number): FileRecord[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM files WHERE project_id = ? AND is_analyzed = FALSE')
    .all(projectId) as FileRecord[]
}

export function updateFile(id: number, data: Partial<FileRecord>) {
  const db = getDatabase()

  // Filter to only allowed fields to prevent SQL injection
  const allowedKeys = Object.keys(data).filter(k => ALLOWED_FILE_FIELDS.includes(k as typeof ALLOWED_FILE_FIELDS[number]))

  if (allowedKeys.length === 0) return

  const fields = allowedKeys.map(k => `${k} = ?`).join(', ')
  const values = allowedKeys.map(k => (data as Record<string, unknown>)[k])

  db.prepare(`UPDATE files SET ${fields} WHERE id = ?`).run(...values, id)
}

export function deleteFile(id: number) {
  const db = getDatabase()
  db.prepare('DELETE FROM files WHERE id = ?').run(id)
}
