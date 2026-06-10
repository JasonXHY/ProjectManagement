use crate::config::AppConfig;
use crate::services::config_service;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn get_config() -> Result<AppConfig, String> {
    config_service::load_config()
}

#[tauri::command]
pub async fn save_config(app: AppHandle, config: AppConfig) -> Result<(), String> {
    config_service::save_config(&config)?;
    // 更新 Tauri 托管状态，确保 AI 等功能立即使用新配置
    app.manage(config);
    Ok(())
}

#[tauri::command]
pub async fn reset_config(app: AppHandle) -> Result<AppConfig, String> {
    let config = config_service::reset_config()?;
    // 更新 Tauri 托管状态
    app.manage(config.clone());
    Ok(config)
}
