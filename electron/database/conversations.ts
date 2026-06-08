import { getDatabase, saveDatabase } from './index'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface Conversation {
  id: number
  project_id: number
  context_files: string | null
  messages: string
  created_at: string
}

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

export function createConversation(projectId: number, contextFiles: number[]): number {
  const db = getDatabase()
  db.run(
    `INSERT INTO conversations (project_id, context_files, messages) VALUES (?, ?, ?)`,
    [projectId, JSON.stringify(contextFiles), '[]']
  )
  saveDatabase()

  // 获取最后插入的ID
  const results = db.exec('SELECT last_insert_rowid() as id')
  return results[0].values[0][0] as number
}

export function listConversations(projectId: number): Conversation[] {
  const db = getDatabase()
  const results = db.exec('SELECT * FROM conversations WHERE project_id = ? ORDER BY created_at DESC', [projectId])
  return rowsToObjectArray(results) as Conversation[]
}

export function getConversation(id: number): Conversation | undefined {
  const db = getDatabase()
  const results = db.exec('SELECT * FROM conversations WHERE id = ?', [id])
  const rows = rowsToObjectArray(results)
  return rows[0] as Conversation | undefined
}

export function updateConversationMessages(id: number, messages: Message[]) {
  const db = getDatabase()
  db.run('UPDATE conversations SET messages = ? WHERE id = ?', [JSON.stringify(messages), id])
  saveDatabase()
}

export function deleteConversation(id: number) {
  const db = getDatabase()
  db.run('DELETE FROM conversations WHERE id = ?', [id])
  saveDatabase()
}

// --- Chat Messages (individual message persistence) ---

export interface ChatMessage {
  id: number
  project_id: number
  role: 'user' | 'assistant'
  content: string
  token_count: number
  created_at: string
}

export function saveChatMessage(projectId: number, role: 'user' | 'assistant', content: string, tokenCount: number = 0): void {
  const db = getDatabase()
  db.run(
    'INSERT INTO chat_messages (project_id, role, content, token_count) VALUES (?, ?, ?, ?)',
    [projectId, role, content, tokenCount]
  )
  saveDatabase()
}

export function getChatHistory(projectId: number): ChatMessage[] {
  const db = getDatabase()
  const results = db.exec(
    'SELECT id, project_id, role, content, token_count, created_at FROM chat_messages WHERE project_id = ? ORDER BY created_at ASC',
    [projectId]
  )
  return rowsToObjectArray(results) as ChatMessage[]
}
