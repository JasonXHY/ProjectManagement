# PMAer — 项目管理助手

> 版本：v0.2.0 | 更新时间：2026-06-22 | 状态：活跃开发中

轻量级 AI 项目管理桌面应用（Windows）

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| UI 组件库 | Ant Design 6 |
| 样式方案 | Tailwind CSS 4 |
| 桌面框架 | Electron 42 |
| 数据库 | SQLite (sql.js) |
| AI 服务 | OpenAI 兼容协议（小米MiMo、智谱、阿里千问等11家） |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npx vitest run

# TypeScript类型检查
npx tsc --noEmit

# 构建生产版本
npm run build
```

## 项目结构

```
PMAer/
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
│   │   ├── Settings/           # 设置页组件
│   │   ├── Handover/           # [NEW] 项目转交组件
│   │   └── MarkdownPreview/    # [NEW] Markdown预览组件
│   ├── services/               # 服务层
│   ├── types/                  # TypeScript 类型定义
│   └── styles/                 # 样式文件
│
├── electron/                    # Electron 主进程
│   ├── services/               # 后端服务
│   │   ├── ai-providers/       # AI 服务提供商
│   │   └── handover-service.ts # [NEW] 转交服务
│   ├── ipc/                    # IPC 处理器
│   ├── database/               # 数据库操作
│   ├── shared/                 # 共享模块
│   └── utils/                  # 工具函数
│
├── .qoderwork/                  # QoderWork 工作区（需求+设计）
├── .archive/                    # 归档目录
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

## 页面功能

| 页面 | 功能 |
|------|------|
| 项目列表页 | 显示所有项目，支持卡片/表格视图，导入转交 |
| 项目详情页 | 统计行 + 特色卡片 + 文件分类 + 文件列表 |
| AI 对话页 | 与 AI 助手对话，支持文件上下文 |
| 设置页 | 配置 AI 模型、文件提取、Prompt |

## 设计系统

本项目使用三层样式架构：

1. **Ant Design ConfigProvider（主题层）**：颜色、圆角、字号、间距等主题 Token
2. **Tailwind CSS（布局层）**：flex、grid、padding、margin、width、height
3. **CSS 覆盖文件（细节层）**：ConfigProvider 无法覆盖的样式

设计规范详见 `docs/design/design-tokens.md`

## Agent 协作

| Agent | 职责 | 工作区 |
|-------|------|--------|
| MiMoCode | 代码实现、审核、技术实施 | `.mimo-code/` |
| QoderWork | 需求分析、方案设计、UI设计 | `.qoderwork/` |

协作流程：`QoderWork设计方案 → MiMoCode审核 → 用户确认 → MiMoCode实施`

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1.0 | 2026-06-15 | 内测版：183测试 + NSIS安装包 |
| v0.1.2 | 2026-06-18 | 首版发版：Bug修复 + 用户操作手册 |
| v0.2.0 | 2026-06-22 | 体验深化：卡片系统 + 项目转交 + Markdown预览 |

## 文档

详见 [文档索引](docs/README.md)

## 许可证

私有项目
