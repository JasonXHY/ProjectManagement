# Electron迁移设计文档

## 一、项目概述

### 1.1 项目背景

轻量级AI项目管理工具，帮助用户管理项目文件、进行AI对话分析。原Tauri版本存在开发效率低、UI验证困难等问题，决定迁移到Electron。

### 1.2 核心目标

- 项目文件管理（按阶段/内容/智能分类）
- AI文件内容分析和分类
- AI生成项目摘要（MD文件）
- AI对话（基于项目文件上下文）
- 轻量级办公软件，易于分发

### 1.3 技术选型

| 技术 | 选型 | 说明 |
|------|------|------|
| 框架 | Electron | 桌面应用框架 |
| 前端 | React + TypeScript | UI开发 |
| 数据库 | SQLite | 本地数据存储 |
| UI组件库 | Antd | 组件库 |
| AI模型 | 智谱AI / 小米MiMo | 支持多供应商，用户自定义 |
| 打包 | electron-builder | 生成exe安装包 |

---

## 二、系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Electron应用                          │
├──────────────────────┬──────────────────────────────────┤
│     主进程 (Main)     │        渲染进程 (Renderer)        │
│                      │                                  │
│  - 数据库管理         │  - React UI                     │
│  - 文件系统操作       │  - 用户交互                      │
│  - AI API调用        │  - 状态管理                      │
│  - 系统托盘          │                                  │
├──────────────────────┴──────────────────────────────────┤
│                    SQLite数据库                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 进程通信

使用Electron的IPC（进程间通信）机制：

- **主进程 → 渲染进程：** `webContents.send`
- **渲染进程 → 主进程：** `ipcRenderer.invoke`
- **双向通信：** 预定义的API接口

### 2.3 目录结构

```
project-manager/
├── electron/                    # 主进程代码
│   ├── main.ts                 # 主入口
│   ├── preload.ts              # 预加载脚本
│   ├── database/               # 数据库操作
│   │   ├── index.ts
│   │   ├── projects.ts
│   │   ├── files.ts
│   │   └── conversations.ts
│   ├── services/               # 业务逻辑
│   │   ├── file-storage.ts     # 文件存储
│   │   ├── file-extractor.ts   # 内容提取
│   │   ├── ai-service.ts       # AI服务（统一接口）
│   │   ├── ai-providers/       # AI供应商实现
│   │   │   ├── zhipu.ts        # 智谱AI
│   │   │   ├── mimo.ts         # 小米MiMo
│   │   │   └── base.ts         # 基础接口
│   │   ├── ai-classifier.ts    # AI分类
│   │   └── ai-analyzer.ts      # AI分析生成MD
│   └── ipc/                    # IPC处理器
│       ├── project-handlers.ts
│       ├── file-handlers.ts
│       ├── ai-handlers.ts
│       └── settings-handlers.ts
├── src/                        # 渲染进程代码（React）
│   ├── components/
│   ├── services/
│   ├── types/
│   └── App.tsx
├── package.json
└── electron-builder.yml
```

---

## 三、功能模块设计

### 3.1 项目管理

#### 3.1.1 创建项目

**流程：**
1. 用户输入项目名称
2. 选择文件分类方式：
   - 按阶段分类（默认10个阶段）
   - 按内容分类（AI自动识别）
   - 智能分类（AI根据内容创建分类）
3. 可选：自定义阶段名称
4. 创建项目文件夹结构

**数据库：**
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_type TEXT NOT NULL DEFAULT 'stage',  -- stage/content/smart
    custom_stages TEXT,  -- JSON数组，自定义阶段
    current_stage TEXT DEFAULT '启动',
    ai_suggested_stage TEXT,  -- 预留：AI建议的阶段
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.1.2 项目阶段

**默认阶段（按阶段分类时）：**
1. 启动
2. 调研
3. 规划
4. 设计
5. 开发
6. 测试
7. 部署
8. 运维
9. 评估
10. 归档

**自定义阶段：**
- 用户可以修改阶段名称
- 用户可以增删阶段
- 阶段顺序可调整

**未来预留：AI判断阶段**
- 字段：`ai_suggested_stage`
- AI分析文件后判断项目所处阶段
- 触发更新提醒
- 用户确认后更新`current_stage`

---

### 3.2 文件管理

#### 3.2.1 文件上传

**流程：**
1. 用户拖拽或选择文件
2. 保存到项目文件夹对应位置
3. 根据分类方式自动分类：
   - 按阶段：移入对应阶段文件夹
   - 按内容/智能：AI分析后移入分类文件夹
4. 记录文件信息到数据库

**数据库：**
```sql
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_path TEXT,  -- 原始路径
    stored_path TEXT NOT NULL,  -- 存储路径
    category TEXT,  -- 分类结果
    stage TEXT,  -- 所属阶段
    file_type TEXT,  -- 文件类型
    file_size INTEGER,
    content_extracted TEXT,  -- 提取的文本内容
    is_analyzed BOOLEAN DEFAULT FALSE,  -- 是否已分析
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

#### 3.2.2 文件内容提取

**混合提取方案：**

| 文件类型 | 本地提取库 | 云端分析 | 设置项 |
|----------|------------|----------|--------|
| txt/md/json | 直接读取 | 智谱AI | 可选 |
| PDF文字版 | pdf-parse | 智谱AI | 可选 |
| PDF扫描版 | - | 智谱AI（必须） | 固定云端 |
| Word | mammoth | 智谱AI | 可选 |
| Excel | xlsx | 智谱AI | 可选 |
| 图片 | - | 智谱AI多模态（必须） | 固定云端 |

**设置页面配置项：**
```typescript
interface ExtractionConfig {
    txt: 'local' | 'cloud';
    pdf_text: 'local' | 'cloud';
    pdf_scanned: 'cloud';  // 固定
    word: 'local' | 'cloud';
    excel: 'local' | 'cloud';
    image: 'cloud';  // 固定
}
```

#### 3.2.3 AI文件分类

**按阶段分类：**
- AI判断文件属于哪个阶段
- 移动文件到对应阶段文件夹

**按内容分类：**
- AI根据文件内容自动创建分类
- 如：调研报告、设计文档、会议记录等
- 分类名称由AI决定

**智能分类：**
- AI综合分析所有文件
- 动态创建和调整分类
- 更灵活但需要更多AI调用

---

### 3.3 AI分析生成MD

#### 3.3.1 触发方式

- **手动触发：** 用户点击"生成/更新摘要"按钮
- **增量分析：** 只分析未处理的文件

#### 3.3.2 增量分析流程

```
1. 获取项目所有文件列表
2. 筛选出 is_analyzed = FALSE 的文件
3. 读取已有的 MD 文件内容（如果有）
4. 组合发送给AI：
   - 已有MD内容（作为上下文）
   - 未分析的新文件内容
5. AI返回更新后的完整MD
6. 保存MD文件，更新文件的 is_analyzed 状态
```

#### 3.3.3 MD文件结构

```
项目文件夹/
├── .ai/
│   ├── project-summary.md     # 汇总文件
│   │   ├── 项目概述
│   │   ├── 文件清单
│   │   ├── 当前进展
│   │   ├── 关键问题
│   │   └── 建议和风险
│   ├── issues/                # 问题清单子目录
│   │   ├── issue-001.md
│   │   └── issue-002.md
│   ├── files/                 # 文件分析子目录
│   │   └── analysis.md
│   └── progress/              # 进展子目录
│       └── progress.md
```

#### 3.3.4 MD内容模板

```markdown
# 项目摘要 - [项目名称]

## 项目概述
- 项目名称：
- 创建时间：
- 当前阶段：
- 文件数量：

## 文件清单
| 文件名 | 类型 | 大小 | 分析时间 |
|--------|------|------|----------|
| xxx.pdf | PDF | 1.2MB | 2026-06-06 |

## 当前进展
（AI根据文件内容总结的项目进展）

## 关键问题
1. [问题1描述]
2. [问题2描述]

## 建议和风险
- 建议：
- 风险：
```

---

### 3.4 AI对话

#### 3.4.1 上下文选择

用户可以自选哪些文件作为对话上下文：
- 项目MD摘要文件
- 原始文件（用户勾选）
- 历史对话

#### 3.4.2 对话流程

```
1. 用户选择上下文文件
2. 提取文件内容
3. 组合Prompt：
   - 系统提示（项目管理助手）
   - 上下文内容
   - 用户问题
4. 调用智谱AI API
5. 返回回答，保存对话历史
```

#### 3.4.3 数据库

```sql
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    context_files TEXT,  -- JSON数组，上下文文件ID
    messages TEXT NOT NULL,  -- JSON数组，对话历史
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

---

## 四、UI设计

### 4.1 页面结构

复用之前superpowers设计的UI：

```
├── 项目列表页
│   ├── 项目卡片（名称、阶段、时间）
│   ├── 新建项目按钮
│   └── 搜索/筛选
│
├── 项目首页
│   ├── 阶段导航（左侧）
│   ├── 摘要卡片区（上部）
│   ├── 文件拖拽区（下部）
│   └── 文件列表
│
├── 对话页
│   ├── 上下文选择区
│   ├── 对话窗口
│   └── 历史记录
│
└── 设置页
    ├── AI模型配置
    │   ├── 供应商选择（下拉框：智谱AI/小米MiMo/自定义）
    │   ├── 模型选择（下拉框：根据供应商动态显示）
    │   ├── API Key输入框
    │   └── API地址（默认填入，自定义时可修改）
    ├── 分类模型配置（可选，复用或独立配置）
    ├── 文件提取配置
    │   └── 各文件类型：本地提取/云端分析（下拉框）
    └── 存储路径配置
```

### 4.2 导航设计

**顶部导航栏：**
- 项目列表页：`[项目管理助手] [设置]`
- 项目内页面：`[项目管理助手] > [项目名称] > [文件/对话] [设置]`
- 设置页：`[项目管理助手] > [设置] [返回]`

### 4.3 左侧分类导航（动态）

左侧导航根据项目的 `category_type` 动态显示不同内容：

| 分类方式 | 左侧导航显示 | 说明 |
|----------|--------------|------|
| 按阶段分类 | 阶段列表（启动、调研、规划...） | 默认显示10个阶段，支持自定义 |
| 按内容分类 | AI生成的内容分类 | 如：调研报告、设计文档、会议记录等 |
| 智能分类 | AI动态创建的分类 | 根据文件内容自动创建和调整 |

**交互逻辑：**
- 当前选中的分类高亮
- 点击分类显示该分类下的文件
- 按阶段分类时：支持自定义阶段（拖拽排序、编辑名称）
- 按内容/智能分类时：显示AI创建的分类列表，用户可手动调整

**数据库支持：**
```sql
-- 文件表中的category字段存储分类名称
-- 按阶段分类时：category = '启动'/'调研'/...
-- 按内容/智能分类时：category = AI生成的分类名称
```

---

## 五、数据库设计

### 5.1 表结构

```sql
-- 项目表
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_type TEXT NOT NULL DEFAULT 'stage',
    custom_stages TEXT,  -- JSON
    current_stage TEXT DEFAULT '启动',
    ai_suggested_stage TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文件表
CREATE TABLE files (
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

-- 对话表
CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    context_files TEXT,  -- JSON
    messages TEXT NOT NULL,  -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 配置表
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 AI模型配置

支持多供应商模型，用户可自定义配置：

```typescript
interface ModelConfig {
    provider: 'zhipu' | 'mimo' | 'custom';  // 供应商
    model: string;  // 模型名称
    apiKey: string;  // API Key
    baseUrl: string;  // API地址
}
```

**支持的供应商：**

| 供应商 | 模型 | API地址 | 优先级 |
|--------|------|---------|--------|
| 智谱AI | glm-4-flash | https://open.bigmodel.cn/api/paas/v4/chat/completions | P0（优先） |
| 智谱AI | glm-4.7-flash | 同上 | P0 |
| 小米MiMo | mimo-v2.5 | （接入API）待确认 | P0（优先） |
| 小米MiMo | mimo-v2.5 | （token plan）待确认 | P0 |
| 自定义 | 用户填写 | 用户填写 | P1（后续） |

**小米MiMo接入方式：**
- **接入API方式：** URL待确认（用户后续提供）
- **Token Plan方式：** URL待确认（用户后续提供）

> 注：MiMo的两种接入方式URL不同，实现时需要用户确认具体地址。

**设置页面配置项：**
```typescript
interface AIConfig {
    provider: 'zhipu' | 'mimo' | 'custom';
    model: string;
    apiKey: string;
    baseUrl: string;
    // 分类专用（可选使用不同模型）
    classifyProvider?: 'zhipu' | 'mimo' | 'custom';
    classifyModel?: string;
    classifyApiKey?: string;
    classifyBaseUrl?: string;
}
```

### 5.3 默认配置

```sql
INSERT INTO settings (key, value) VALUES
-- AI模型配置
('ai_provider', 'zhipu'),
('ai_model', 'glm-4-flash'),
('ai_api_key', ''),
('ai_base_url', 'https://open.bigmodel.cn/api/paas/v4/chat/completions'),
-- 分类模型配置（可选，默认使用主模型）
('classify_provider', ''),
('classify_model', ''),
('classify_api_key', ''),
('classify_base_url', ''),
-- 分类提示词
('classify_prompt', '请分析这个文件的内容，将其分类到最合适的类别...'),
-- 文件提取配置
('extraction_txt', 'local'),
('extraction_pdf_text', 'local'),
('extraction_pdf_scanned', 'cloud'),
('extraction_word', 'local'),
('extraction_excel', 'local'),
('extraction_image', 'cloud');
```

---

## 六、API设计

### 6.1 主进程API

```typescript
// 项目相关
ipcMain.handle('project:create', createProject)
ipcMain.handle('project:list', listProjects)
ipcMain.handle('project:get', getProject)
ipcMain.handle('project:update', updateProject)
ipcMain.handle('project:delete', deleteProject)

// 文件相关
ipcMain.handle('file:upload', uploadFile)
ipcMain.handle('file:list', listFiles)
ipcMain.handle('file:delete', deleteFile)
ipcMain.handle('file:extract', extractContent)

// AI相关
ipcMain.handle('ai:classify', classifyFile)
ipcMain.handle('ai:analyze', analyzeProject)
ipcMain.handle('ai:chat', chatWithAI)

// 设置相关
ipcMain.handle('settings:get', getSettings)
ipcMain.handle('settings:update', updateSettings)
```

### 6.2 预加载脚本

```typescript
// preload.ts
contextBridge.exposeInMainWorld('api', {
    project: {
        create: (data) => ipcRenderer.invoke('project:create', data),
        list: () => ipcRenderer.invoke('project:list'),
        get: (id) => ipcRenderer.invoke('project:get', id),
        update: (id, data) => ipcRenderer.invoke('project:update', id, data),
        delete: (id) => ipcRenderer.invoke('project:delete', id),
    },
    file: {
        upload: (projectId, file) => ipcRenderer.invoke('file:upload', projectId, file),
        list: (projectId) => ipcRenderer.invoke('file:list', projectId),
        delete: (id) => ipcRenderer.invoke('file:delete', id),
        extract: (id) => ipcRenderer.invoke('file:extract', id),
    },
    ai: {
        classify: (fileId) => ipcRenderer.invoke('ai:classify', fileId),
        analyze: (projectId) => ipcRenderer.invoke('ai:analyze', projectId),
        chat: (projectId, message, contextFiles) => ipcRenderer.invoke('ai:chat', projectId, message, contextFiles),
    },
    settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        update: (data) => ipcRenderer.invoke('settings:update', data),
    },
});
```

---

## 七、错误处理设计

### 7.1 分级处理

| 错误级别 | 类型 | 处理方式 |
|----------|------|----------|
| 网络错误 | API调用超时/断网 | 自动重试3次，失败后提示 |
| API错误 | Key无效/配额用尽 | 提示用户检查配置 |
| 文件错误 | 读写失败/格式错误 | 提示用户，记录日志 |
| 严重错误 | 数据库损坏/崩溃 | 记录日志，提示用户重启 |

### 7.2 重试机制

```typescript
async function retryRequest(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await delay(1000 * (i + 1)); // 递增延迟
        }
    }
}
```

---

## 八、打包分发

### 8.1 打包配置

使用electron-builder打包为exe安装包：

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

### 8.2 打包命令

```bash
# 构建前端
npm run build

# 打包Electron
npm run electron:build
```

---

## 九、开发计划

### 9.1 阶段划分

| 阶段 | 内容 | 预估时间 |
|------|------|----------|
| 阶段1 | 项目初始化 + 基础架构 | 2小时 |
| 阶段2 | 数据库 + 项目管理 | 3小时 |
| 阶段3 | 文件管理 + 内容提取 | 4小时 |
| 阶段4 | AI功能（分类/分析/对话） | 4小时 |
| 阶段5 | UI完善 + 设置页面 | 3小时 |
| 阶段6 | 测试 + 打包 | 2小时 |

**总计：** 约18小时

### 9.2 优先级

1. **P0：** 项目管理、文件上传、基础AI对话
2. **P1：** AI分类、AI分析生成MD、增量分析
3. **P2：** 自定义阶段、未来AI判断阶段预留

---

## 十、设计决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 框架 | Electron | Tauri开发效率低 |
| 技术栈 | React + TypeScript | 复用经验，成熟稳定 |
| 数据库 | SQLite | 性能好，有经验 |
| AI触发 | 手动+增量 | 节省API调用 |
| 文件夹结构 | 用户选择分类方式 | 增强适配性 |
| 左侧导航 | 动态显示分类 | 根据项目分类方式变化 |
| AI模型 | 多供应商自定义 | 用户可选择智谱/MiMo/自定义 |
| MD结构 | 单文件+子目录 | 汇总+详情兼顾 |
| 错误处理 | 分级处理 | 用户体验好 |
| 打包 | exe安装包 | 正式，易分发 |

---

**文档版本：** 1.0
**创建时间：** 2026-06-06
**作者：** Claude Code
