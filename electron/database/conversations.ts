import { getDatabase } from './index'

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

export function createConversation(projectId: number, contextFiles: number[]) {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO conversations (project_id, context_files, messages)
    VALUES (?, ?, ?)
  `)
  const result = stmt.run(projectId, JSON.stringify(contextFiles), '[]')
  return result.lastInsertRowid
}

export function listConversations(projectId: number): Conversation[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM conversations WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId) as Conversation[]
}

export function getConversation(id: number): Conversation | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as Conversation | undefined
}

export function updateConversationMessages(id: number, messages: Message[]) {
  const db = getDatabase()
  db.prepare('UPDATE conversations SET messages = ? WHERE id = ?')
    .run(JSON.stringify(messages), id)
}

export function deleteConversation(id: number) {
  const db = getDatabase()
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id)
}
