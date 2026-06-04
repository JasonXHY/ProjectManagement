use crate::db::Database;
use crate::db::models::Project;
use tauri::State;

#[tauri::command]
pub async fn create_project(
    db: State<'_, Database>,
    name: String,
    description: Option<String>,
) -> Result<Project, String> {
    let conn = db.conn.lock().await;

    conn.execute(
        "INSERT INTO projects (name, description) VALUES (?1, ?2)",
        rusqlite::params![name, description],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    // 创建项目文件夹结构
    let project_dir = format!("projects/{}", name);
    let stages = [
        "售前", "启动", "需求", "方案", "构建",
        "测试", "上线", "验收", "转客户成功", "关闭"
    ];

    for stage in stages {
        let stage_path = format!("{}/{}", project_dir, stage);
        std::fs::create_dir_all(&stage_path)
            .map_err(|e| format!("创建文件夹失败: {}", e))?;
    }

    eprintln!("[PROJECT] 创建项目文件夹: {}", project_dir);

    Ok(Project {
        id: Some(id),
        name,
        description,
        stage: "blueprint".to_string(),
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
