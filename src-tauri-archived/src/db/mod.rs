pub mod models;

use rusqlite::{Connection, Result};
use tokio::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        Ok(Database {
            conn: Mutex::new(conn),
        })
    }

    pub async fn init(&self) -> Result<()> {
        let conn = self.conn.lock().await;

        // 创建项目表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                stage TEXT DEFAULT 'blueprint',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active'
            )",
            [],
        )?;

        // 创建文件表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER REFERENCES projects(id),
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                category TEXT,
                tags TEXT,
                version INTEGER DEFAULT 1,
                content_hash TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // 创建对话表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER REFERENCES projects(id),
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                token_count INTEGER
            )",
            [],
        )?;

        Ok(())
    }
}
