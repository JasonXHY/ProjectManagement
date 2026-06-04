use crate::config::AppConfig;
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

/// 智谱AI API 请求结构
#[derive(Serialize)]
struct ZhipuRequest {
    model: String,
    messages: Vec<ZhipuMessage>,
    max_tokens: u32,
    temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct ZhipuMessage {
    role: String,
    content: String,
}

/// 智谱AI API 响应结构
#[derive(Debug, Deserialize)]
struct ZhipuResponse {
    choices: Option<Vec<ZhipuChoice>>,
    usage: Option<ZhipuUsage>,
    error: Option<ZhipuError>,
}

#[derive(Debug, Deserialize)]
struct ZhipuChoice {
    message: ZhipuMessage,
}

#[derive(Debug, Deserialize)]
struct ZhipuUsage {
    total_tokens: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct ZhipuError {
    code: Option<String>,
    message: Option<String>,
}

#[tauri::command]
pub async fn chat_with_ai(
    db: State<'_, Database>,
    config: State<'_, AppConfig>,
    http_client: State<'_, reqwest::Client>,
    request: ChatRequest,
) -> Result<ChatResponse, String> {
    // 保存用户消息
    {
        let conn = db.conn.lock().await;
        conn.execute(
            "INSERT INTO conversations (project_id, role, content) VALUES (?1, 'user', ?2)",
            rusqlite::params![request.project_id, request.message],
        )
        .map_err(|e| format!("保存用户消息失败: {}", e))?;
    }

    // 获取最近5轮对话历史
    let history = {
        let conn = db.conn.lock().await;
        let mut stmt = conn
            .prepare(
                "SELECT role, content FROM conversations
                 WHERE project_id = ?1
                 ORDER BY created_at DESC
                 LIMIT 10",
            )
            .map_err(|e| format!("查询对话历史失败: {}", e))?;

        let messages: Vec<(String, String)> = stmt
            .query_map(rusqlite::params![request.project_id], |row| {
                Ok((row.get(0)?, row.get(1)?))
            })
            .map_err(|e| format!("查询对话历史失败: {}", e))?
            .filter_map(|r| r.ok())
            .collect();

        messages.into_iter().rev().collect::<Vec<_>>()
    };

    // 构建消息列表
    let mut messages = Vec::new();

    // 系统提示词
    messages.push(ZhipuMessage {
        role: "system".to_string(),
        content: "你是一个专业的项目管理助手，专门协助项目经理管理信息化项目。你的回答应简洁、专业、基于提供的项目上下文。如果信息不足，请明确说明。使用中文回答。".to_string(),
    });

    // 添加文件内容（如果有）
    if let Some(file_content) = &request.file_content {
        messages.push(ZhipuMessage {
            role: "user".to_string(),
            content: format!("以下是上传的文件内容，请先阅读：\n\n{}", file_content),
        });
        messages.push(ZhipuMessage {
            role: "assistant".to_string(),
            content: "已收到文件内容，请问有什么可以帮助您的？".to_string(),
        });
    }

    // 添加对话历史
    for (role, content) in &history {
        messages.push(ZhipuMessage {
            role: role.clone(),
            content: content.clone(),
        });
    }

    // 添加当前用户消息
    messages.push(ZhipuMessage {
        role: "user".to_string(),
        content: request.message.clone(),
    });

    // 调用智谱AI API
    let api_request = ZhipuRequest {
        model: config.model_name.clone(),
        messages,
        max_tokens: 4096,
        temperature: 0.7,
    };

    eprintln!("[AI] 开始调用智谱AI API, 模型: {}", config.model_name);

    let response = http_client
        .post(&config.zhipu_api_url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", config.zhipu_api_key))
        .json(&api_request)
        .send()
        .await
        .map_err(|e| {
            let err_msg = format!("API请求失败: {}", e);
            eprintln!("[AI] {}", err_msg);
            err_msg
        })?;

    eprintln!("[AI] 收到响应, 状态码: {}", response.status());

    let response_text = response
        .text()
        .await
        .map_err(|e| {
            let err_msg = format!("读取响应失败: {}", e);
            eprintln!("[AI] {}", err_msg);
            err_msg
        })?;

    eprintln!("[AI] 响应内容: {}", &response_text[..response_text.len().min(500)]);

    let zhipu_response: ZhipuResponse = serde_json::from_str(&response_text).map_err(|e| {
        let err_msg = format!("解析响应失败: {}. 响应内容: {}", e, &response_text[..response_text.len().min(200)]);
        eprintln!("[AI] {}", err_msg);
        err_msg
    })?;

    // 检查API错误
    if let Some(error) = zhipu_response.error {
        let err_msg = format!("智谱AI返回错误: code={:?}, message={:?}", error.code, error.message);
        eprintln!("[AI] {}", err_msg);
        return Err(err_msg);
    }

    let reply = zhipu_response
        .choices
        .as_ref()
        .and_then(|c| c.first())
        .map(|c| c.message.content.clone())
        .unwrap_or_else(|| "抱歉，无法生成回复。".to_string());

    let token_count = zhipu_response
        .usage
        .as_ref()
        .and_then(|u| u.total_tokens)
        .unwrap_or(0) as i32;

    eprintln!("[AI] 回复内容: {}, tokens: {}", &reply[..reply.len().min(100)], token_count);

    // 保存AI回复
    {
        let conn = db.conn.lock().await;
        conn.execute(
            "INSERT INTO conversations (project_id, role, content, token_count) VALUES (?1, 'assistant', ?2, ?3)",
            rusqlite::params![request.project_id, reply, token_count],
        )
        .map_err(|e| format!("保存AI回复失败: {}", e))?;
    }

    Ok(ChatResponse {
        reply,
        token_count,
    })
}

#[tauri::command]
pub async fn get_conversation_history(
    db: State<'_, Database>,
    project_id: i64,
    limit: Option<i32>,
) -> Result<Vec<Conversation>, String> {
    let conn = db.conn.lock().await;
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
pub async fn clear_conversation_history(
    db: State<'_, Database>,
    project_id: i64,
) -> Result<(), String> {
    let conn = db.conn.lock().await;

    conn.execute(
        "DELETE FROM conversations WHERE project_id = ?1",
        rusqlite::params![project_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
