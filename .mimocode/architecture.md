# 技术架构

> 最后更新：2026-06-13

---

## 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 桌面框架 | Electron | 42.3.3 |
| 前端框架 | React | 19.1.0 |
| 语言 | TypeScript | 5.8.3 |
| UI库 | Ant Design | 6.4.3 |
| CSS | Tailwind CSS | 4.3.0 |
| 构建 | Vite | 7.0.4 |
| 数据库 | sql.js（SQLite） | 1.14.1 |
| AI协议 | OpenAI兼容 | — |

---

## 三层样式架构

```
1. AntD ConfigProvider（主题tokens）
   ↓
2. Tailwind CSS（布局类，preflight:false避免冲突）
   ↓
3. overrides.css（细节样式覆盖）
```

---

## 目录结构

```
C:\NewProject\
├── src/                           # React前端
│   ├── App.tsx                    # 根组件
│   ├── main.tsx                   # 入口
│   ├── components/
│   │   ├── Chat/ChatWindow.tsx    # AI对话
│   │   ├── ProjectHome/           # 项目首页（10个子组件）
│   │   ├── ProjectList/           # 项目列表
│   │   ├── Settings/SettingsPage.tsx
│   │   └── common/
│   ├── services/                  # 前端服务层
│   ├── shared/model-registry.ts   # AI厂商注册表
│   ├── types/                     # 类型定义
│   └── utils/                     # 工具函数
├── electron/                      # Electron主进程
│   ├── main.ts                    # 入口
│   ├── preload.ts                 # IPC桥接
│   ├── database/                  # 数据库CRUD
│   ├── ipc/                       # IPC处理器
│   ├── services/                  # AI服务、文件提取
│   ├── prompts/                   # Prompt模板
│   └── utils/                     # 工具函数
├── docs/                          # 项目文档
├── .qoderwork/                    # QoderWork设计文件
├── .mimocode/                     # 项目记忆（本目录）
└── .archive/                      # 归档文件
```

---

## 关键文件位置

### 配置文件
- `package.json` — 依赖配置
- `tsconfig.json` — 前端TS配置
- `electron/tsconfig.json` — Electron TS配置
- `vite.config.ts` — Vite配置
- `vitest.config.ts` — 测试配置
- `index.html` — Vite入口
- `.gitignore`

### 数据库
- 数据库文件：`{userData}/projects.db`
- 项目文件夹：`{userData}/projects/{name}_{id}/`
- AI元数据：`.ai/project-summary.md`、`.ai/project-info.md`

### 设计规范
- `.qoderwork/design-system/v1-design-tokens.md` — 完整设计规范（543行）

### 评审材料
- `C:\Users\kingdee\Desktop\project-manager-requirements\01-业务需求规格说明书-v2.md`
- `C:\Users\kingdee\Desktop\project-manager-requirements\02-评审指南-v2.md`
- `C:\Users\kingdee\Desktop\project-manager-review-v2.zip`

---

## 关键技术决策

| 编号 | 决策 | 理由 |
|------|------|------|
| C1 | 阶段推进由AI分类时大模型判断 | 比关键词匹配更准确 |
| C2 | 对话按项目隔离，不跨项目 | 用户需求明确 |
| C3 | 进度卡片显示状态而非百分比 | 更直观 |
| C4 | Prompt支持用户自定义 | 灵活性需求 |
| C5 | 签字检测用OffscreenCanvas | 避免隐藏窗口安全风险 |
| C6 | 数据库写入用Promise队列 | 防止并发交错 |

---

## 数据库Schema

```sql
projects (id, name, category_type, custom_stages, current_stage, ai_suggested_stage, metadata, milestones, created_at, updated_at)

files (id, project_id, filename, original_path, stored_path, category, stage, file_type, file_size, content_extracted, is_analyzed, has_signature, created_at)

chat_messages (id, project_id, session_id, role, content, token_count, created_at)

settings (id, key, value, updated_at)
```

索引：`idx_chat_project_session`、`idx_files_project`、`idx_files_category`
外键：`files.project_id → projects.id`、`chat_messages.project_id → projects.id`
