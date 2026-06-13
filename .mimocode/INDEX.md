# 项目记忆索引

> 最后更新：2026-06-13
> 位置：`C:\NewProject\.mimocode/`

---

## 快速导航

| 文件 | 内容 | 何时读取 |
|------|------|---------|
| **[INDEX.md](INDEX.md)** | 本文件 — 项目全景索引 | 每次会话开始 |
| **[progress.md](progress.md)** | 开发进度（5轮优化+评审修复） | 了解当前状态 |
| **[architecture.md](architecture.md)** | 技术架构、文件位置、关键决策 | 修改代码前 |
| **[requirements.md](requirements.md)** | 需求缺口、新增需求、未实现功能 | 规划任务时 |
| **[review.md](review.md)** | 评审报告核实、已修复问题、待修复问题 | 评审相关工作 |
| **[technical.md](technical.md)** | 技术发现、环境配置、踩坑记录 | 遇到技术问题时 |
| **[rules.md](rules.md)** | 项目规则、编码约定、协作模式 | 编写代码时 |

---

## 项目概览

- **项目名称**：project-manager（项目管理助手）
- **技术栈**：React 19 + TypeScript + Electron 42 + Ant Design 6 + Tailwind CSS 4 + sql.js
- **AI提供商**：11家厂商（小米MiMo、智谱、阿里千问、腾讯、百度、DeepSeek、月之暗面、零一万物、讯飞、百川、MiniMax）
- **项目定位**：轻量级AI驱动的项目管理桌面应用（Windows）

## 当前状态

- **代码状态**：第五轮优化完成 + 评审报告v1-cn 13项修复完成 + 11个分类阶段恢复
- **编译状态**：`electron:compile` ✅ 通过，`tsc --noEmit` ✅ 通过
- **待办**：评审方按最新代码评审 → 根据评审结果修复 → 新增需求（NF-01~NF-06）

## 关键文件速查

```
src/
├── App.tsx                          # 根组件（Header布局、页面路由）
├── components/
│   ├── Chat/ChatWindow.tsx          # AI对话（559行）
│   ├── ProjectHome/                  # 项目首页（拆分为10个子组件）
│   ├── ProjectList/ProjectList.tsx   # 项目列表（卡片+表格视图）
│   ├── Settings/SettingsPage.tsx     # 设置页面（5个Tab）
│   └── common/EmptyState.tsx         # 空状态组件
├── shared/model-registry.ts          # AI厂商注册表（前后端共享）
├── types/index.ts                    # 类型定义
└── types/windowApi.ts               # IPC类型声明

electron/
├── main.ts                           # 主进程入口
├── preload.ts                        # 预加载脚本（IPC桥接）
├── database/                         # 数据库（sql.js）
├── ipc/                              # IPC处理器
├── services/                         # AI服务、文件提取、签字检测
├── prompts/                          # Prompt模板
└── utils/                            # 工具函数
```

## 评审材料位置

- 桌面：`C:\Users\kingdee\Desktop\project-manager-requirements\`
  - `01-业务需求规格说明书-v2.md` — 完整业务需求
  - `02-评审指南-v2.md` — 评审指南
- 评审包：`C:\Users\kingdee\Desktop\project-manager-review-v2.zip`
