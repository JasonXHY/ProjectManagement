# 千问代码审查指令

> 创建时间：2026-06-12
> 目的：请千问对项目管理助手进行代码、功能、质量全面审查

---

## 一、项目概况

**项目名称**：project-manager（项目管理助手）
**技术栈**：React 19 + TypeScript + Electron 42 + Ant Design 6 + Tailwind CSS 4 + sql.js
**AI提供商**：11家厂商（小米MiMo、智谱、阿里千问、腾讯、百度、DeepSeek、月之暗面、零一万物、讯飞、百川、MiniMax）
**项目定位**：轻量级AI驱动的项目管理桌面应用（Windows）

---

## 二、最近重大变化（2026-06-12）

### 文件架构整理
项目根目录已重新组织，旧文件已归档：
- `.claude-code/` → `.archive/claude-code/`
- `.superpowers/` → `.archive/superpowers/`
- `.claude/` → `.archive/claude/`
- `src-tauri-archived/` → `.archive/src-tauri-archived/`
- `layout-diagram.md`、`zhipu.md`、`qoderwork-sync.md` → `.archive/temp-files/`
- `projects.db`（根目录）→ `.archive/temp-files/`
- `test-files/` → `src/__tests__/test-data/`
- `ClaudeCode开发环境配置指南.md`、`project_analysis.md` → 已删除

### 文档整合
- `docs/requirements/` — 需求文档
- `docs/design/` — 设计文档（含design-tokens.md）
- `docs/development/` — 开发文档（含优化路线图、技术选型、round1/round2方案）
- `docs/mockups/` — 效果图和方案分析

### 第三轮优化完成（28项功能）
1. **TD**：技术债修复（7项）— TS类型错误、死代码、废弃类型/表、调试日志
2. **FB**：前后端一致性修复（3项）— 参数匹配、smart类型删除、废弃字段
3. **AI**：多AI供应商支持 — 11家厂商、通用OpenAI兼容Provider、设置页UI
4. **ST**：阶段推进 — 3阶段简化（售前/进行中/关闭）、文件触发式弹窗、手动按钮
5. **BT**：批量操作 — 复选框多选、批量分类/删除、阶段下拉、IPC进度
6. **ROLE**：用户角色预留 — 枚举定义、设置页选择、Prompt动态化
7. **CH**：对话记录保存 — session_id分组、历史列表、会话切换
8. **PG**：项目进度卡片 — Timeline甘特图、星星标记、AI里程碑提取
9. **SG**：签字识别 — Electron渲染+截图、多模态AI检测、UI标记
10. **KI**：关键信息提取 — AI提取Prompt、数据库+MD双写、ProjectInfoCard组件
11. **UX+CQ**：体验优化+代码质量 — 自动刷新、摘要数据、导入清理、自定义阶段

### 第四轮优化完成（28项代码质量）
**P0已完成**：
- 编译级错误修复（ChatWindow.tsx、ProjectHome.tsx）
- Electron安全加固（CSP、sandbox、全局异常捕获）
- 数据库性能优化（索引、外键、批量写入、备份）
- 组件拆分（ProjectHome.tsx 1204行→144行，8个子组件）
- API Key加密存储（掩码+白名单）

**P1已完成**：
- IPC参数验证 + settings白名单
- 前后端边界修复（model-registry移至shared）
- 错误处理统一（AppError类型）
- Prompt外部化（electron/prompts/，支持用户自定义）
- React性能优化（memo/useMemo/useCallback）
- window.location.reload()替换
- 大文件上传优化（50MB限制）
- 死代码清理
- 数据库外键和孤儿记录
- windowApi类型重复声明

**P2已完成**：
- 清理冗余依赖（Tauri包、未使用包）
- 硬编码数据清理
- 数据库写入备份
- electron-builder配置
- 重复代码清理（rowsToObjectArray）
- CSS变量统一
- Prettier配置

**P3已完成**：
- 结构化日志
- SettingsPage阶段持久化
- 文档完善（JSDoc）

**用户决策变更已完成**：
- 阶段推进：AI分类时大模型判断（非关键词匹配）
- 对话分组：每个项目独立会话窗口
- 进度卡片：状态显示替代百分比
- Prompt管理：支持用户自定义
- 签字检测：Electron渲染+截图（性能优化）

### 代码审查修复
- preload sessionId参数缺失 → 已修复
- SignatureDetector隐藏窗口未销毁 → 已修复
- file:delete throw Error → 已改为return错误格式
- handleIpcError泄露stack → 生产环境不返回
- deleteProject引用不存在的conversations表 → 已删除

---

## 三、当前目录结构

```
C:\NewProject\
├── .archive/                    # 归档目录（旧文件）
├── .mimo-code/                  # MiMoCode工作区
├── .qoderwork/                  # QoderWork工作区
├── .claude-code/                # Claude Code工作区（预留）
├── .mimocode/                   # MiMoCode配置
├── docs/                        # 项目文档
│   ├── requirements/            # 需求文档
│   ├── design/                  # 设计文档
│   ├── development/             # 开发文档
│   └── mockups/                 # 效果图
├── electron/                    # Electron主进程
│   ├── main.ts                  # 入口
│   ├── preload.ts               # 预加载脚本
│   ├── database/                # 数据库操作
│   ├── ipc/                     # IPC处理器
│   ├── services/                # 后端服务
│   │   ├── ai-service.ts        # AI服务
│   │   ├── file-extractor.ts    # 文件提取
│   │   ├── signature-detector.ts # 签字检测
│   │   └── ai-providers/        # AI供应商
│   │       ├── model-registry.ts # 厂商注册表
│   │       ├── base.ts          # 基础Provider
│   │       ├── zhipu.ts         # 智谱
│   │       ├── mimo.ts          # 小米MiMo
│   │       └── openai-compatible.ts # 通用兼容
│   ├── prompts/                 # Prompt模板
│   │   ├── classify.ts
│   │   ├── analyze.ts
│   │   └── chat.ts
│   └── utils/                   # 工具函数
│       ├── validators.ts        # 参数验证
│       ├── errors.ts            # 错误处理
│       └── project-path.ts      # 路径工具
├── src/                         # React前端
│   ├── components/
│   │   ├── ProjectHome/         # 项目主页（已拆分）
│   │   │   ├── ProjectHome.tsx  # 主文件（144行）
│   │   │   ├── projectHome.hooks.ts # 自定义Hook
│   │   │   ├── projectHome.styles.ts # 样式常量
│   │   │   ├── FileListTable.tsx # 文件表格
│   │   │   ├── BatchActionBar.tsx # 批量操作
│   │   │   ├── StageSidebar.tsx # 阶段导航
│   │   │   ├── ProjectStats.tsx # 统计卡片
│   │   │   ├── UploadArea.tsx   # 上传区域
│   │   │   └── ProjectInfoCard.tsx # 项目信息卡片
│   │   ├── ProjectList/         # 项目列表
│   │   │   ├── ProjectList.tsx
│   │   │   └── ProjectGantt.tsx # 甘特图
│   │   ├── Chat/                # AI对话
│   │   │   └── ChatWindow.tsx
│   │   ├── Settings/            # 设置页
│   │   │   └── SettingsPage.tsx
│   │   ├── common/              # 通用组件
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── StageProgressionModal.tsx # 阶段推进弹窗
│   ├── pages/                   # 页面
│   ├── services/                # 前端服务
│   ├── types/                   # 类型定义
│   │   ├── index.ts
│   │   └── windowApi.ts
│   ├── shared/                  # 共享模块
│   │   └── model-registry.ts    # 厂商注册表（共享）
│   ├── styles/                  # 样式
│   ├── utils/                   # 工具函数
│   └── __tests__/               # 测试
├── public/                      # 静态资源
├── index.html                   # HTML入口（含CSP）
├── package.json                 # 依赖配置
├── tsconfig.json                # TypeScript配置
├── vite.config.ts               # Vite配置
├── vitest.config.ts             # 测试配置
├── eslint.config.js             # ESLint配置
├── .prettierrc                  # Prettier配置
├── tailwind.config.ts           # Tailwind配置
├── electron-builder.yml         # Electron打包配置
├── start-dev.bat                # 开发启动脚本
├── start-dev-quick.bat          # 快速启动脚本
├── README.md                    # 项目主README
└── CHANGELOG.md                 # 变更记录
```

---

## 四、审查要求

请从以下角度进行详细审查：

### 4.1 代码质量
- TypeScript类型安全性（any类型使用、类型断言）
- React最佳实践（组件设计、Hooks使用、性能优化）
- 代码风格一致性
- 命名规范
- 未使用导入和变量
- 死代码

### 4.2 功能实现
- 核心功能是否完整（项目管理、文件管理、AI对话、AI分类）
- 阶段推进逻辑是否正确
- 批量操作是否正常
- 签字检测是否可用
- 关键信息提取是否准确
- 进度卡片显示是否正确

### 4.3 安全性
- IPC参数验证
- API Key存储安全
- 路径穿越防护
- CSP配置
- 敏感信息泄露

### 4.4 性能
- 数据库操作效率
- 组件渲染性能
- 大文件处理
- 内存使用

### 4.5 架构设计
- 前后端边界
- 组件职责划分
- 模块依赖关系
- 可维护性

### 4.6 Electron特有
- 主进程/渲染进程通信
- contextBridge使用
- 资源管理
- 打包配置

---

## 五、输出格式

请按以下格式输出审查报告：

```
# 项目代码审查报告

## 一、严重问题（必须修复）
| 编号 | 文件:行号 | 问题描述 | 修复建议 |

## 二、中等问题（应该修复）
| 编号 | 文件:行号 | 问题描述 | 修复建议 |

## 三、低优先级（可以改进）
| 编号 | 文件:行号 | 问题描述 | 修复建议 |

## 四、总结
- 严重问题数量
- 中等问题数量
- 低优先级数量
- 整体评价
```

---

## 六、注意事项

1. 项目刚完成大规模重构和优化，可能存在一些遗漏
2. `.archive/` 目录下的文件是旧版本，不需要审查
3. `node_modules/` 和 `dist/` 目录不需要审查
4. 重点关注 `electron/` 和 `src/components/` 目录
5. 审查时请读取完整文件内容，不要只看片段
6. 给出具体的文件路径和行号，便于定位
