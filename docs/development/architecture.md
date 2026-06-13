# 项目管理助手 — 架构概览

> 版本：1.0
> 日期：2026-06-14
> 状态：正式发布

---

## 一、系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Electron 主进程                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │  IPC Handlers                                       ││
│  │  - project-handlers.ts                              ││
│  │  - file-handlers.ts                                 ││
│  │  - settings-handlers.ts                             ││
│  │  - chat-handlers.ts                                 ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │  Services                                           ││
│  │  - AI Provider Service (多厂商支持)                  ││
│  │  - File Extractor (文件内容提取)                     ││
│  │  - Database Service (SQLite)                        ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                          │
                          │ IPC
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Renderer 进程                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │  React App                                          ││
│  │  - Pages: ProjectList, ProjectHome, Chat, Settings  ││
│  │  - Components: 复用UI组件                           ││
│  │  - Services: API调用层                              ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 桌面框架 | Electron | 42 | 跨平台桌面应用 |
| 前端框架 | React | 19 | UI渲染 |
| 类型系统 | TypeScript | 5.x | 类型安全 |
| UI组件库 | Ant Design | 6 | 企业级UI组件 |
| 样式方案 | Tailwind CSS | 4 | 原子化CSS |
| 数据库 | SQLite (sql.js) | - | 本地数据存储 |
| AI服务 | OpenAI兼容协议 | - | 多厂商AI接入 |

---

## 二、目录结构

```
C:\NewProject\
├── src/                         # React 前端
│   ├── components/              # React 组件
│   │   ├── Chat/               # AI 对话组件
│   │   ├── ProjectHome/        # 项目详情页组件
│   │   │   ├── StageSidebar.tsx      # 文件分类阶段侧边栏
│   │   │   ├── FileList.tsx          # 文件列表
│   │   │   ├── ProjectStats.tsx      # 统计卡片
│   │   │   ├── KeyInfoCard.tsx       # 关键信息卡片
│   │   │   └── Timeline.tsx          # 时间线
│   │   ├── ProjectList/        # 项目列表组件
│   │   └── Settings/           # 设置页组件
│   ├── pages/                  # 页面组件
│   ├── services/               # 服务层
│   ├── types/                  # TypeScript 类型定义
│   │   └── index.ts            # 包含DEFAULT_STAGES等常量
│   └── styles/                 # 样式文件
│
├── electron/                    # Electron 主进程
│   ├── main.ts                 # 主进程入口
│   ├── preload.ts              # 预加载脚本
│   ├── ipc/                    # IPC处理器
│   │   ├── project-handlers.ts
│   │   ├── file-handlers.ts
│   │   ├── settings-handlers.ts
│   │   └── chat-handlers.ts
│   ├── services/               # 后端服务
│   │   ├── ai-providers/       # AI 服务提供商
│   │   ├── file-extractor.ts   # 文件内容提取
│   │   └── database.ts         # 数据库操作
│   └── database/               # 数据库schema
│
├── docs/                        # 项目文档
│   ├── requirements/           # 需求文档
│   ├── design/                 # 设计文档
│   └── development/            # 开发文档
│
├── .mimo-code/                  # MiMoCode 工作区
├── .qoderwork/                  # QoderWork 工作区
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.yml
```

---

## 三、核心数据模型

### 3.1 项目（Project）

```typescript
interface Project {
  id: string
  name: string
  path: string                    // 项目文件夹路径
  classificationType: 'stage' | 'content'  // 分类方式
  currentStage: string            // 项目阶段：售前/进行中/关闭
  createdAt: number
  updatedAt: number
}
```

### 3.2 文件记录（FileRecord）

```typescript
interface FileRecord {
  id: string
  projectId: string
  name: string
  path: string                    // 文件完整路径
  type: string                    // 文件类型
  size: number                    // 文件大小
  category: string | null         // 文件分类阶段（11个之一）
  isAnalyzed: boolean             // 是否已AI分析
  hasSignature: boolean | null    // 是否含签字
  extractedContent: string | null // 提取的文本内容
  createdAt: number
  updatedAt: number
}
```

### 3.3 阶段定义

```typescript
// 项目阶段（3个）- 固定不可自定义
const PROJECT_STAGES = ['售前', '进行中', '关闭']

// 文件分类阶段（11个）- 可自定义
const DEFAULT_CLASSIFICATION_STAGES = [
  '售前', '启动', '需求', '方案', '构建', 
  '测试', '上线', '验收', '转客户成功', '关闭', '未分类'
]
```

---

## 四、IPC通信协议

### 4.1 项目相关

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `project:create` | `{name, path, classificationType}` | `Project` | 创建项目 |
| `project:list` | - | `Project[]` | 获取项目列表 |
| `project:update` | `{id, updates}` | `Project` | 更新项目 |
| `project:delete` | `{id}` | `void` | 删除项目 |

### 4.2 文件相关

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `file:upload` | `{projectId, file}` | `FileRecord` | 上传文件 |
| `file:list` | `{projectId}` | `FileRecord[]` | 获取文件列表 |
| `file:classify` | `{fileId}` | `FileRecord` | AI分类单个文件 |
| `file:classifyAll` | `{projectId}` | `void` | 一键分类所有未分类文件 |
| `file:updateCategory` | `{fileId, category}` | `FileRecord` | 手动修改文件分类阶段 |
| `file:delete` | `{fileId}` | `void` | 删除文件 |

### 4.3 AI对话相关

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `chat:send` | `{projectId, message, fileIds}` | `string` | 发送消息 |
| `chat:history` | `{projectId, sessionId}` | `Message[]` | 获取对话历史 |

---

## 五、AI服务架构

### 5.1 多厂商支持

```
┌─────────────────────────────────────────────────────────┐
│                AI Provider Service                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Provider Registry                                  ││
│  │  - 小米 MiMo                                        ││
│  │  - 智谱 AI                                          ││
│  │  - 阿里千问                                         ││
│  │  - 腾讯                                             ││
│  │  - 百度                                             ││
│  │  - DeepSeek                                         ││
│  │  - 月之暗面                                         ││
│  │  - 零一万物                                         ││
│  │  - 讯飞                                             ││
│  │  - 百川                                             ││
│  │  - MiniMax                                          ││
│  │  - 自定义（OpenAI兼容）                             ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 5.2 AI功能

1. **文件分类**：判断文件属于哪个文件分类阶段
2. **内容提取**：提取关键信息（项目编号、合同号等）
3. **签字检测**：判断PDF/图片是否含手写签字
4. **项目摘要**：生成项目整体摘要
5. **智能问答**：基于文件上下文回答用户问题

---

## 六、安全机制

### 6.1 API Key安全

- 使用Electron safeStorage加密存储
- 界面显示掩码（sk-***）
- 重启后仍有效

### 6.2 文件安全

- 50MB大小限制（前端+后端双重校验）
- 路径安全校验（防止路径遍历）
- CSP策略限制

### 6.3 数据安全

- SQLite数据库本地存储
- 并发写保护（Promise队列）
- 删除时级联清理

---

## 七、版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2026-06-14 | 初始版本 |
