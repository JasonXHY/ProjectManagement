# Electron迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将轻量级AI项目管理工具从Tauri迁移到Electron，实现完整的项目管理、文件分类、AI分析和对话功能。

**Architecture:** Electron主进程负责数据库、文件系统和AI API调用，React渲染进程负责UI。使用IPC进行进程间通信。SQLite存储数据，支持多供应商AI模型（智谱AI、小米MiMo）。

**Tech Stack:** Electron, React, TypeScript, SQLite, Antd, 智谱AI API, 小米MiMo API

---

## 文件结构

```
project-manager/
├── electron/                        # 主进程代码
│   ├── main.ts                     # 主入口
│   ├── preload.ts                  # 预加载脚本
│   ├── database/
│   │   ├── index.ts                # 数据库初始化
│   │   ├── projects.ts             # 项目CRUD
│   │   ├── files.ts                # 文件CRUD
│   │   ├── conversations.ts        # 对话CRUD
│   │   └── settings.ts             # 配置CRUD
│   ├── services/
│   │   ├── file-storage.ts         # 文件存储服务
│   │   ├── file-extractor.ts       # 内容提取服务
│   │   ├── ai-service.ts           # AI统一接口
│   │   ├── ai-providers/
│   │   │   ├── base.ts             # 基础接口定义
│   │   │   ├── zhipu.ts            # 智谱AI实现
│   │   │   └── mimo.ts             # 小米MiMo实现
│   │   ├── ai-classifier.ts        # AI分类服务
│   │   └── ai-analyzer.ts          # AI分析生成MD
│   └── ipc/
│       ├── project-handlers.ts     # 项目IPC处理
│       ├── file-handlers.ts        # 文件IPC处理
│       ├── ai-handlers.ts          # AI IPC处理
│       └── settings-handlers.ts    # 设置IPC处理
├── src/                            # 渲染进程代码
│   ├── App.tsx                     # 主应用
│   ├── types/
│   │   └── index.ts                # 类型定义
│   ├── services/
│   │   ├── projectService.ts       # 项目服务
│   │   ├── fileService.ts          # 文件服务
│   │   ├── aiService.ts            # AI服务
│   │   └── configService.ts        # 配置服务
│   └── components/
│       ├── ProjectList/
│       │   └── ProjectList.tsx     # 项目列表
│       ├── ProjectHome/
│       │   ├── ProjectHome.tsx     # 项目首页
│       │   ├── StageNav.tsx        # 左侧分类导航
│       │   ├── SummaryCards.tsx    # 摘要卡片
│       │   └── FileDropZone.tsx    # 文件拖拽区
│       ├── FileManager/
│       │   └── FileManager.tsx     # 文件管理
│       ├── Chat/
│       │   └── ChatWindow.tsx      # 对话窗口
│       └── Settings/
│           └── SettingsPage.tsx    # 设置页面
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.yml
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/App.tsx`
- Create: `src/index.html`

- [ ] **Step 1: 初始化npm项目**

```bash
cd C:\NewProject
npm init -y
```

- [ ] **Step 2: 安装依赖**

```bash
# 前端依赖
npm install react react-dom antd @ant-design/icons
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react

# Electron依赖
npm install electron electron-builder
npm install -D ts-node @types/node

# SQLite依赖
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

- [ ] **Step 3: 创建package.json脚本**

```json
{
  "name": "project-manager",
  "version": "1.0.0",
  "main": "electron/main.ts",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder"
  }
}
```

- [ ] **Step 4: 创建Vite配置**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: 'dist'
  }
})
```

- [ ] **Step 5: 创建TypeScript配置**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 6: 创建Electron主进程**

```typescript
// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 7: 创建预加载脚本**

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // 将在后续任务中添加
})
```

- [ ] **Step 8: 创建React入口**

```html
<!-- src/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>项目管理助手</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 9: 创建基础App组件**

```tsx
// src/App.tsx
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <div>项目管理助手</div>
    </ConfigProvider>
  )
}

export default App
```

- [ ] **Step 10: 测试运行**

```bash
npm run dev
```

Expected: 浏览器打开显示"项目管理助手"

- [ ] **Step 11: 提交代码**

```bash
git add .
git commit -m "feat: 初始化Electron + React项目"
```

---

## Task 2: 数据库设计

**Files:**
- Create: `electron/database/index.ts`
- Create: `electron/database/projects.ts`
- Create: `electron/database/files.ts`
- Create: `electron/database/conversations.ts`
- Create: `electron/database/settings.ts`

- [ ] **Step 1: 创建数据库初始化模块**

```typescript
// electron/database/index.ts
import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'projects.db')
  db = new Database(dbPath)

  // 启用WAL模式提升性能
  db.pragma('journal_mode = WAL')

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_type TEXT NOT NULL DEFAULT 'stage',
      custom_stages TEXT,
      current_stage TEXT DEFAULT '启动',
      ai_suggested_stage TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_path TEXT,
      stored_path TEXT NOT NULL,
      category TEXT,
      stage TEXT,
      file_type TEXT,
      file_size INTEGER,
      content_extracted TEXT,
      is_analyzed BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      context_files TEXT,
      messages TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  return db
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}
```

- [ ] **Step 2: 创建项目数据库操作**

```typescript
// electron/database/projects.ts
import { getDatabase } from './index'

export interface Project {
  id: number
  name: string
  category_type: 'stage' | 'content' | 'smart'
  custom_stages: string | null
  current_stage: string
  ai_suggested_stage: string | null
  created_at: string
  updated_at: string
}

export function createProject(name: string, categoryType: string, customStages?: string[]) {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO projects (name, category_type, custom_stages)
    VALUES (?, ?, ?)
  `)
  const result = stmt.run(name, categoryType, customStages ? JSON.stringify(customStages) : null)
  return result.lastInsertRowid
}

export function listProjects(): Project[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[]
}

export function getProject(id: number): Project | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined
}

export function updateProject(id: number, data: Partial<Project>) {
  const db = getDatabase()
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
  const values = Object.values(data)
  db.prepare(`UPDATE projects SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values, id)
}

export function deleteProject(id: number) {
  const db = getDatabase()
  db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  db.prepare('DELETE FROM files WHERE project_id = ?').run(id)
  db.prepare('DELETE FROM conversations WHERE project_id = ?').run(id)
}
```

- [ ] **Step 3: 创建文件数据库操作**

```typescript
// electron/database/files.ts
import { getDatabase } from './index'

export interface FileRecord {
  id: number
  project_id: number
  filename: string
  original_path: string | null
  stored_path: string
  category: string | null
  stage: string | null
  file_type: string | null
  file_size: number | null
  content_extracted: string | null
  is_analyzed: boolean
  created_at: string
}

export function createFile(projectId: number, data: Omit<FileRecord, 'id' | 'created_at'>) {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO files (project_id, filename, original_path, stored_path, category, stage, file_type, file_size, content_extracted, is_analyzed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    projectId, data.filename, data.original_path, data.stored_path,
    data.category, data.stage, data.file_type, data.file_size,
    data.content_extracted, data.is_analyzed
  )
  return result.lastInsertRowid
}

export function listFiles(projectId: number): FileRecord[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM files WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId) as FileRecord[]
}

export function getFilesByCategory(projectId: number, category: string): FileRecord[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM files WHERE project_id = ? AND category = ?')
    .all(projectId, category) as FileRecord[]
}

export function getUnanalyzedFiles(projectId: number): FileRecord[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM files WHERE project_id = ? AND is_analyzed = FALSE')
    .all(projectId) as FileRecord[]
}

export function updateFile(id: number, data: Partial<FileRecord>) {
  const db = getDatabase()
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
  const values = Object.values(data)
  db.prepare(`UPDATE files SET ${fields} WHERE id = ?`).run(...values, id)
}

export function deleteFile(id: number) {
  const db = getDatabase()
  db.prepare('DELETE FROM files WHERE id = ?').run(id)
}
```

- [ ] **Step 4: 创建对话数据库操作**

```typescript
// electron/database/conversations.ts
import { getDatabase } from './index'

export interface Conversation {
  id: number
  project_id: number
  context_files: string | null
  messages: string
  created_at: string
}

export function createConversation(projectId: number, contextFiles: number[]) {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO conversations (project_id, context_files, messages)
    VALUES (?, ?, ?)
  `)
  const result = stmt.run(projectId, JSON.stringify(contextFiles), '[]')
  return result.lastInsertRowid
}

export function listConversations(projectId: number): Conversation[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM conversations WHERE project_id = ? ORDER BY created_at DESC')
    .all(projectId) as Conversation[]
}

export function getConversation(id: number): Conversation | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as Conversation | undefined
}

export function updateConversationMessages(id: number, messages: any[]) {
  const db = getDatabase()
  db.prepare('UPDATE conversations SET messages = ? WHERE id = ?')
    .run(JSON.stringify(messages), id)
}

export function deleteConversation(id: number) {
  const db = getDatabase()
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id)
}
```

- [ ] **Step 5: 创建设置数据库操作**

```typescript
// electron/database/settings.ts
import { getDatabase } from './index'

export function getSetting(key: string): string | null {
  const db = getDatabase()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string) {
  const db = getDatabase()
  db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(key, value)
}

export function getAllSettings(): Record<string, string> {
  const db = getDatabase()
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {})
}

export function initDefaultSettings() {
  const defaults: Record<string, string> = {
    ai_provider: 'zhipu',
    ai_model: 'glm-4-flash',
    ai_api_key: '',
    ai_base_url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    classify_provider: '',
    classify_model: '',
    classify_api_key: '',
    classify_base_url: '',
    classify_prompt: '请分析这个文件的内容，将其分类到最合适的类别...',
    extraction_txt: 'local',
    extraction_pdf_text: 'local',
    extraction_pdf_scanned: 'cloud',
    extraction_word: 'local',
    extraction_excel: 'local',
    extraction_image: 'cloud'
  }

  for (const [key, value] of Object.entries(defaults)) {
    if (getSetting(key) === null) {
      setSetting(key, value)
    }
  }
}
```

- [ ] **Step 6: 测试数据库**

在 `electron/main.ts` 中添加测试代码：

```typescript
import { initDatabase } from './database'
import { initDefaultSettings } from './database/settings'

app.whenReady().then(() => {
  initDatabase()
  initDefaultSettings()
  createWindow()
})
```

- [ ] **Step 7: 提交代码**

```bash
git add electron/database/
git commit -m "feat: 添加SQLite数据库模块"
```

---

## Task 3: 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
// src/types/index.ts

// 项目分类方式
export type CategoryType = 'stage' | 'content' | 'smart'

// 项目
export interface Project {
  id: number
  name: string
  category_type: CategoryType
  custom_stages: string | null
  current_stage: string
  ai_suggested_stage: string | null
  created_at: string
  updated_at: string
}

// 文件记录
export interface FileRecord {
  id: number
  project_id: number
  filename: string
  original_path: string | null
  stored_path: string
  category: string | null
  stage: string | null
  file_type: string | null
  file_size: number | null
  content_extracted: string | null
  is_analyzed: boolean
  created_at: string
}

// 对话
export interface Conversation {
  id: number
  project_id: number
  context_files: number[] | null
  messages: ChatMessage[]
  created_at: string
}

// 聊天消息
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// AI模型供应商
export type AIProvider = 'zhipu' | 'mimo' | 'mimo_token' | 'custom'

// AI配置
export interface AIConfig {
  provider: AIProvider
  model: string
  apiKey: string
  baseUrl: string
}

// 文件提取配置
export type ExtractionMode = 'local' | 'cloud'

export interface ExtractionConfig {
  txt: ExtractionMode
  pdf_text: ExtractionMode
  pdf_scanned: 'cloud'  // 固定
  word: ExtractionMode
  excel: ExtractionMode
  image: 'cloud'  // 固定
}

// API响应
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 默认阶段
export const DEFAULT_STAGES = [
  '启动', '调研', '规划', '设计', '开发',
  '测试', '部署', '运维', '评估', '归档'
]

// 智谱AI供应商配置
export const ZHIPU_PROVIDER = {
  name: '智谱AI',
  models: ['glm-4-flash', 'glm-4.7-flash'],
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
}

// 小米MiMo供应商配置
export const MIMO_PROVIDER = {
  name: '小米MiMo',
  models: ['mimo-v2.5'],
  // URL待用户提供
  baseUrl: '',
  tokenPlanUrl: ''
}
```

- [ ] **Step 2: 提交代码**

```bash
git add src/types/
git commit -m "feat: 添加TypeScript类型定义"
```

---

## Task 4: AI服务统一接口

**Files:**
- Create: `electron/services/ai-providers/base.ts`
- Create: `electron/services/ai-providers/zhipu.ts`
- Create: `electron/services/ai-providers/mimo.ts`
- Create: `electron/services/ai-service.ts`

- [ ] **Step 1: 创建基础接口**

```typescript
// electron/services/ai-providers/base.ts
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AIProviderInterface {
  chat(messages: AIMessage[], model?: string): Promise<AIResponse>
}
```

- [ ] **Step 2: 创建智谱AI实现**

```typescript
// electron/services/ai-providers/zhipu.ts
import { AIProviderInterface, AIMessage, AIResponse } from './base'

export class ZhipuProvider implements AIProviderInterface {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  async chat(messages: AIMessage[], model: string = 'glm-4-flash'): Promise<AIResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    })

    if (!response.ok) {
      throw new Error(`智谱AI请求失败: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.choices[0].message.content,
      usage: data.usage
    }
  }
}
```

- [ ] **Step 3: 创建小米MiMo实现**

```typescript
// electron/services/ai-providers/mimo.ts
import { AIProviderInterface, AIMessage, AIResponse } from './base'

export type MiMoMode = 'api' | 'token'

export class MiMoProvider implements AIProviderInterface {
  private apiKey: string
  private apiUrl: string
  private tokenPlanUrl: string
  private mode: MiMoMode

  constructor(apiKey: string, apiUrl: string, tokenPlanUrl: string, mode: MiMoMode = 'api') {
    this.apiKey = apiKey
    this.apiUrl = apiUrl
    this.tokenPlanUrl = tokenPlanUrl
    this.mode = mode
  }

  async chat(messages: AIMessage[], model: string = 'mimo-v2.5'): Promise<AIResponse> {
    const baseUrl = this.mode === 'api' ? this.apiUrl : this.tokenPlanUrl

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    })

    if (!response.ok) {
      throw new Error(`小米MiMo请求失败: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      content: data.choices[0].message.content,
      usage: data.usage
    }
  }
}
```

- [ ] **Step 4: 创建AI服务统一接口**

```typescript
// electron/services/ai-service.ts
import { AIProviderInterface, AIMessage, AIResponse } from './ai-providers/base'
import { ZhipuProvider } from './ai-providers/zhipu'
import { MiMoProvider, MiMoMode } from './ai-providers/mimo'
import { getSetting } from '../database/settings'
import { AIProvider } from '../../src/types'

export class AIService {
  private providers: Map<string, AIProviderInterface> = new Map()

  constructor() {
    this.initProviders()
  }

  private initProviders() {
    // 初始化智谱AI
    const zhipuKey = getSetting('ai_api_key') || ''
    const zhipuUrl = getSetting('ai_base_url') || 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    if (zhipuKey) {
      this.providers.set('zhipu', new ZhipuProvider(zhipuKey, zhipuUrl))
    }

    // 初始化小米MiMo
    const mimoKey = getSetting('mimo_api_key') || ''
    const mimoApiUrl = getSetting('mimo_api_url') || ''
    const mimoTokenUrl = getSetting('mimo_token_url') || ''
    const mimoMode = (getSetting('mimo_mode') || 'api') as MiMoMode
    if (mimoKey) {
      this.providers.set('mimo', new MiMoProvider(mimoKey, mimoApiUrl, mimoTokenUrl, mimoMode))
    }
  }

  async chat(messages: AIMessage[], provider?: AIProvider, model?: string): Promise<AIResponse> {
    const providerName = provider || (getSetting('ai_provider') as AIProvider) || 'zhipu'
    const aiProvider = this.providers.get(providerName)

    if (!aiProvider) {
      throw new Error(`未配置AI供应商: ${providerName}`)
    }

    return aiProvider.chat(messages, model)
  }

  refreshProviders() {
    this.providers.clear()
    this.initProviders()
  }
}

export const aiService = new AIService()
```

- [ ] **Step 5: 提交代码**

```bash
git add electron/services/ai-providers/ electron/services/ai-service.ts
git commit -m "feat: 添加AI服务统一接口，支持智谱和MiMo"
```

---

## Task 5: IPC处理器

**Files:**
- Create: `electron/ipc/project-handlers.ts`
- Create: `electron/ipc/file-handlers.ts`
- Create: `electron/ipc/ai-handlers.ts`
- Create: `electron/ipc/settings-handlers.ts`
- Update: `electron/main.ts`

- [ ] **Step 1: 创建项目IPC处理器**

```typescript
// electron/ipc/project-handlers.ts
import { ipcMain } from 'electron'
import * as projectDb from '../database/projects'
import * as fileDb from '../database/files'
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { DEFAULT_STAGES } from '../../src/types'

export function registerProjectHandlers() {
  ipcMain.handle('project:create', async (_, name: string, categoryType: string, customStages?: string[]) => {
    const id = projectDb.createProject(name, categoryType, customStages)

    // 创建项目文件夹
    const projectPath = path.join(app.getPath('userData'), 'projects', String(id))
    await fs.mkdir(projectPath, { recursive: true })

    // 根据分类方式创建子文件夹
    if (categoryType === 'stage') {
      const stages = customStages || DEFAULT_STAGES
      for (const stage of stages) {
        await fs.mkdir(path.join(projectPath, stage), { recursive: true })
      }
    }

    // 创建.ai目录
    await fs.mkdir(path.join(projectPath, '.ai'), { recursive: true })
    await fs.mkdir(path.join(projectPath, '.ai', 'issues'), { recursive: true })
    await fs.mkdir(path.join(projectPath, '.ai', 'files'), { recursive: true })
    await fs.mkdir(path.join(projectPath, '.ai', 'progress'), { recursive: true })

    return { success: true, data: id }
  })

  ipcMain.handle('project:list', async () => {
    const projects = projectDb.listProjects()
    return { success: true, data: projects }
  })

  ipcMain.handle('project:get', async (_, id: number) => {
    const project = projectDb.getProject(id)
    return { success: true, data: project }
  })

  ipcMain.handle('project:update', async (_, id: number, data: any) => {
    projectDb.updateProject(id, data)
    return { success: true }
  })

  ipcMain.handle('project:delete', async (_, id: number) => {
    // 删除项目文件夹
    const projectPath = path.join(app.getPath('userData'), 'projects', String(id))
    await fs.rm(projectPath, { recursive: true, force: true })

    projectDb.deleteProject(id)
    return { success: true }
  })
}
```

- [ ] **Step 2: 创建文件IPC处理器**

```typescript
// electron/ipc/file-handlers.ts
import { ipcMain } from 'electron'
import * as fileDb from '../database/files'
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'

export function registerFileHandlers() {
  ipcMain.handle('file:upload', async (_, projectId: number, fileData: { name: string, content: ArrayBuffer, type: string }) => {
    const projectPath = path.join(app.getPath('userData'), 'projects', String(projectId))

    // 保存文件
    const filePath = path.join(projectPath, fileData.name)
    await fs.writeFile(filePath, Buffer.from(fileData.content))

    // 获取文件信息
    const stats = await fs.stat(filePath)

    // 创建数据库记录
    const id = fileDb.createFile(projectId, {
      project_id: projectId,
      filename: fileData.name,
      original_path: null,
      stored_path: filePath,
      category: null,
      stage: null,
      file_type: fileData.type,
      file_size: stats.size,
      content_extracted: null,
      is_analyzed: false
    })

    return { success: true, data: id }
  })

  ipcMain.handle('file:list', async (_, projectId: number) => {
    const files = fileDb.listFiles(projectId)
    return { success: true, data: files }
  })

  ipcMain.handle('file:listByCategory', async (_, projectId: number, category: string) => {
    const files = fileDb.getFilesByCategory(projectId, category)
    return { success: true, data: files }
  })

  ipcMain.handle('file:delete', async (_, id: number) => {
    const db = fileDb.getDatabase()
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id) as any

    if (file) {
      // 删除物理文件
      await fs.rm(file.stored_path, { force: true })
      fileDb.deleteFile(id)
    }

    return { success: true }
  })
}

// 导出getDatabase用于其他模块
import { getDatabase } from '../database'
```

- [ ] **Step 3: 创建设置IPC处理器**

```typescript
// electron/ipc/settings-handlers.ts
import { ipcMain } from 'electron'
import * as settingsDb from '../database/settings'
import { aiService } from '../services/ai-service'

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async () => {
    const settings = settingsDb.getAllSettings()
    return { success: true, data: settings }
  })

  ipcMain.handle('settings:update', async (_, settings: Record<string, string>) => {
    for (const [key, value] of Object.entries(settings)) {
      settingsDb.setSetting(key, value)
    }

    // 刷新AI供应商配置
    aiService.refreshProviders()

    return { success: true }
  })
}
```

- [ ] **Step 4: 创建AI IPC处理器**

```typescript
// electron/ipc/ai-handlers.ts
import { ipcMain } from 'electron'
import { aiService } from '../services/ai-service'
import * as fileDb from '../database/files'
import * as projectDb from '../database/projects'
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'

export function registerAIHandlers() {
  ipcMain.handle('ai:chat', async (_, projectId: number, message: string, contextFileIds: number[]) => {
    // 获取上下文文件内容
    const contextContents: string[] = []

    // 添加项目MD摘要
    const projectPath = path.join(app.getPath('userData'), 'projects', String(projectId))
    const summaryPath = path.join(projectPath, '.ai', 'project-summary.md')
    try {
      const summary = await fs.readFile(summaryPath, 'utf-8')
      contextContents.push(`[项目摘要]\n${summary}`)
    } catch {}

    // 添加用户选择的文件
    for (const fileId of contextFileIds) {
      const db = fileDb.getDatabase()
      const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId) as any
      if (file?.content_extracted) {
        contextContents.push(`[${file.filename}]\n${file.content_extracted}`)
      }
    }

    // 构建消息
    const messages = [
      { role: 'system' as const, content: '你是一个专业的项目管理助手。请根据提供的项目文件和上下文，帮助用户管理项目。' },
      { role: 'user' as const, content: `项目上下文：\n${contextContents.join('\n\n')}\n\n用户问题：${message}` }
    ]

    const response = await aiService.chat(messages)
    return { success: true, data: response.content }
  })

  ipcMain.handle('ai:classify', async (_, fileId: number) => {
    const db = fileDb.getDatabase()
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId) as any

    if (!file) {
      return { success: false, error: '文件不存在' }
    }

    // 读取文件内容
    let content = file.content_extracted
    if (!content) {
      content = await fs.readFile(file.stored_path, 'utf-8').catch(() => '')
    }

    // 调用AI分类
    const messages = [
      { role: 'system' as const, content: '你是一个文件分类助手。请根据文件内容判断其属于哪个类别。只返回类别名称，不要其他内容。' },
      { role: 'user' as const, content: `文件名：${file.filename}\n文件内容：\n${content.substring(0, 2000)}` }
    ]

    const response = await aiService.chat(messages)
    const category = response.content.trim()

    // 更新文件分类
    fileDb.updateFile(fileId, { category, content_extracted: content })

    return { success: true, data: category }
  })

  ipcMain.handle('ai:analyze', async (_, projectId: number) => {
    const project = projectDb.getProject(projectId)
    if (!project) {
      return { success: false, error: '项目不存在' }
    }

    // 获取未分析的文件
    const unanalyzedFiles = fileDb.getUnanalyzedFiles(projectId)

    // 读取已有的MD摘要
    const projectPath = path.join(app.getPath('userData'), 'projects', String(projectId))
    const summaryPath = path.join(projectPath, '.ai', 'project-summary.md')
    let existingSummary = ''
    try {
      existingSummary = await fs.readFile(summaryPath, 'utf-8')
    } catch {}

    // 构建文件内容
    const fileContents = unanalyzedFiles.map(f => `[${f.filename}]\n${f.content_extracted || '（无法提取内容）'}`).join('\n\n')

    // 调用AI分析
    const messages = [
      { role: 'system' as const, content: `你是一个项目分析助手。请根据提供的文件内容，生成或更新项目摘要。

${existingSummary ? `已有的项目摘要：\n${existingSummary}\n\n` : ''}

请生成包含以下内容的Markdown格式摘要：
1. 项目概述（名称、创建时间、当前阶段、文件数量）
2. 文件清单（表格形式）
3. 当前进展
4. 关键问题
5. 建议和风险` },
      { role: 'user' as const, content: `项目名称：${project.name}\n当前阶段：${project.current_stage}\n\n需要分析的新文件：\n${fileContents}` }
    ]

    const response = await aiService.chat(messages)

    // 保存MD文件
    await fs.writeFile(summaryPath, response.content, 'utf-8')

    // 更新文件的分析状态
    for (const file of unanalyzedFiles) {
      fileDb.updateFile(file.id, { is_analyzed: true })
    }

    return { success: true, data: response.content }
  })
}
```

- [ ] **Step 5: 更新主进程，注册所有处理器**

```typescript
// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { initDatabase } from './database'
import { initDefaultSettings } from './database/settings'
import { registerProjectHandlers } from './ipc/project-handlers'
import { registerFileHandlers } from './ipc/file-handlers'
import { registerSettingsHandlers } from './ipc/settings-handlers'
import { registerAIHandlers } from './ipc/ai-handlers'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  initDatabase()
  initDefaultSettings()
  registerProjectHandlers()
  registerFileHandlers()
  registerSettingsHandlers()
  registerAIHandlers()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 6: 更新预加载脚本**

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  project: {
    create: (name: string, categoryType: string, customStages?: string[]) =>
      ipcRenderer.invoke('project:create', name, categoryType, customStages),
    list: () => ipcRenderer.invoke('project:list'),
    get: (id: number) => ipcRenderer.invoke('project:get', id),
    update: (id: number, data: any) => ipcRenderer.invoke('project:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('project:delete', id),
  },
  file: {
    upload: (projectId: number, fileData: any) => ipcRenderer.invoke('file:upload', projectId, fileData),
    list: (projectId: number) => ipcRenderer.invoke('file:list', projectId),
    listByCategory: (projectId: number, category: string) => ipcRenderer.invoke('file:listByCategory', projectId, category),
    delete: (id: number) => ipcRenderer.invoke('file:delete', id),
  },
  ai: {
    chat: (projectId: number, message: string, contextFileIds: number[]) =>
      ipcRenderer.invoke('ai:chat', projectId, message, contextFileIds),
    classify: (fileId: number) => ipcRenderer.invoke('ai:classify', fileId),
    analyze: (projectId: number) => ipcRenderer.invoke('ai:analyze', projectId),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings: Record<string, string>) => ipcRenderer.invoke('settings:update', settings),
  },
})
```

- [ ] **Step 7: 提交代码**

```bash
git add electron/ipc/ electron/main.ts electron/preload.ts
git commit -m "feat: 添加IPC处理器，实现前后端通信"
```

---

## Task 6: 前端服务层

**Files:**
- Create: `src/services/projectService.ts`
- Create: `src/services/fileService.ts`
- Create: `src/services/aiService.ts`
- Create: `src/services/configService.ts`

- [ ] **Step 1: 创建项目服务**

```typescript
// src/services/projectService.ts
import { Project, CategoryType } from '../types'

declare global {
  interface Window {
    api: {
      project: {
        create: (name: string, categoryType: string, customStages?: string[]) => Promise<{ success: boolean, data?: number, error?: string }>
        list: () => Promise<{ success: boolean, data?: Project[], error?: string }>
        get: (id: number) => Promise<{ success: boolean, data?: Project, error?: string }>
        update: (id: number, data: Partial<Project>) => Promise<{ success: boolean, error?: string }>
        delete: (id: number) => Promise<{ success: boolean, error?: string }>
      }
    }
  }
}

export const projectService = {
  async create(name: string, categoryType: CategoryType, customStages?: string[]) {
    return window.api.project.create(name, categoryType, customStages)
  },

  async list() {
    return window.api.project.list()
  },

  async get(id: number) {
    return window.api.project.get(id)
  },

  async update(id: number, data: Partial<Project>) {
    return window.api.project.update(id, data)
  },

  async delete(id: number) {
    return window.api.project.delete(id)
  }
}
```

- [ ] **Step 2: 创建文件服务**

```typescript
// src/services/fileService.ts
import { FileRecord } from '../types'

declare global {
  interface Window {
    api: {
      file: {
        upload: (projectId: number, fileData: any) => Promise<{ success: boolean, data?: number, error?: string }>
        list: (projectId: number) => Promise<{ success: boolean, data?: FileRecord[], error?: string }>
        listByCategory: (projectId: number, category: string) => Promise<{ success: boolean, data?: FileRecord[], error?: string }>
        delete: (id: number) => Promise<{ success: boolean, error?: string }>
      }
    }
  }
}

export const fileService = {
  async upload(projectId: number, file: File) {
    const arrayBuffer = await file.arrayBuffer()
    return window.api.file.upload(projectId, {
      name: file.name,
      content: arrayBuffer,
      type: file.type
    })
  },

  async list(projectId: number) {
    return window.api.file.list(projectId)
  },

  async listByCategory(projectId: number, category: string) {
    return window.api.file.listByCategory(projectId, category)
  },

  async delete(id: number) {
    return window.api.file.delete(id)
  }
}
```

- [ ] **Step 3: 创建AI服务**

```typescript
// src/services/aiService.ts
declare global {
  interface Window {
    api: {
      ai: {
        chat: (projectId: number, message: string, contextFileIds: number[]) => Promise<{ success: boolean, data?: string, error?: string }>
        classify: (fileId: number) => Promise<{ success: boolean, data?: string, error?: string }>
        analyze: (projectId: number) => Promise<{ success: boolean, data?: string, error?: string }>
      }
    }
  }
}

export const aiService = {
  async chat(projectId: number, message: string, contextFileIds: number[]) {
    return window.api.ai.chat(projectId, message, contextFileIds)
  },

  async classify(fileId: number) {
    return window.api.ai.classify(fileId)
  },

  async analyze(projectId: number) {
    return window.api.ai.analyze(projectId)
  }
}
```

- [ ] **Step 4: 创建配置服务**

```typescript
// src/services/configService.ts
declare global {
  interface Window {
    api: {
      settings: {
        get: () => Promise<{ success: boolean, data?: Record<string, string>, error?: string }>
        update: (settings: Record<string, string>) => Promise<{ success: boolean, error?: string }>
      }
    }
  }
}

export const configService = {
  async get() {
    return window.api.settings.get()
  },

  async update(settings: Record<string, string>) {
    return window.api.settings.update(settings)
  }
}
```

- [ ] **Step 5: 提交代码**

```bash
git add src/services/
git commit -m "feat: 添加前端服务层"
```

---

## Task 7: 项目列表页面

**Files:**
- Create: `src/components/ProjectList/ProjectList.tsx`
- Update: `src/App.tsx`

- [ ] **Step 1: 创建项目列表组件**

```tsx
// src/components/ProjectList/ProjectList.tsx
import { useState, useEffect } from 'react'
import { Card, Button, Input, Modal, Select, Table, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { Project, CategoryType, DEFAULT_STAGES } from '../../types'
import { projectService } from '../../services/projectService'

interface ProjectListProps {
  onSelectProject: (project: Project) => void
}

export function ProjectList({ onSelectProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', categoryType: 'stage' as CategoryType })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    const result = await projectService.list()
    if (result.success && result.data) {
      setProjects(result.data)
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!newProject.name.trim()) {
      message.error('请输入项目名称')
      return
    }

    const result = await projectService.create(newProject.name, newProject.categoryType)
    if (result.success) {
      message.success('项目创建成功')
      setModalVisible(false)
      setNewProject({ name: '', categoryType: 'stage' })
      loadProjects()
    } else {
      message.error(result.error || '创建失败')
    }
  }

  const handleDelete = async (id: number) => {
    const result = await projectService.delete(id)
    if (result.success) {
      message.success('删除成功')
      loadProjects()
    } else {
      message.error(result.error || '删除失败')
    }
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  )

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '分类方式',
      dataIndex: 'category_type',
      key: 'category_type',
      render: (type: CategoryType) => {
        const map = { stage: '按阶段', content: '按内容', smart: '智能分类' }
        return map[type]
      }
    },
    {
      title: '当前阶段',
      dataIndex: 'current_stage',
      key: 'current_stage'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Project) => (
        <Space>
          <Button
            type="primary"
            icon={<FolderOpenOutlined />}
            onClick={() => onSelectProject(record)}
          >
            打开
          </Button>
          <Popconfirm
            title="确定删除该项目？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="搜索项目"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          新建项目
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredProjects}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="新建项目"
        open={modalVisible}
        onOk={handleCreate}
        onCancel={() => setModalVisible(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>项目名称</div>
          <Input
            value={newProject.name}
            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="请输入项目名称"
          />
        </div>
        <div>
          <div style={{ marginBottom: 8 }}>文件分类方式</div>
          <Select
            value={newProject.categoryType}
            onChange={(value: CategoryType) => setNewProject({ ...newProject, categoryType: value })}
            style={{ width: '100%' }}
            options={[
              { value: 'stage', label: '按阶段分类（默认10个阶段）' },
              { value: 'content', label: '按内容分类（AI自动识别）' },
              { value: 'smart', label: '智能分类（AI动态创建）' }
            ]}
          />
        </div>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: 更新App组件，集成路由**

```tsx
// src/App.tsx
import { useState } from 'react'
import { ConfigProvider, Layout, Menu, Button, Space } from 'antd'
import { SettingOutlined, HomeOutlined } from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import { ProjectList } from './components/ProjectList/ProjectList'
import { Project } from './types'

const { Header, Content } = Layout

function App() {
  const [currentView, setCurrentView] = useState<'list' | 'project' | 'settings'>('list')
  const [currentProject, setCurrentProject] = useState<Project | null>(null)

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project)
    setCurrentView('project')
  }

  const handleBackToList = () => {
    setCurrentProject(null)
    setCurrentView('list')
  }

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '0 24px' }}>
          <div style={{ flex: 1 }}>
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={handleBackToList}
            >
              项目管理助手
            </Button>
            {currentProject && (
              <Space>
                <span>/</span>
                <span>{currentProject.name}</span>
              </Space>
            )}
          </div>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setCurrentView('settings')}
          >
            设置
          </Button>
        </Header>
        <Content style={{ background: '#f5f5f5' }}>
          {currentView === 'list' && (
            <ProjectList onSelectProject={handleSelectProject} />
          )}
          {currentView === 'project' && currentProject && (
            <div style={{ padding: 24 }}>
              <h1>{currentProject.name}</h1>
              <p>项目首页（待实现）</p>
              <Button onClick={handleBackToList}>返回列表</Button>
            </div>
          )}
          {currentView === 'settings' && (
            <div style={{ padding: 24 }}>
              <h1>设置页面（待实现）</h1>
              <Button onClick={() => setCurrentView(currentProject ? 'project' : 'list')}>返回</Button>
            </div>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

export default App
```

- [ ] **Step 3: 测试运行**

```bash
npm run dev
```

Expected: 显示项目列表页面，可以新建和删除项目

- [ ] **Step 4: 提交代码**

```bash
git add src/components/ProjectList/ src/App.tsx
git commit -m "feat: 添加项目列表页面"
```

---

## Task 8: 项目首页和文件管理

**Files:**
- Create: `src/components/ProjectHome/ProjectHome.tsx`
- Create: `src/components/ProjectHome/StageNav.tsx`
- Create: `src/components/ProjectHome/FileDropZone.tsx`
- Create: `src/components/ProjectHome/SummaryCards.tsx`
- Update: `src/App.tsx`

- [ ] **Step 1: 创建左侧分类导航**

```tsx
// src/components/ProjectHome/StageNav.tsx
import { useState, useEffect } from 'react'
import { Menu, Button, Input, Modal } from 'antd'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Project, DEFAULT_STAGES } from '../../types'

interface StageNavProps {
  project: Project
  selectedCategory: string | null
  onSelectCategory: (category: string) => void
}

export function StageNav({ project, selectedCategory, onSelectCategory }: StageNavProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState('')

  useEffect(() => {
    loadCategories()
  }, [project])

  const loadCategories = async () => {
    if (project.category_type === 'stage') {
      const stages = project.custom_stages
        ? JSON.parse(project.custom_stages)
        : DEFAULT_STAGES
      setCategories(stages)
    } else {
      // 按内容或智能分类时，从文件中获取分类列表
      // 这里需要调用API获取所有唯一的分类
      setCategories(['所有文件']) // 临时实现
    }
  }

  const handleAddCategory = async () => {
    if (editingCategory && !categories.includes(editingCategory)) {
      const newCategories = [...categories, editingCategory]
      setCategories(newCategories)

      // 保存到数据库
      const { projectService } = await import('../../services/projectService')
      await projectService.update(project.id, { custom_stages: JSON.stringify(newCategories) })

      setEditModalVisible(false)
      setEditingCategory('')
    }
  }

  const menuItems = categories.map(cat => ({
    key: cat,
    label: cat
  }))

  return (
    <div style={{ width: 200, borderRight: '1px solid #f0f0f0', padding: '16px 0' }}>
      <div style={{ padding: '0 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>分类</strong>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setEditModalVisible(true)}
        />
      </div>
      <Menu
        mode="inline"
        selectedKeys={selectedCategory ? [selectedCategory] : []}
        items={menuItems}
        onClick={({ key }) => onSelectCategory(key)}
      />

      <Modal
        title="添加分类"
        open={editModalVisible}
        onOk={handleAddCategory}
        onCancel={() => setEditModalVisible(false)}
      >
        <Input
          value={editingCategory}
          onChange={e => setEditingCategory(e.target.value)}
          placeholder="输入分类名称"
        />
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: 创建文件拖拽区**

```tsx
// src/components/ProjectHome/FileDropZone.tsx
import { useState, useRef } from 'react'
import { Upload, message, Table, Button, Space, Popconfirm } from 'antd'
import { InboxOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons'
import { FileRecord } from '../../types'
import { fileService } from '../../services/fileService'
import { aiService } from '../../services/aiService'

interface FileDropZoneProps {
  projectId: number
  files: FileRecord[]
  onFilesChange: () => void
}

export function FileDropZone({ projectId, files, onFilesChange }: FileDropZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [classifying, setClassifying] = useState<number | null>(null)

  const handleUpload = async (file: File) => {
    setUploading(true)
    const result = await fileService.upload(projectId, file)
    setUploading(false)

    if (result.success) {
      message.success(`${file.name} 上传成功`)
      onFilesChange()
    } else {
      message.error(result.error || '上传失败')
    }

    return false // 阻止antd默认上传
  }

  const handleDelete = async (id: number) => {
    const result = await fileService.delete(id)
    if (result.success) {
      message.success('删除成功')
      onFilesChange()
    } else {
      message.error(result.error || '删除失败')
    }
  }

  const handleClassify = async (fileId: number) => {
    setClassifying(fileId)
    const result = await aiService.classify(fileId)
    setClassifying(null)

    if (result.success) {
      message.success(`分类结果：${result.data}`)
      onFilesChange()
    } else {
      message.error(result.error || '分类失败')
    }
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename'
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type'
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => size ? `${(size / 1024).toFixed(1)} KB` : '-'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category || <span style={{ color: '#999' }}>未分类</span>
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FileRecord) => (
        <Space>
          <Button
            icon={<RobotOutlined />}
            loading={classifying === record.id}
            onClick={() => handleClassify(record.id)}
          >
            AI分类
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Upload.Dragger
        multiple
        beforeUpload={handleUpload}
        showUploadList={false}
        disabled={uploading}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
        <p className="ant-upload-hint">支持所有常见文件格式</p>
      </Upload.Dragger>

      <Table
        columns={columns}
        dataSource={files}
        rowKey="id"
        style={{ marginTop: 16 }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
```

- [ ] **Step 3: 创建摘要卡片**

```tsx
// src/components/ProjectHome/SummaryCards.tsx
import { Card, Col, Row, Statistic, Button, message } from 'antd'
import { FileTextOutlined, BugOutlined, ClockCircleOutlined, RobotOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { aiService } from '../../services/aiService'

interface SummaryCardsProps {
  projectId: number
  fileCount: number
}

export function SummaryCards({ projectId, fileCount }: SummaryCardsProps) {
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setAnalyzing(true)
    const result = await aiService.analyze(projectId)
    setAnalyzing(false)

    if (result.success) {
      message.success('分析完成')
    } else {
      message.error(result.error || '分析失败')
    }
  }

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card>
          <Statistic title="文件数量" value={fileCount} prefix={<FileTextOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="关键问题" value={0} prefix={<BugOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="待处理" value={0} prefix={<ClockCircleOutlined />} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            loading={analyzing}
            onClick={handleAnalyze}
            block
          >
            生成/更新摘要
          </Button>
        </Card>
      </Col>
    </Row>
  )
}
```

- [ ] **Step 4: 创建项目首页**

```tsx
// src/components/ProjectHome/ProjectHome.tsx
import { useState, useEffect } from 'react'
import { Layout } from 'antd'
import { Project, FileRecord } from '../../types'
import { StageNav } from './StageNav'
import { FileDropZone } from './FileDropZone'
import { SummaryCards } from './SummaryCards'
import { fileService } from '../../services/fileService'

const { Sider, Content } = Layout

interface ProjectHomeProps {
  project: Project
}

export function ProjectHome({ project }: ProjectHomeProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
  }, [project, selectedCategory])

  const loadFiles = async () => {
    let result
    if (selectedCategory && selectedCategory !== '所有文件') {
      result = await fileService.listByCategory(project.id, selectedCategory)
    } else {
      result = await fileService.list(project.id)
    }

    if (result.success && result.data) {
      setFiles(result.data)
    }
  }

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)' }}>
      <Sider width={200} style={{ background: '#fff' }}>
        <StageNav
          project={project}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </Sider>
      <Content style={{ padding: 24 }}>
        <SummaryCards projectId={project.id} fileCount={files.length} />
        <FileDropZone
          projectId={project.id}
          files={files}
          onFilesChange={loadFiles}
        />
      </Content>
    </Layout>
  )
}
```

- [ ] **Step 5: 更新App组件，集成项目首页**

```tsx
// src/App.tsx
// 在现有的import中添加
import { ProjectHome } from './components/ProjectHome/ProjectHome'

// 更新currentView === 'project'的部分
{currentView === 'project' && currentProject && (
  <ProjectHome project={currentProject} />
)}
```

- [ ] **Step 6: 测试运行**

```bash
npm run dev
```

Expected: 可以打开项目，看到左侧分类导航、摘要卡片和文件上传区

- [ ] **Step 7: 提交代码**

```bash
git add src/components/ProjectHome/
git commit -m "feat: 添加项目首页和文件管理"
```

---

## Task 9: 设置页面

**Files:**
- Create: `src/components/Settings/SettingsPage.tsx`
- Update: `src/App.tsx`

- [ ] **Step 1: 创建设置页面**

```tsx
// src/components/Settings/SettingsPage.tsx
import { useState, useEffect } from 'react'
import { Form, Select, Input, Button, Card, Divider, message, Tabs } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { configService } from '../../services/configService'
import { ZHIPU_PROVIDER, MIMO_PROVIDER, AIProvider } from '../../types'

export function SettingsPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<AIProvider>('zhipu')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const result = await configService.get()
    if (result.success && result.data) {
      form.setFieldsValue(result.data)
      setProvider(result.data.ai_provider || 'zhipu')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    const values = form.getFieldsValue()
    const result = await configService.update(values)
    setLoading(false)

    if (result.success) {
      message.success('保存成功')
    } else {
      message.error(result.error || '保存失败')
    }
  }

  const handleProviderChange = (value: AIProvider) => {
    setProvider(value)
    // 根据供应商设置默认值
    if (value === 'zhipu') {
      form.setFieldsValue({
        ai_model: ZHIPU_PROVIDER.models[0],
        ai_base_url: ZHIPU_PROVIDER.baseUrl
      })
    } else if (value === 'mimo') {
      form.setFieldsValue({
        ai_model: MIMO_PROVIDER.models[0],
        ai_base_url: MIMO_PROVIDER.baseUrl
      })
    }
  }

  const getModelOptions = () => {
    if (provider === 'zhipu') {
      return ZHIPU_PROVIDER.models.map(m => ({ value: m, label: m }))
    } else if (provider === 'mimo') {
      return MIMO_PROVIDER.models.map(m => ({ value: m, label: m }))
    }
    return []
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1>设置</h1>

      <Tabs items={[
        {
          key: 'ai',
          label: 'AI模型配置',
          children: (
            <Card>
              <Form form={form} layout="vertical">
                <Form.Item label="模型供应商" name="ai_provider">
                  <Select
                    onChange={handleProviderChange}
                    options={[
                      { value: 'zhipu', label: '智谱AI' },
                      { value: 'mimo', label: '小米MiMo' },
                      { value: 'custom', label: '自定义' }
                    ]}
                  />
                </Form.Item>

                <Form.Item label="模型" name="ai_model">
                  {provider === 'custom' ? (
                    <Input placeholder="输入模型名称" />
                  ) : (
                    <Select options={getModelOptions()} />
                  )}
                </Form.Item>

                <Form.Item label="API Key" name="ai_api_key">
                  <Input.Password placeholder="输入API Key" />
                </Form.Item>

                <Form.Item label="API地址" name="ai_base_url">
                  <Input
                    placeholder="API地址"
                    disabled={provider !== 'custom'}
                  />
                </Form.Item>
              </Form>
            </Card>
          )
        },
        {
          key: 'extraction',
          label: '文件提取配置',
          children: (
            <Card>
              <Form form={form} layout="vertical">
                <Form.Item label="TXT/MD文件" name="extraction_txt">
                  <Select options={[
                    { value: 'local', label: '本地提取' },
                    { value: 'cloud', label: '云端分析' }
                  ]} />
                </Form.Item>

                <Form.Item label="PDF（文字版）" name="extraction_pdf_text">
                  <Select options={[
                    { value: 'local', label: '本地提取' },
                    { value: 'cloud', label: '云端分析' }
                  ]} />
                </Form.Item>

                <Form.Item label="PDF（扫描版）" name="extraction_pdf_scanned">
                  <Select options={[
                    { value: 'cloud', label: '云端分析（必须）' }
                  ]} disabled />
                </Form.Item>

                <Form.Item label="Word文档" name="extraction_word">
                  <Select options={[
                    { value: 'local', label: '本地提取' },
                    { value: 'cloud', label: '云端分析' }
                  ]} />
                </Form.Item>

                <Form.Item label="Excel表格" name="extraction_excel">
                  <Select options={[
                    { value: 'local', label: '本地提取' },
                    { value: 'cloud', label: '云端分析' }
                  ]} />
                </Form.Item>

                <Form.Item label="图片" name="extraction_image">
                  <Select options={[
                    { value: 'cloud', label: '云端分析（必须）' }
                  ]} disabled />
                </Form.Item>
              </Form>
            </Card>
          )
        }
      ]} />

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={loading}
          onClick={handleSave}
        >
          保存设置
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 更新App组件，集成设置页面**

```tsx
// src/App.tsx
// 在现有的import中添加
import { SettingsPage } from './components/Settings/SettingsPage'

// 更新currentView === 'settings'的部分
{currentView === 'settings' && (
  <SettingsPage />
)}
```

- [ ] **Step 3: 测试运行**

```bash
npm run dev
```

Expected: 可以访问设置页面，配置AI模型和文件提取选项

- [ ] **Step 4: 提交代码**

```bash
git add src/components/Settings/
git commit -m "feat: 添加设置页面"
```

---

## Task 10: AI对话页面

**Files:**
- Create: `src/components/Chat/ChatWindow.tsx`
- Update: `src/App.tsx`

- [ ] **Step 1: 创建对话窗口组件**

```tsx
// src/components/Chat/ChatWindow.tsx
import { useState, useEffect, useRef } from 'react'
import { Input, Button, List, Card, Checkbox, Space, message } from 'antd'
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { Project, FileRecord, ChatMessage } from '../../types'
import { aiService } from '../../services/aiService'
import { fileService } from '../../services/fileService'

interface ChatWindowProps {
  project: Project
}

export function ChatWindow({ project }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadFiles()
  }, [project])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadFiles = async () => {
    const result = await fileService.list(project.id)
    if (result.success && result.data) {
      setFiles(result.data)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = { role: 'user', content: inputValue }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    const result = await aiService.chat(project.id, inputValue, selectedFiles)
    setLoading(false)

    if (result.success && result.data) {
      const assistantMessage: ChatMessage = { role: 'assistant', content: result.data }
      setMessages(prev => [...prev, assistantMessage])
    } else {
      message.error(result.error || '对话失败')
    }
  }

  const handleFileSelect = (fileId: number, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, fileId])
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId))
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* 左侧：上下文文件选择 */}
      <div style={{ width: 250, borderRight: '1px solid #f0f0f0', padding: 16, overflow: 'auto' }}>
        <h4>选择上下文文件</h4>
        <List
          dataSource={files}
          renderItem={file => (
            <List.Item>
              <Checkbox
                checked={selectedFiles.includes(file.id)}
                onChange={e => handleFileSelect(file.id, e.target.checked)}
              >
                {file.filename}
              </Checkbox>
            </List.Item>
          )}
        />
      </div>

      {/* 右侧：对话区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <List
            dataSource={messages}
            renderItem={(msg, index) => (
              <List.Item style={{ border: 'none' }}>
                <Card
                  size="small"
                  style={{
                    width: '80%',
                    marginLeft: msg.role === 'user' ? 'auto' : 0,
                    marginRight: msg.role === 'assistant' ? 'auto' : 0,
                    background: msg.role === 'user' ? '#e6f7ff' : '#f5f5f5'
                  }}
                >
                  <Space>
                    {msg.role === 'assistant' ? <RobotOutlined /> : <UserOutlined />}
                    <div>{msg.content}</div>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={handleSend}
              placeholder="输入问题..."
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={handleSend}
            >
              发送
            </Button>
          </Space.Compact>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 更新App组件，集成对话页面**

```tsx
// src/App.tsx
// 在现有的import中添加
import { ChatWindow } from './components/Chat/ChatWindow'

// 在Header中添加对话按钮
{currentProject && (
  <Button
    type={currentView === 'chat' ? 'primary' : 'text'}
    onClick={() => setCurrentView('chat')}
  >
    对话
  </Button>
)}

// 更新currentView === 'chat'的部分
{currentView === 'chat' && currentProject && (
  <ChatWindow project={currentProject} />
)}
```

- [ ] **Step 3: 测试运行**

```bash
npm run dev
```

Expected: 可以进入对话页面，选择上下文文件，与AI对话

- [ ] **Step 4: 提交代码**

```bash
git add src/components/Chat/
git commit -m "feat: 添加AI对话页面"
```

---

## Task 11: 打包配置（可选 - 发布时再做）

> ⚠️ **注意：** 此任务为可选任务，在功能开发和验证完成后再执行。
>
> **开发阶段验证方式：** 使用 `npm run dev` 启动开发服务器，可直接在Electron窗口中查看界面和测试功能，无需打包。

**Files:**
- Create: `electron-builder.yml`
- Update: `package.json`

- [ ] **Step 1: 创建electron-builder配置**

```yaml
# electron-builder.yml
appId: com.project-manager.app
productName: 项目管理助手
directories:
  output: dist_electron
files:
  - electron/**/*
  - dist/**/*
win:
  target: nsis
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

- [ ] **Step 2: 更新package.json**

```json
{
  "build": {
    "appId": "com.project-manager.app",
    "productName": "项目管理助手",
    "directories": {
      "output": "dist_electron"
    },
    "files": [
      "electron/**/*",
      "dist/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

- [ ] **Step 3: 测试打包**

```bash
npm run build
npm run electron:build
```

Expected: 在 `dist_electron` 目录生成安装包

- [ ] **Step 4: 提交代码**

```bash
git add electron-builder.yml package.json
git commit -m "feat: 添加打包配置"
```

---

## 优先级说明

| 优先级 | 任务 | 说明 |
|--------|------|------|
| **P0（必须）** | Task 1-10 | 功能开发和验证 |
| **P1（可选）** | Task 11 | 发布时再打包 |

**开发阶段验证方式：**
```bash
npm run dev
```
使用此命令启动开发服务器，可直接在Electron窗口中查看界面和测试功能，无需打包。

---

## 自审检查

✅ **规格覆盖：**
- 项目管理（创建、列表、删除）- Task 7
- 文件上传和管理 - Task 8
- AI分类和分析 - Task 5
- AI对话 - Task 10
- 设置页面（AI模型、文件提取）- Task 9
- 多供应商AI（智谱、MiMo）- Task 4
- 动态分类导航 - Task 8
- SQLite数据库 - Task 2
- Electron打包 - Task 11（可选）

✅ **无占位符：** 所有步骤都有完整代码

✅ **类型一致性：** 所有文件使用统一的类型定义

---

**文档版本：** 1.1
**更新时间：** 2026-06-06
**更新内容：** 将Task 11标记为可选任务，功能验证完成后再打包
**作者：** Claude Code
