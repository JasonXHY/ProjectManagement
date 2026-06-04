use crate::config::AppConfig;
use crate::services::file_classifier::{self, ClassificationResult};
use crate::services::file_storage;
use tauri::{AppHandle, Manager, State};

#[tauri::command]
pub async fn classify_file(
    app: AppHandle,
    config: State<'_, AppConfig>,
    http_client: State<'_, reqwest::Client>,
    project_name: String,
    stage: String,
    file_name: String,
) -> Result<ClassificationResult, String> {
    // 验证路径组件，防止路径遍历攻击
    file_storage::validate_path_component(&project_name)?;
    file_storage::validate_path_component(&stage)?;
    file_storage::validate_path_component(&file_name)?;

    // 构建安全的文件路径
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;
    let file_path = app_data_dir
        .join("projects")
        .join(&project_name)
        .join(&stage)
        .join(&file_name);

    // 直接读取文件内容（避免base64往返）
    let content_bytes = std::fs::read(&file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;
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
