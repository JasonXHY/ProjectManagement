// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod commands;
mod db;

use db::Database;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化数据库
    let db = Database::new("projects.db").expect("Failed to create database");
    db.init().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            commands::project::create_project,
            commands::project::get_projects,
            commands::project::update_project,
            commands::project::delete_project,
            commands::file::get_files_by_project,
            commands::file::create_file,
            commands::file::update_file_category,
            commands::file::delete_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
