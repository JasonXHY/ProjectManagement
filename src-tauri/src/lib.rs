// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod config;
mod db;
mod services;

use config::AppConfig;
use db::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化数据库（带错误恢复）
    let db_path = "projects.db";
    let db = match Database::new(db_path) {
        Ok(db) => db,
        Err(e) => {
            eprintln!("数据库创建失败，尝试删除后重建: {}", e);
            // 尝试删除损坏的数据库文件
            let _ = std::fs::remove_file(db_path);
            // 重试创建
            Database::new(db_path).expect("无法创建数据库")
        }
    };

    // 初始化数据库表
    let rt = tokio::runtime::Runtime::new().expect("无法创建Tokio运行时");
    rt.block_on(async {
        if let Err(e) = db.init().await {
            eprintln!("数据库初始化失败: {}", e);
        }
    });

    // 初始化配置
    let app_config = AppConfig::default();

    // 创建共享的HTTP客户端
    let http_client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .danger_accept_invalid_certs(true) // 开发环境接受无效证书
        .build()
        .expect("无法创建HTTP客户端");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db)
        .manage(app_config)
        .manage(http_client)
        .invoke_handler(tauri::generate_handler![
            commands::project::create_project,
            commands::project::get_projects,
            commands::project::update_project,
            commands::project::delete_project,
            commands::file::get_files_by_project,
            commands::file::create_file,
            commands::file::update_file_category,
            commands::file::delete_file,
            commands::ai::chat_with_ai,
            commands::ai::get_conversation_history,
            commands::ai::clear_conversation_history,
            commands::classify::classify_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
