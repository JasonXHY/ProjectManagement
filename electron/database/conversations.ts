import { getDatabase, saveDatabase } from './index'
import { rowsToObjectArray } from './files'

// conversations 表为历史遗留，当前使用 chat_messages 表存储对话消息。
// conversations 表及其 CRUD 函数已不再使用，保留表定义以备未来功能扩展。

// --- Chat Messages (individual message persistence) ---

export interface ChatMessage {
  id: number
  project_id: number
  session_id: string
  role: 'user' | 'assistant'
  content: string
  token_count: number
  created_at: string
}

export function saveChatMessage(projectId: number, sessionId: string, role: 'user' | 'assistant', content: string, tokenCount: number = 0): void {
  const db = getDatabase()
  db.run(
    'INSERT INTO chat_messages (project_id, session_id, role, content, token_count) VALUES (?, ?, ?, ?, ?)',
    [projectId, sessionId, role, content, tokenCount]
  )
  saveDatabase()
}

export function getChatHistory(projectId: number, sessionId?: string): ChatMessage[] {
  const db = getDatabase()
  let query = 'SELECT id, project_id, session_id, role, content, token_count, created_at FROM chat_messages WHERE project_id = ?'
  const params: any[] = [projectId]
  
  if (sessionId) {
    query += ' AND session_id = ?'
    params.push(sessionId)
  }
  
  query += ' ORDER BY created_at ASC'
  const results = db.exec(query, params)
  return rowsToObjectArray(results) as ChatMessage[]
}

export interface ChatSession {
  session_id: string
  first_message: string
  message_count: number
  created_at: string
  updated_at: string
}

export function getChatSessions(projectId: number): ChatSession[] {
  const db = getDatabase()
  const results = db.exec(`
    SELECT 
      cm.session_id,
      first_msg.content as first_message,
      COUNT(*) as message_count,
      MIN(cm.created_at) as created_at,
      MAX(cm.created_at) as updated_at
    FROM chat_messages cm
    INNER JOIN (
      SELECT session_id, MIN(id) as min_id
      FROM chat_messages
      WHERE project_id = ?
      GROUP BY session_id
    ) fm ON cm.session_id = fm.session_id AND cm.id = fm.min_id
    WHERE cm.project_id = ?
    GROUP BY cm.session_id
    ORDER BY MAX(cm.created_at) DESC
  `, [projectId, projectId])
  
  const sessions = rowsToObjectArray(results) as ChatSession[]
  
  // 截断第一条消息作为标题（最多50个字符）
  return sessions.map(session => ({
    ...session,
    first_message: session.first_message.length > 50 
      ? session.first_message.substring(0, 50) + '...'
      : session.first_message
  }))
}
