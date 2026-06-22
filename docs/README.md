# 项目文档索引

> 版本：v4.0.0 | 更新时间：2026-06-22

---

## 文档结构

```
docs/
├── README.md                            # 本文档（文档索引）
│
├── requirements/                        # 需求文档
│   ├── business-requirements.md         # 业务需求规格说明书 v3.0
│   └── v0.2.0-requirements.md           # [NEW] v0.2.0 需求文档
│
├── design/                              # 设计文档
│   ├── design-tokens.md                 # 设计规范（颜色、字体、间距 Token）
│   ├── ui-design-spec.md               # UI设计规范 v1.1（布局、组件、交互）
│   └── card-system-v3.html              # [NEW] 卡片系统 Mockup v3
│
├── development/                         # 开发文档
│   ├── architecture.md                  # 架构概览
│   ├── technical-decisions.md           # 技术决策记录（52项）
│   ├── development-guide.md             # 开发指南
│   ├── v0.2.0-design.md                 # [NEW] v0.2.0 设计文档
│   ├── v0.2.0-dev-guide.md              # [NEW] v0.2.0 开发指南
│   ├── optimization-roadmap.md          # 优化路线图
│   ├── test-guide.md                    # 测试指南
│   └── style-migration-test-plan.md     # 样式迁移测试计划
│
├── v0.2.0-plan-final.md                 # [NEW] v0.2.0 版本规划终稿（Qoder审核）
│
├── bugfix-investigation-2026-06-18.md   # Bug排查文档
├── bugfix-proposal-2026-06-17.md        # Bug修复方案
├── user-manual-PMAer.md                 # 用户操作手册
├── model-registry-update.md             # 模型注册表更新记录
├── beta-version-notes.md                # Beta版本说明
└── crash-investigation-2026-06-17.md    # 崩溃排查文档
```

---

## 按版本导航

### v0.2.0（当前开发版本）

| 文档 | 说明 | 适合场景 |
|------|------|----------|
| [v0.2.0-plan-final.md](v0.2.0-plan-final.md) | 版本规划终稿 | 了解v0.2.0整体规划 |
| [v0.2.0-design.md](development/v0.2.0-design.md) | 设计文档 | 了解技术架构、组件设计、IPC通道 |
| [v0.2.0-dev-guide.md](development/v0.2.0-dev-guide.md) | 开发指南 | 开始编码前阅读，含代码示例 |
| [v0.2.0-requirements.md](requirements/v0.2.0-requirements.md) | 需求文档 | 了解功能需求和验收标准 |
| [ui-design-spec.md](design/ui-design-spec.md) v1.1 | UI设计规范 | 了解卡片系统、样式规范 |
| [card-system-v3.html](.qoderwork/mockups/04-card-system-v020.html) | 卡片系统Mockup | 可视化参考 |

### v0.1.x（已完成版本）

| 文档 | 说明 |
|------|------|
| [business-requirements.md](requirements/business-requirements.md) | 业务需求 v3.0 |
| [architecture.md](development/architecture.md) | 系统架构 |
| [technical-decisions.md](development/technical-decisions.md) | 技术决策（52项） |
| [development-guide.md](development/development-guide.md) | 开发指南 |
| [user-manual-PMAer.md](用户操作手册-PMAer.md) | 用户操作手册 |

---

## 快速导航

### 我想了解...

| 主题 | 查看文档 |
|------|----------|
| 项目整体规划 | `v0.2.0-plan-final.md` |
| 系统架构 | `development/architecture.md` |
| 技术决策 | `development/technical-decisions.md` |
| 设计规范 | `design/design-tokens.md` |
| UI布局规范 | `design/ui-design-spec.md` |
| 开发环境配置 | `development/development-guide.md` |

### 我想开发...

| 任务 | 查看文档 |
|------|----------|
| 详情页卡片系统 | `development/v0.2.0-dev-guide.md` §二 |
| Markdown预览 | `development/v0.2.0-dev-guide.md` §三 |
| 项目转交功能 | `development/v0.2.0-dev-guide.md` §四 |
| 新组件开发 | `design/ui-design-spec.md` §三 |
| 样式开发 | `design/design-tokens.md` |

### 我想了解需求...

| 功能 | 查看文档 |
|------|----------|
| 卡片系统需求 | `requirements/v0.2.0-requirements.md` FR-001~FR-006 |
| 转交功能需求 | `requirements/v0.2.0-requirements.md` FR-007~FR-009 |
| Markdown预览需求 | `requirements/v0.2.0-requirements.md` FR-010 |
| 验收标准 | `requirements/v0.2.0-requirements.md` §五 |

---

## 核心文档说明

### 需求文档

- **`business-requirements.md`** — 业务需求规格说明书 v3.0
  - 清晰区分「项目阶段」（3个）和「文件分类阶段」（10个）
  - 完整的功能需求描述
  - 术语表和验收标准

- **`v0.2.0-requirements.md`** — v0.2.0 需求文档
  - 10个功能需求（FR-001~FR-010）
  - 4个非功能需求
  - 详细验收标准

### 设计文档

- **`design-tokens.md`** — 设计规范
  - 颜色、字体、间距 Token 定义
  - 组件样式规范

- **`ui-design-spec.md`** — UI设计规范 v1.1
  - 页面布局规范
  - 组件规范（含v0.2.0特色卡片）
  - 交互规范
  - 响应式断点

### 开发文档

- **`architecture.md`** — 系统架构
  - 技术栈、目录结构、数据模型
  - IPC通信机制

- **`technical-decisions.md`** — 技术决策
  - 52项决策的背景和选择

- **`development-guide.md`** — 开发指南
  - 环境配置、编码规范、Git工作流

- **`v0.2.0-design.md`** — v0.2.0 设计文档
  - 系统架构图
  - 卡片系统设计
  - 转交功能设计
  - Markdown预览设计
  - 组件文件结构
  - IPC通道设计

- **`v0.2.0-dev-guide.md`** — v0.2.0 开发指南
  - 4个Phase实现指南
  - 组件代码示例
  - 测试策略
  - 部署检查清单

---

## 版本历史

```
v4.0.0 - 文档索引更新，新增v0.2.0文档集（2026-06-22）
v3.0.0 - 文档重写，清晰区分阶段体系（2026-06-14）
v2.0.0 - 文件架构整理（2026-06-11）
v1.2.0 - 第二轮优化完成（2026-06-11）
v1.1.0 - 第一轮优化完成（2026-06-10）
v1.0.0 - 初始版本（2026-06-03）
```
