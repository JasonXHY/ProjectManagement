# 项目文档

> 版本：v3.0.0
> 更新时间：2026-06-14

## 文档结构

```
docs/
├── requirements/                    # 需求文档
│   └── business-requirements.md     # 业务需求规格说明书 v3.0
│
├── design/                          # 设计文档
│   ├── design-tokens.md             # 设计规范（颜色、字体、间距）
│   └── ui-design-spec.md            # UI设计规范（布局、组件、交互）
│
├── development/                     # 开发文档
│   ├── architecture.md              # 架构概览
│   ├── technical-decisions.md       # 技术决策记录
│   ├── development-guide.md         # 开发指南
│   ├── optimization-roadmap.md      # 优化路线图
│   ├── tech-selection.md            # 技术选型
│   ├── round1-plan.md               # 第一轮优化方案
│   ├── round2-plan.md               # 第二轮优化方案
│   ├── quick-launch-solution.md     # 快速启动方案
│   ├── test-guide.md                # 测试指南
│   └── verification-plan.md         # 验证计划
│
└── README.md                        # 本文档
```

## 核心文档说明

### 需求文档

- `business-requirements.md` - **业务需求规格说明书 v3.0**
  - 清晰区分「项目阶段」（3个）和「文件分类阶段」（11个）
  - 完整的功能需求描述
  - 术语表和验收标准

### 设计文档

- `design-tokens.md` - 设计规范，包含颜色、字体、间距等 Token 定义
- `ui-design-spec.md` - UI设计规范，包含页面布局、组件规范、交互规范

### 开发文档

- `architecture.md` - 系统架构概览，技术栈、目录结构、数据模型
- `technical-decisions.md` - 技术决策记录，37项决策的背景和选择
- `development-guide.md` - 开发指南，环境配置、编码规范、Git工作流

## 快速导航

| 我想... | 查看文档 |
|---------|----------|
| 了解项目阶段和文件分类阶段的区别 | `requirements/business-requirements.md` §一 |
| 查看设计规范和颜色定义 | `design/design-tokens.md` |
| 了解系统架构 | `development/architecture.md` |
| 查看技术决策 | `development/technical-decisions.md` |
| 开始开发 | `development/development-guide.md` |

## 版本历史

```
v1.0.0 - 初始版本（2026-06-03）
v1.1.0 - 第一轮优化完成（2026-06-10）
v1.2.0 - 第二轮优化完成（2026-06-11）
v2.0.0 - 文件架构整理（2026-06-11）
v3.0.0 - 文档重写，清晰区分阶段体系（2026-06-14）
```
