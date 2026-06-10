use crate::config::AppConfig;
use crate::db::Database;
use crate::db::models::File;
use crate::services::file_storage;
use tauri::{AppHandle, Manager, State};

#[tauri::command]
pub async fn get_files_by_project(
    db: State<'_, Database>,
    project_id: i64,
    stage: Option<String>,
) -> Result<Vec<File>, String> {
    let conn = db.conn.lock().await;

    let map_row = |row: &rusqlite::Row| {
        Ok(File {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            path: row.get(3)?,
            category: row.get(4)?,
            tags: row.get(5)?,
            version: row.get(6)?,
            content_hash: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    };

    let files: Vec<File> = match stage {
        Some(ref stage) => {
            let mut stmt = conn
                .prepare(
                    "SELECT id, project_id, name, path, category, tags, version, content_hash, created_at, updated_at
                     FROM files WHERE project_id = ?1 AND category = ?2
                     ORDER BY updated_at DESC",
                )
                .map_err(|e| e.to_string())?;
            let rows: Vec<File> = stmt
                .query_map(rusqlite::params![project_id, stage], map_row)
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect();
            rows
        }
        None => {
            let mut stmt = conn
                .prepare(
                    "SELECT id, project_id, name, path, category, tags, version, content_hash, created_at, updated_at
                     FROM files WHERE project_id = ?1
                     ORDER BY updated_at DESC",
                )
                .map_err(|e| e.to_string())?;
            let rows: Vec<File> = stmt
                .query_map(rusqlite::params![project_id], map_row)
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect();
            rows
        }
    };

    Ok(files)
}

#[tauri::command]
pub async fn create_file(
    app: AppHandle,
    db: State<'_, Database>,
    config: State<'_, AppConfig>,
    project_id: i64,
    name: String,
    path: String,
    category: Option<String>,
    content: Option<String>,
    project_name: Option<String>,
    stage: Option<String>,
) -> Result<File, String> {
    eprintln!("[FILE] create_file 开始, name: {}, project_id: {}", name, project_id);
    eprintln!("[FILE] content存在: {}, project_name存在: {}, stage存在: {}",
        content.is_some(), project_name.is_some(), stage.is_some());

    // 如果提供了文件内容，保存到磁盘
    let actual_path = if let (Some(content), Some(project_name), Some(stage)) = (&content, &project_name, &stage) {
        // 使用自定义路径或默认路径
        let base_dir = if let Some(custom_path) = &config.file_storage_path {
            std::path::PathBuf::from(custom_path)
        } else {
            app.path().app_data_dir()
                .map_err(|e| format!("无法获取应用数据目录: {}", e))?
        };
        eprintln!("[FILE] 保存文件到: {:?}", base_dir.join(project_name).join(stage).join(&name));
        file_storage::save_file(&base_dir, &project_name, &stage, &name, content)?
    } else {
        eprintln!("[FILE] 使用原始路径: {}", path);
        path
    };

    let conn = db.conn.lock().await;

    conn.execute(
        "INSERT INTO files (project_id, name, path, category) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![project_id, name, actual_path, category],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(File {
        id: Some(id),
        project_id,
        name,
        path: actual_path,
        category,
        tags: None,
        version: 1,
        content_hash: None,
        created_at: None,
        updated_at: None,
    })
}

#[tauri::command]
pub async fn update_file_category(
    db: State<'_, Database>,
    id: i64,
    category: String,
) -> Result<File, String> {
    let conn = db.conn.lock().await;

    conn.execute(
        "UPDATE files SET category = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        rusqlite::params![category, id],
    )
    .map_err(|e| e.to_string())?;

    let file = conn
        .query_row(
            "SELECT id, project_id, name, path, category, tags, version, content_hash, created_at, updated_at
             FROM files WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok(File {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    name: row.get(2)?,
                    path: row.get(3)?,
                    category: row.get(4)?,
                    tags: row.get(5)?,
                    version: row.get(6)?,
                    content_hash: row.get(7)?,
                    created_at: row.get(8)?,
                    updated_at: row.get(9)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(file)
}

#[tauri::command]
pub async fn delete_file(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().await;

    conn.execute("DELETE FROM files WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// 获取文件存储路径
#[tauri::command]
pub async fn get_file_storage_path(
    app: AppHandle,
    config: State<'_, AppConfig>,
) -> Result<String, String> {
    if let Some(custom_path) = &config.file_storage_path {
        Ok(custom_path.clone())
    } else {
        let app_data_dir = app.path().app_data_dir()
            .map_err(|e| format!("无法获取应用数据目录: {}", e))?;
        Ok(app_data_dir.join("projects").to_string_lossy().to_string())
    }
}
