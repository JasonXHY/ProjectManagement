use crate::config::AppConfig;
use crate::services::config_service;

#[tauri::command]
pub async fn get_config() -> Result<AppConfig, String> {
    config_service::load_config()
}

#[tauri::command]
pub async fn save_config(config: AppConfig) -> Result<(), String> {
    config_service::save_config(&config)
}

#[tauri::command]
pub async fn reset_config() -> Result<AppConfig, String> {
    config_service::reset_config()
}
