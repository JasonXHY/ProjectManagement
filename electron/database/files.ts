import { getDatabase, saveDatabase } from './index'

export interface FileRecord {
  id: number
  project_id: number
  filename: string
  original_path: string | null
  stored_path: string
  category: string | null
  subcategory: string | null
  stage: string | null
  file_type: string | null
  file_size: number | null
  content_extracted: string | null
  is_analyzed: boolean
  has_signature: boolean
  signature_status: 'unsigned' | 'pending' | 'signed' | 'rejected'
  ai_summary: string | null
  ai_key_info: string | null
  created_at: string
}

// Column whitelist to prevent SQL injection via dynamic key names
const ALLOWED_FILE_FIELDS = ['filename', 'original_path', 'stored_path', 'category', 'subcategory', 'stage', 'file_type', 'file_size', 'content_extracted', 'is_analyzed', 'has_signature', 'signature_status', 'ai_summary', 'ai_key_info'] as const

export function rowsToObjectArray<T = Record<string, any>>(results: any[]): T[] {
  if (!results || !results[0] || !results[0].values) return []
  const columns = results[0].columns
  return results[0].values.map((row: any[]) => {
    const obj: Record<string, any> = {}
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i]
    })
    return obj as T
  })
}

type CreateFileData = Omit<FileRecord, 'id' | 'created_at' | 'project_id' | 'signature_status' | 'ai_summary' | 'ai_key_info'> & {
  signature_status?: 'unsigned' | 'pending' | 'signed' | 'rejected'
  ai_summary?: string | null
  ai_key_info?: string | null
}

export function createFile(projectId: number, data: CreateFileData): number {
  const db = getDatabase()
  db.run(
    `INSERT INTO files (project_id, filename, original_path, stored_path, category, subcategory, stage, file_type, file_size, content_extracted, is_analyzed, has_signature, signature_status, ai_summary, ai_key_info)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [projectId, data.filename, data.original_path, data.stored_path,
     data.category, data.subcategory ?? null, data.stage, data.file_type, data.file_size,
     data.content_extracted, data.is_analyzed ? 1 : 0, data.has_signature ? 1 : 0, data.signature_status ?? 'unsigned',
     data.ai_summary ?? null, data.ai_key_info ?? null]
  )
  saveDatabase()

  // 获取最后插入的ID
  const results = db.exec('SELECT last_insert_rowid() as id')
  return results[0].values[0][0] as number
}

export function listFiles(projectId: number): FileRecord[] {
  const db = getDatabase()
  const results = db.exec('SELECT * FROM files WHERE project_id = ? ORDER BY created_at DESC', [projectId])
  return rowsToObjectArray<FileRecord>(results)
}

export function getFilesByCategory(projectId: number, category: string): FileRecord[] {
  const db = getDatabase()
  const results = db.exec('SELECT * FROM files WHERE project_id = ? AND category = ?', [projectId, category])
  return rowsToObjectArray<FileRecord>(results)
}

export function getUnanalyzedFiles(projectId: number): FileRecord[] {
  const db = getDatabase()
  const results = db.exec('SELECT * FROM files WHERE project_id = ? AND is_analyzed = 0', [projectId])
  return rowsToObjectArray<FileRecord>(results)
}

export function updateFile(id: number, data: Partial<FileRecord>) {
  const db = getDatabase()

  // Filter to only allowed fields to prevent SQL injection
  const allowedKeys = Object.keys(data).filter(k => ALLOWED_FILE_FIELDS.includes(k as typeof ALLOWED_FILE_FIELDS[number]))

  if (allowedKeys.length === 0) return

  const fields = allowedKeys.map(k => `${k} = ?`).join(', ')
  const values = allowedKeys.map(k => {
    const val = (data as Record<string, unknown>)[k]
    // Convert boolean to number for SQLite
    if (typeof val === 'boolean') return val ? 1 : 0
    return val as string | number | null
  })

  db.run(`UPDATE files SET ${fields} WHERE id = ?`, [...values, id])
  saveDatabase()
}

export function getFileById(id: number): FileRecord | null {
  const db = getDatabase()
  const results = db.exec('SELECT * FROM files WHERE id = ?', [id])
  const rows = rowsToObjectArray<FileRecord>(results)
  return rows[0] || null
}

export function deleteFile(id: number) {
  const db = getDatabase()
  db.run('DELETE FROM files WHERE id = ?', [id])
  saveDatabase()
}
