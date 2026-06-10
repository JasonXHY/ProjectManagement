use crate::db::Database;
use crate::db::models::Project;
use tauri::{AppHandle, Manager, State};

/// 项目阶段名称常量，用于在多处复用
const STAGES: &[&str] = &[
    "售前", "启动", "需求", "方案", "构建",
    "测试", "上线", "验收", "转客户成功", "关闭",
];

/// 验证项目名称是否安全（仅允许字母、数字、中文、连字符、下划线和空格）
fn validate_project_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("项目名称不能为空".to_string());
    }
    if name.contains("..") || name.contains('/') || name.contains('\\') {
        return Err("项目名称包含非法字符".to_string());
    }
    if !name.chars().all(|c| {
        c.is_alphanumeric() || c == '-' || c == '_' || c == ' ' || ('\u{4e00}' <= c && c <= '\u{9fff}')
    }) {
        return Err("项目名称只能包含字母、数字、中文、连字符、下划线和空格".to_string());
    }
    Ok(())
}

#[tauri::command]
pub async fn create_project(
    app: AppHandle,
    db: State<'_, Database>,
    name: String,
    description: Option<String>,
) -> Result<Project, String> {
    validate_project_name(&name)?;

    let conn = db.conn.lock().await;

    conn.execute(
        "INSERT INTO projects (name, description) VALUES (?1, ?2)",
        rusqlite::params![name, description],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    // 释放数据库锁后再创建文件夹，避免长时间持有锁
    drop(conn);

    // 创建项目文件夹结构（使用应用数据目录而非相对路径）
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;
    let project_dir = app_data_dir.join("projects").join(&name);

    for stage in STAGES {
        let stage_path = project_dir.join(stage);
        tokio::fs::create_dir_all(&stage_path)
            .await
            .map_err(|e| format!("创建文件夹失败: {}", e))?;
    }

    eprintln!("[PROJECT] 创建项目文件夹: {}", project_dir.display());

    Ok(Project {
        id: Some(id),
        name,
        description,
        stage: "presale".to_string(),
        created_at: None,
        updated_at: None,
        status: "active".to_string(),
    })
}

#[tauri::command]
pub async fn get_projects(
    db: State<'_, Database>,
    include_archived: Option<bool>,
) -> Result<Vec<Project>, String> {
    let conn = db.conn.lock().await;
    let include = include_archived.unwrap_or(false);

    let mut stmt = if include {
        conn.prepare(
            "SELECT id, name, description, stage, created_at, updated_at, status FROM projects",
        )
    } else {
        conn.prepare(
            "SELECT id, name, description, stage, created_at, updated_at, status FROM projects WHERE status != 'archived'",
        )
    }
    .map_err(|e| e.to_string())?;

    let projects = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                stage: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                status: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(projects)
}

#[tauri::command]
pub async fn update_project(
    db: State<'_, Database>,
    id: i64,
    name: Option<String>,
    description: Option<String>,
    stage: Option<String>,
) -> Result<Project, String> {
    let conn = db.conn.lock().await;

    if let Some(name) = name {
        conn.execute(
            "UPDATE projects SET name = ?1 WHERE id = ?2",
            rusqlite::params![name, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(description) = description {
        conn.execute(
            "UPDATE projects SET description = ?1 WHERE id = ?2",
            rusqlite::params![description, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(stage) = stage {
        conn.execute(
            "UPDATE projects SET stage = ?1 WHERE id = ?2",
            rusqlite::params![stage, id],
        )
        .map_err(|e| e.to_string())?;
    }

    conn.execute(
        "UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?1",
        rusqlite::params![id],
    )
    .map_err(|e| e.to_string())?;

    let project = conn
        .query_row(
            "SELECT id, name, description, stage, created_at, updated_at, status FROM projects WHERE id = ?1",
            rusqlite::params![id],
            |row| {
                Ok(Project {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    stage: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                    status: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(project)
}

#[tauri::command]
pub async fn delete_project(db: State<'_, Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().await;

    conn.execute(
        "UPDATE projects SET status = 'archived' WHERE id = ?1",
        rusqlite::params![id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
