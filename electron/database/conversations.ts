import { getDatabase, saveDatabase } from './index'

// conversations 表为历史遗留，当前使用 chat_messages 表存储对话消息。
// conversations 表及其 CRUD 函数已不再使用，保留表定义以备未来功能扩展。

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
