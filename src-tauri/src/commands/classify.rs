use crate::config::AppConfig;
use crate::services::file_classifier::{self, ClassificationResult};
use crate::services::file_storage;
use tauri::State;

#[tauri::command]
pub async fn classify_file(
    config: State<'_, AppConfig>,
    http_client: State<'_, reqwest::Client>,
    file_path: String,
) -> Result<ClassificationResult, String> {
    // 读取文件内容
    let content_base64 = file_storage::read_file(file_path.as_ref())?;

    // 解码base64
    use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
    let content_bytes = BASE64.decode(&content_base64)
        .map_err(|e| format!("base64解码失败: {}", e))?;

    let content = String::from_utf8_lossy(&content_bytes).to_string();

    // 调用AI分类
    let result = file_classifier::classify_file(
        &http_client,
        &content,
        &config.classification_prompt,
        &config.zhipu_api_key,
        &config.zhipu_api_url,
        &config.model_name,
    ).await?;

    Ok(result)
}
