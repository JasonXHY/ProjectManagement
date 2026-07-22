# 项目规则

> 最后更新：2026-06-30

---

## 致命规则

1. **修改前必须先搜索查证方案**，禁止不确定情况下乱改
2. **方案决策必须询问用户**：功能/产品/性能方案先问用户再执行
3. **搜索优先**：技术方案必须先搜索验证，禁止凭训练数据手搓
4. **Token控制**：避免长输出，精简交互，减少不必要的全量测试
5. **内置API Key非免费**：开发者测试接口，2026年7月底关闭，用户需切换自己的Key

---

## Agent协作模式

| Agent | 职责 | 工作目录 | 状态 |
|-------|------|----------|------|
| MiMoCode | 代码实现、审核、技术实施 | `.mimocode/` | ✅ 主力 |
| QoderWork | 需求分析、方案设计、UI设计 | `.qoderwork/` | ✅ 活跃 |

---

## 编码约定

### 类型安全
- 禁止 `any` 类型（lint warn，目标error）
- 禁止 `as unknown` 强转
- 禁止非必要的 `!` 非空断言

### 错误处理
- 所有IPC handler必须有顶层try/catch
- 统一错误返回格式：`{ success: false, error: string }`
- 使用 `handleIpcError()` 统一错误格式

### 组件规范
- 单个组件不超过300行
- 大组件拆分为 styles → hooks → 子组件 → 主文件
- 空状态使用 `EmptyState` 组件

### 文件组织
- 前端组件：`src/components/{Feature}/`
- 后端IPC：`electron/ipc/`
- 后端服务：`electron/services/`
- Prompt模板：`electron/prompts/`
- 工具函数：`electron/utils/` 和 `src/utils/`

---

## 文档组织规范

### 目录结构
```
docs/
├── 00-INDEX.md           # Agent 入口
├── 01-specs/             # 需求规格
├── 02-plans/             # 实施方案
├── 03-reports/           # 复盘报告
├── 04-guides/            # 开发指南
├── 05-issues/            # 问题记录
├── 06-archive/           # 历史归档
├── 99-mockups/           # UI 原型
└── screenshots/          # 截图
```

### 命名规范
- 格式：`[日期]-[类型]-[简述].md`
- 类型代码：spec / plan / report / guide / issue
- Agent 创建文档后必须更新 `docs/00-INDEX.md`

---

## 决策规则

1. **方案决策必须询问用户**：功能设计、产品设计、性能相关的方案选择必须先问用户确认再执行
2. **风险前瞻性原则**：所有可预见的风险，在做的过程中就优化掉，不放在测试中修
3. **防上下文压缩丢失**：执行前先读方法论，压缩后让子agent重新读

---

## 执行偏好

- 执行方式：subagent（每个Task一个独立subagent）
- 测试文件优先选文本类(.md/.txt/.docx/.xlsx/.pdf)，避免图片/视频
- 截图重命名和手册更新可直接执行，无需额外确认
