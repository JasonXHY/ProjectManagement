# 技术架构

> 最后更新：2026-06-30

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
│   │   ├── FeatureCards/          # 9个卡片组件
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
│   ├── services/                  # AI服务、文件提取、签字检测
│   ├── prompts/                   # Prompt模板
│   └── utils/                     # 工具函数（含metadata-queue）
├── docs/                          # 项目文档（编号目录结构）
│   ├── 00-INDEX.md                # 文档索引
│   ├── 01-specs/                  # 需求规格
│   ├── 02-plans/                  # 实施方案
│   ├── 03-reports/                # 复盘报告
│   ├── 04-guides/                 # 开发指南
│   ├── 05-issues/                 # 问题记录
│   ├── 06-archive/                # 历史归档
│   ├── 99-mockups/                # UI原型
│   └── screenshots/               # 截图
├── .mimocode/                     # 项目记忆（本目录）
└── .qoderwork/                    # Qoder设计文件
```

---

## 两套阶段体系（重要）

- **项目阶段**（DEFAULT_STAGES）：`electron/shared/stages.ts`
  - 3个阶段：售前 → 进行中 → 关闭
  - 用于项目状态管理

- **文件分类阶段**（STAGE_DEFINITIONS）：`electron/shared/stages.ts`
  - 10个阶段：售前、启动、需求、方案、构建、测试、上线、验收、转客户成功、关闭
  - 每个阶段含子分类（3-7个），按文档用途区分
  - 用于文件归类

- **两者关系**：独立运作。AI分类时需同时判断：(1)文件属于哪个分类阶段，(2)该分类阶段是否触发项目阶段推进

---

## 关键技术决策

| 编号 | 决策 | 理由 |
|------|------|------|
| C1 | 阶段推进由AI分类时大模型判断 | 比关键词匹配更准确 |
| C2 | 对话按项目隔离，不跨项目 | 用户需求明确 |
| C3 | 进度卡片显示状态而非百分比 | 更直观 |
| C4 | Prompt支持用户自定义 | 灵活性需求 |
| C5 | 签字检测用OffscreenCanvas | 避免隐藏窗口安全风险 |
| C6 | 数据库写入用metadata-queue | 防止5个handler并发覆盖 |
| D47 | 移除AI内容截断 | 上下文窗口≥128K，截断影响准确性 |
| D52 | UUID文件夹标识 | 解决切换存储路径后路径断裂 |

---

## 数据库Schema

```sql
projects (id, name, category_type, custom_stages, current_stage, ai_suggested_stage,
          metadata, milestones, folder_uuid, created_at, updated_at)

files (id, project_id, filename, original_path, stored_path, category, stage,
       subcategory, file_type, file_size, content_extracted, is_analyzed,
       signature_status, ai_summary, ai_key_info, created_at)

chat_messages (id, project_id, session_id, role, content, token_count, created_at)

settings (id, key, value, updated_at)
```

索引：`idx_chat_project_session`、`idx_files_project`、`idx_files_category`
外键：`files.project_id → projects.id`、`chat_messages.project_id → projects.id`
