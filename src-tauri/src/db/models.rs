use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub stage: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct File {
    pub id: Option<i64>,
    pub project_id: i64,
    pub name: String,
    pub path: String,
    pub category: Option<String>,
    pub tags: Option<String>,
    pub version: i32,
    pub content_hash: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Conversation {
    pub id: Option<i64>,
    pub project_id: i64,
    pub role: String,
    pub content: String,
    pub created_at: Option<String>,
    pub token_count: Option<i32>,
}
