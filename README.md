# 项目管理助手

> 版本：v2.0.0
> 更新时间：2026-06-11
> 状态：活跃开发中

轻量级 AI 项目管理桌面应用（Windows）

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| UI 组件库 | Ant Design 6 |
| 样式方案 | Tailwind CSS 4 |
| 桌面框架 | Electron 42 |
| 数据库 | SQLite (sql.js) |
| AI 服务 | OpenAI 兼容协议（智谱AI、小米 MiMo） |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 快速启动（跳过依赖检查）
start-dev-quick.bat

# 构建生产版本
npm run build
```

## 项目结构

```
C:\NewProject\
├── .archive/                    # 归档目录（只读，历史记录）
├── .mimo-code/                  # MiMoCode 工作区（代码实现）
├── .qoderwork/                  # QoderWork 工作区（需求+设计）
├── .claude-code/                # Claude Code 工作区（预留）
│
├── docs/                        # 项目文档
│   ├── requirements/            # 需求文档
│   ├── design/                  # 设计文档
│   └── development/             # 开发文档
│
├── src/                         # React 前端
│   ├── components/              # React 组件
│   │   ├── Chat/               # AI 对话组件
│   │   ├── ProjectHome/        # 项目详情页组件
│   │   ├── ProjectList/        # 项目列表组件
│   │   └── Settings/           # 设置页组件
│   ├── pages/                  # 页面组件
│   ├── services/               # 服务层
│   ├── types/                  # TypeScript 类型定义
│   └── styles/                 # 样式文件
│
├── electron/                    # Electron 主进程
│   └── services/               # 后端服务
│       └── ai-providers/       # AI 服务提供商
│
├── public/                      # 静态资源
├── dist/                        # 构建输出
│
├── package.json                 # 依赖配置
├── tsconfig.json                # TypeScript 配置
├── vite.config.ts               # Vite 配置
├── vitest.config.ts             # 测试配置
├── eslint.config.js             # ESLint 配置
├── tailwind.config.ts           # Tailwind 配置
└── README.md                    # 本文件
```

## 页面功能

| 页面 | 功能 |
|------|------|
| 项目列表页 | 显示所有项目，支持卡片/表格视图切换 |
| 项目详情页 | 项目阶段导航、摘要卡片、文件列表 |
| AI 对话页 | 与 AI 助手对话，支持文件上下文 |
| 设置页 | 配置 AI 模型、文件提取、Prompt |

## 设计系统

本项目使用三层样式架构：

1. **Ant Design ConfigProvider（主题层）**：负责所有 AntD 组件的颜色、圆角、字号、间距等主题 Token
2. **Tailwind CSS（布局层）**：仅用于布局相关：flex、grid、padding、margin、width、height
3. **CSS 覆盖文件（细节层）**：处理 ConfigProvider 无法覆盖的样式

设计规范详见 `docs/design/design-tokens.md`

## Agent 协作

本项目采用多 Agent 协作模式：

| Agent | 职责 | 工作区 |
|-------|------|--------|
| MiMoCode | 代码实现、审核、技术实施 | `.mimo-code/` |
| QoderWork | 需求分析、方案设计、UI设计 | `.qoderwork/` |
| Claude Code | 预留 | `.claude-code/` |

协作流程：`QoderWork设计方案 → MiMoCode审核 → 用户确认 → MiMoCode实施`

## 文档

详见 [文档索引](docs/README.md)

## 许可证

私有项目
