# 项目规则

> 最后更新：2026-06-13

---

## Agent协作模式

| Agent | 职责 | 工作目录 | 状态 |
|-------|------|----------|------|
| MiMoCode | 代码实现、审核、技术实施 | `.mimo-code/` | ✅ 主力 |
| QoderWork | 需求分析、方案设计、UI设计 | `.qoderwork/` | ✅ 活跃 |
| Claude Code | 预留 | `.claude-code/` | ⏸️ 暂停 |

### 协作流程
```
QoderWork设计方案 → .qoderwork/plans/
    ↓
MiMoCode审核方案 → .mimo-code/reviews/
    ↓
QoderWork修改方案
    ↓
三方达成一致
    ↓
MiMoCode实施代码
    ↓
用户验收
```

---

## 编码约定

### 类型安全
- 禁止 `any` 类型（lint warn，目标error）
- 禁止 `as unknown` 强转
- 禁止非必要的 `!` 非空断言
- `windowApi.ts` 类型声明必须与 `preload.ts` 实现参数一致

### 错误处理
- 所有IPC handler必须有顶层try/catch
- 统一错误返回格式：`{ success: false, error: string }`
- 使用 `handleIpcError()` 统一错误格式
- 禁止空 `catch {}` 块

### 样式规范
- 遵循设计规范 `.qoderwork/design-system/v1-design-tokens.md`
- 使用设计token（颜色、间距、圆角）而非硬编码值
- 三层样式：ConfigProvider → Tailwind → overrides.css
- 禁止内联style超过必要范围

### 组件规范
- 单个组件不超过300行
- 大组件拆分为 styles → hooks → 子组件 → 主文件
- 使用 `React.memo`、`useMemo`、`useCallback` 优化性能
- 空状态使用 `EmptyState` 组件

### 文件组织
- 前端组件：`src/components/{Feature}/`
- 前端服务：`src/services/`
- 后端IPC：`electron/ipc/`
- 后端服务：`electron/services/`
- Prompt模板：`electron/prompts/`
- 工具函数：`electron/utils/` 和 `src/utils/`

---

## 决策规则

1. **方案决策必须询问用户**（决策24）：功能设计、产品设计、性能相关的方案选择必须先问用户确认再执行
2. **风险前瞻性原则**（决策25）：所有可预见的风险，在做的过程中就优化掉，不放在测试中修
3. **双审机制**（决策15）：每个任务经过程序员+架构师双审，达成一致后才执行
4. **防上下文压缩丢失**（决策16）：执行前先读方法论，压缩后让子agent重新读

---

## 评审流程

1. 评审方按 `02-评审指南-v2.md` 审查
2. 输出：功能完整性报告、设计合规报告、代码质量报告、优化建议
3. MiMoCode核实评审发现
4. 确认后修复，typecheck+lint验证
5. 更新评审记录到 `.mimocode/review.md`

---

## 文档更新规范

```markdown
> 更新时间：YYYY-MM-DD HH:MM
> 更新人：MiMoCode / QoderWork / 用户
> 更新内容：简要描述
```

### 版本号
```
v1.0.0 — 初始版本
v5.0.0 — 第三轮优化完成
v6.0.0 — 第四轮优化完成
v7.0.0 — 第五轮优化完成
v7.1.0 — 评审包生成
v7.2.0 — 独立业务需求文档
v8.0.0 — 评审v1-cn修复 + 分类阶段恢复 + 需求v2文档
```
