# 项目记忆索引

> 最后更新：2026-06-30
> 位置：`C:\NewProject\.mimocode/`

---

## 快速导航

| 文件 | 内容 | 何时读取 |
|------|------|---------|
| **[INDEX.md](INDEX.md)** | 本文件 — 项目全景索引 | 每次会话开始 |
| **[progress.md](progress.md)** | 开发进度（v0.1→v0.2.0） | 了解当前状态 |
| **[architecture.md](architecture.md)** | 技术架构、文件位置、关键决策 | 修改代码前 |
| **[requirements.md](requirements.md)** | 需求清单、v0.3 待办 | 规划任务时 |
| **[technical.md](technical.md)** | 技术发现、踩坑记录 | 遇到技术问题时 |
| **[rules.md](rules.md)** | 项目规则、编码约定、协作模式 | 编写代码时 |

---

## 项目概览

- **项目名称**：PMAer（Project Management Assistant）
- **技术栈**：React 19 + TypeScript + Electron 42 + Ant Design 6 + sql.js
- **AI提供商**：11家厂商（OpenAI兼容协议）
- **项目定位**：轻量级AI驱动的项目管理桌面应用（Windows）
- **当前版本**：v0.2.0（已发布）
- **测试数**：427（2预存问题）
- **GitHub**：https://github.com/JasonXHY/ProjectManagement

## 当前状态

- **v0.2.0 已发布** ✅ — commit a6f3dc8
- **v0.3.0 规划完成** 📋 — `docs/02-plans/2026-06-30-plan-v0.3-planning.md`
- **安装包**：`C:\temp\pmaer-build\PMAer-0.2.0-Setup.exe`（166.8MB）
- **用户手册**：MD + Word 双版本，24 张截图

## 文档结构

```
docs/
├── 00-INDEX.md           # 文档索引（Agent 入口）
├── 01-specs/    (25)     # 需求规格
├── 02-plans/    (20)     # 实施方案
├── 03-reports/  (10)     # 复盘报告
├── 04-guides/   (10)     # 开发指南 + 用户手册
├── 05-issues/   (2)      # 问题记录
├── 06-archive/  (18)     # 历史归档
├── 99-mockups/  (3)      # UI 原型
└── screenshots/ (24)     # 截图
```

## 关键文件速查

```
src/
├── App.tsx                          # 根组件
├── components/
│   ├── Chat/ChatWindow.tsx          # AI对话
│   ├── ProjectHome/                  # 项目首页（10个子组件）
│   ├── ProjectList/ProjectList.tsx   # 项目列表
│   ├── Settings/SettingsPage.tsx     # 设置页面（5个Tab）
│   └── FeatureCards/                 # 9个卡片组件
├── shared/model-registry.ts          # AI厂商注册表
├── types/index.ts                    # 类型定义
└── types/windowApi.ts               # IPC类型声明

electron/
├── main.ts                           # 主进程入口
├── preload.ts                        # 预加载脚本（IPC桥接）
├── database/                         # 数据库（sql.js）
├── ipc/                              # IPC处理器
├── services/                         # AI服务、文件提取、签字检测
├── prompts/                          # Prompt模板
└── utils/                            # 工具函数（含metadata-queue）
```
