import initSqlJs, { Database } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

let db: Database
let dbPath: string
let batchMode = false
let saveQueue = Promise.resolve()

export async function initDatabase(): Promise<Database> {
  // 定位 sql.js 的 wasm 文件：打包后从 resources 读取（见 electron-builder.yml extraResources），
  // 开发态从 node_modules 解析。否则打包后会因找不到 wasm 而启动即崩。
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      if (app.isPackaged) {
        return path.join(process.resourcesPath, file)
      }
      return path.join(path.dirname(require.resolve('sql.js')), file)
    },
  })
  dbPath = path.join(app.getPath('userData'), 'projects.db')

  // 如果数据库文件存在，读取它
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_type TEXT NOT NULL DEFAULT 'stage',
      custom_stages TEXT,
      current_stage TEXT DEFAULT '售前',
      ai_suggested_stage TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_path TEXT,
      stored_path TEXT NOT NULL,
      category TEXT,
      subcategory TEXT,
      stage TEXT,
      file_type TEXT,
      file_size INTEGER,
      content_extracted TEXT,
      is_analyzed BOOLEAN DEFAULT FALSE,
      has_signature BOOLEAN DEFAULT FALSE,
      signature_status TEXT DEFAULT 'unsigned',
      ai_summary TEXT,
      ai_key_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `)



  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      token_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run('PRAGMA foreign_keys = ON')

  // 迁移：为 chat_messages 表添加 session_id 列（旧数据库可能缺少此列）
  try {
    db.run(`ALTER TABLE chat_messages ADD COLUMN session_id TEXT NOT NULL DEFAULT 'default'`)
  } catch {
    // 列已存在，忽略
  }

  db.run('CREATE INDEX IF NOT EXISTS idx_chat_project_session ON chat_messages(project_id, session_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_id)')
  db.run('CREATE INDEX IF NOT EXISTS idx_files_category ON files(project_id, category)')

  // 迁移现有数据：为没有session_id的消息分配默认session_id
  try {
    const results = db.exec('SELECT COUNT(*) FROM chat_messages WHERE session_id IS NULL OR session_id = ""')
    if (results[0] && results[0].values[0][0] && Number(results[0].values[0][0]) > 0) {
      db.run('UPDATE chat_messages SET session_id = "default-" || id WHERE session_id IS NULL OR session_id = ""')
      saveDatabase()
    }
  } catch (error) {
    // 如果session_id列不存在，忽略错误
    console.error('迁移session_id失败:', error)
  }

  // 迁移阶段数据：将11个阶段映射到3个阶段
  try {
    // 映射规则：启动/需求/方案/设计/构建/测试/上线 → 进行中
    const stageMapping = [
      { from: '启动', to: '进行中' },
      { from: '需求', to: '进行中' },
      { from: '方案', to: '进行中' },
      { from: '设计', to: '进行中' },
      { from: '构建', to: '进行中' },
      { from: '测试', to: '进行中' },
      { from: '上线', to: '进行中' },
      { from: '验收', to: '进行中' },
      { from: '转客户成功', to: '关闭' },
    ]

    let migrated = false
    for (const mapping of stageMapping) {
      const results = db.exec('SELECT COUNT(*) FROM projects WHERE current_stage = ?', [mapping.from])
      if (results[0] && results[0].values[0][0] && Number(results[0].values[0][0]) > 0) {
        db.run('UPDATE projects SET current_stage = ? WHERE current_stage = ?', [mapping.to, mapping.from])
        migrated = true
      }
    }

    if (migrated) {
      saveDatabase()
      console.log('阶段数据迁移完成')
    }
  } catch (error) {
    console.error('迁移阶段数据失败:', error)
  }

  // 迁移：为 projects 表添加 metadata 字段
  try {
    db.run(`ALTER TABLE projects ADD COLUMN metadata TEXT`)
    saveDatabase()
  } catch {
    // 字段已存在，忽略
  }

  // 迁移：为 projects 表添加 milestones 字段
  try {
    db.run(`ALTER TABLE projects ADD COLUMN milestones TEXT`)
    saveDatabase()
  } catch {
    // 字段已存在，忽略
  }

  // 迁移：为 files 表添加 has_signature 字段
  try {
    db.run(`ALTER TABLE files ADD COLUMN has_signature BOOLEAN DEFAULT FALSE`)
    saveDatabase()
  } catch {
    // 字段已存在，忽略
  }

  // 迁移：为 files 表添加 signature_status 字段（签名状态）
  try {
    db.run(`ALTER TABLE files ADD COLUMN signature_status TEXT DEFAULT 'unsigned'`)
    saveDatabase()
  } catch {
    // 字段已存在，忽略
  }

  // 迁移：为 files 表添加 ai_summary 和 ai_key_info 字段（AI分析结果）
  try {
    db.run(`ALTER TABLE files ADD COLUMN ai_summary TEXT`)
    saveDatabase()
  } catch {
    // 字段已存在，忽略
  }
  try {
    db.run(`ALTER TABLE files ADD COLUMN ai_key_info TEXT`)
    saveDatabase()
  } catch {
    // 字段已存在，忽略
  }

  // 迁移：为 files 表添加 subcategory 字段（v3.1 子分类）
  try {
    db.run(`ALTER TABLE files ADD COLUMN subcategory TEXT`)
    saveDatabase()
  } catch {
    // 字段已存在，忽略
  }

  saveDatabase()

  return db
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function saveDatabase() {
  if (batchMode) return
  if (db && dbPath) {
    saveQueue = saveQueue.then(() => {
      const data = db.export()
      const buffer = Buffer.from(data)
      const backupPath = dbPath + '.bak'
      
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath)
      }
      
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupPath)
      }
      
      try {
        fs.writeFileSync(dbPath, buffer)
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath)
        }
      } catch (error) {
        if (fs.existsSync(backupPath)) {
          fs.copyFileSync(backupPath, dbPath)
          fs.unlinkSync(backupPath)
        }
        throw error
      }
    })
  }
}

export function beginBatch() {
  batchMode = true
}

export function endBatch() {
  batchMode = false
  saveDatabase()
}

/** 同步将当前内存 DB 落盘（用于退出前确保不丢数据） */
function saveDatabaseSync() {
  if (!db || !dbPath) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

/** 等待异步保存队列完成（供测试/退出流程 await） */
export function flushDatabase(): Promise<void> {
  return saveQueue.then(() => undefined).catch(() => undefined)
}

export function closeDatabase() {
  if (db) {
    // 同步落盘，避免异步队列在 db.close() 之后才执行（会写入已关闭的 DB 并丢数据）
    saveDatabaseSync()
    db.close()
  }
}
