use crate::db::Database;
use crate::db::models::Conversation;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRequest {
    pub project_id: i64,
    pub message: String,
    pub file_content: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatResponse {
    pub reply: String,
    pub token_count: i32,
}

#[tauri::command]
pub async fn chat_with_ai(
    db: State<'_, Database>,
    request: ChatRequest,
) -> Result<ChatResponse, String> {
    // 保存用户消息
    {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO conversations (project_id, role, content) VALUES (?1, 'user', ?2)",
            rusqlite::params![request.project_id, request.message],
        )
        .map_err(|e| e.to_string())?;
    }

    // 获取最近5轮对话历史
    let history = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT role, content FROM conversations
                 WHERE project_id = ?1
                 ORDER BY created_at DESC
                 LIMIT 10",
            )
            .map_err(|e| e.to_string())?;

        let messages: Vec<(String, String)> = stmt
            .query_map(rusqlite::params![request.project_id], |row| {
                Ok((row.get(0)?, row.get(1)?))
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        messages.into_iter().rev().collect::<Vec<_>>()
    };

    // 构建Prompt
    let system_prompt = "你是一个专业的项目管理助手，专门协助项目经理管理信息化项目。回答应简洁、专业、基于提供的项目上下文。如果信息不足，请明确说明。使用 markdown 格式输出。";

    let mut prompt = format!("{}\n\n", system_prompt);

    // 添加文件内容（如果有）
    if let Some(file_content) = &request.file_content {
        prompt.push_str(&format!("上传的文件内容：\n{}\n\n", file_content));
    }

    // 添加对话历史
    for (role, content) in &history {
        prompt.push_str(&format!("{}: {}\n", role, content));
    }

    prompt.push_str(&format!("user: {}\n\nassistant: ", request.message));

    // 调用大模型API（这里需要实际实现API调用）
    // 暂时返回模拟响应
    let reply = format!("收到您的消息：{}\n\n这是AI的回复。", request.message);
    let token_count = 100; // 模拟token计数

    // 保存AI回复
    {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO conversations (project_id, role, content, token_count) VALUES (?1, 'assistant', ?2, ?3)",
            rusqlite::params![request.project_id, reply, token_count],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(ChatResponse {
        reply,
        token_count,
    })
}

#[tauri::command]
pub fn get_conversation_history(
    db: State<'_, Database>,
    project_id: i64,
    limit: Option<i32>,
) -> Result<Vec<Conversation>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let limit = limit.unwrap_or(50);

    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, role, content, created_at, token_count
             FROM conversations
             WHERE project_id = ?1
             ORDER BY created_at DESC
             LIMIT ?2",
        )
        .map_err(|e| e.to_string())?;

    let conversations = stmt
        .query_map(rusqlite::params![project_id, limit], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                project_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
                token_count: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(conversations)
}

#[tauri::command]
pub fn clear_conversation_history(
    db: State<'_, Database>,
    project_id: i64,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM conversations WHERE project_id = ?1",
        rusqlite::params![project_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
