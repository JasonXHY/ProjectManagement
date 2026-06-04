use serde::{Deserialize, Serialize};

/// 分类结果
#[derive(Debug, Serialize, Deserialize)]
pub struct ClassificationResult {
    pub category: String,
    pub confidence: f32,
    pub summary: String,
    pub file_type: String,
}

/// AI请求结构
#[derive(Serialize)]
struct AIRequest {
    model: String,
    messages: Vec<AIMessage>,
    max_tokens: u32,
    temperature: f32,
}

#[derive(Serialize)]
struct AIMessage {
    role: String,
    content: String,
}

/// AI响应结构
#[derive(Deserialize)]
struct AIResponse {
    choices: Option<Vec<AIChoice>>,
    error: Option<AIError>,
}

#[derive(Deserialize)]
struct AIChoice {
    message: Option<AIMessageResponse>,
}

#[derive(Deserialize)]
struct AIMessageResponse {
    content: String,
}

#[derive(Deserialize)]
struct AIError {
    message: Option<String>,
}

/// 去除markdown代码围栏，提取纯JSON内容
fn strip_markdown_fences(text: &str) -> String {
    let trimmed = text.trim();
    // 处理 ```json ... ``` 或 ``` ... ``` 格式
    if trimmed.starts_with("```") {
        // 跳过第一行（```json 或 ```）
        let after_open = if let Some(newline_pos) = trimmed.find('\n') {
            &trimmed[newline_pos + 1..]
        } else {
            return trimmed.to_string();
        };
        // 去掉末尾的 ```
        let content = after_open.trim_end();
        if content.ends_with("```") {
            return content[..content.len() - 3].trim().to_string();
        }
    }
    trimmed.to_string()
}

/// 调用AI进行文件分类
pub async fn classify_file(
    http_client: &reqwest::Client,
    file_content: &str,
    prompt: &str,
    api_key: &str,
    api_url: &str,
    model: &str,
) -> Result<ClassificationResult, String> {

    // 构建prompt，替换{content}占位符
    let full_prompt = prompt.replace("{content}", file_content);

    // 构建请求
    let request = AIRequest {
        model: model.to_string(),
        messages: vec![
            AIMessage {
                role: "user".to_string(),
                content: full_prompt,
            },
        ],
        max_tokens: 1024,
        temperature: 0.3,
    };

    eprintln!("[CLASSIFIER] 调用AI分类API");

    // 发送请求
    let response = http_client
        .post(api_url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("API请求失败: {}", e))?;

    let response_text = response.text().await
        .map_err(|e| format!("读取响应失败: {}", e))?;

    let preview: String = response_text.chars().take(200).collect();
    eprintln!("[CLASSIFIER] 收到响应: {}", preview);

    // 解析响应
    let ai_response: AIResponse = serde_json::from_str(&response_text)
        .map_err(|e| format!("解析响应失败: {}", e))?;

    // 检查错误
    if let Some(error) = ai_response.error {
        return Err(format!("AI返回错误: {:?}", error.message));
    }

    // 提取回复内容
    let reply = ai_response.choices
        .as_ref()
        .and_then(|c| c.first())
        .and_then(|c| c.message.as_ref())
        .map(|m| m.content.clone())
        .ok_or_else(|| "无法获取AI回复".to_string())?;

    // 去除markdown代码围栏，提取纯JSON
    let clean_reply = strip_markdown_fences(&reply);

    // 解析JSON结果
    let result: ClassificationResult = serde_json::from_str(&clean_reply)
        .map_err(|e| format!("解析分类结果失败: {}. 原始回复: {}", e, reply))?;

    eprintln!("[CLASSIFIER] 分类结果: category={}, confidence={}", result.category, result.confidence);

    Ok(result)
}
