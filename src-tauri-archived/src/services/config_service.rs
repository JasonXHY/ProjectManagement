use crate::config::AppConfig;
use std::path::PathBuf;

/// 获取配置文件路径
fn get_config_path() -> Result<PathBuf, String> {
    let config_dir = dirs::config_dir()
        .ok_or_else(|| "无法获取配置目录".to_string())?
        .join("ai-project-manager");

    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("创建配置目录失败: {}", e))?;

    Ok(config_dir.join("config.json"))
}

/// 加载配置
pub fn load_config() -> Result<AppConfig, String> {
    let config_path = get_config_path()?;

    if !config_path.exists() {
        // 如果配置文件不存在，返回默认配置
        return Ok(AppConfig::default());
    }

    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("读取配置文件失败: {}", e))?;

    let config: AppConfig = serde_json::from_str(&content)
        .map_err(|e| format!("解析配置文件失败: {}", e))?;

    Ok(config)
}

/// 保存配置
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path()?;

    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;

    std::fs::write(&config_path, content)
        .map_err(|e| format!("写入配置文件失败: {}", e))?;

    eprintln!("[CONFIG] 配置已保存到: {:?}", config_path);

    Ok(())
}

/// 恢复默认配置
pub fn reset_config() -> Result<AppConfig, String> {
    let default_config = AppConfig::default();
    save_config(&default_config)?;
    Ok(default_config)
}
