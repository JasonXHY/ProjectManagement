# OPT-5 / OPT-6 / OPT-2 设计方案

> 2026-06-27 | 审查报告后续优化

---

## [S1] OPT-5：错误反馈统一

### 问题

项目已大量使用 Ant Design 的 `message` 组件做 Toast 提示（Settings、Chat、ProjectList、Handover 等），但仍有 18 处使用 `console.error` 而非 `message.error`，导致用户操作失败时看不到提示。

### 现状分析

| 组件 | 当前行为 | 应改为 |
|------|---------|--------|
| ProfitCalculatorModal | `console.error` | `message.error('保存失败')` |
| ChatWindow | `console.error` + `message.error` 混用 | 统一 `message.error` |
| ProjectList | `console.error` 兜底 | `message.error` 兜底 |
| BetaNoticeModal | 5 处 `console.error` | `message.error` |
| SettingsPage | `console.error` 兜底 | `message.error` 兜底 |

### 方案

不新建组件，统一现有 `message.error()` 调用：

1. 将所有 `catch` 块中的 `console.error(...)` 替换为 `message.error('操作失败，请重试')`
2. 保留 `console.error` 仅用于开发调试（ErrorBoundary、MermaidChart 等非用户操作场景）
3. 统一错误文案格式：`'操作名失败'` 或 `'操作名失败，请重试'`

### 不做的事

- 不建全局错误边界（ErrorBoundary 已存在）
- 不统一 IPC 返回格式（当前 `{ success, error? }` 已够用）
- 不做错误上报（后续版本）

---

## [S2] OPT-6：加载状态骨架屏

### 问题

ProjectHome 主视图的文件列表、特色卡片在数据加载时没有 loading 指示器，用户不知道是在加载还是没数据。

### 现状分析

已有 loading 状态的组件：
- SettingsPage: `loading` state + Spin
- ChatWindow: `isLoading` state + 打字指示器
- ProjectList: `loading` state + Spin
- HandoverDialog: `loadingFiles` / `loadingAi` + Spin

ProjectHome 缺失：
- 文件列表加载时无指示
- 特色卡片加载时无指示
- AI 分析进行中无指示

### 方案

使用 Ant Design 的 `Skeleton` 组件（已有依赖），在数据加载时显示骨架屏：

1. **文件列表**：`FileListTable` 加载时显示 5 行骨架行
2. **特色卡片**：各卡片组件在 `project` 数据未就绪时显示卡片骨架
3. **AI 分析状态**：`SummaryRow` 的 AI 摘要卡片显示"分析中..."状态

### 实现范围

- `FileListTable.tsx`：接受 `loading` prop，加载时显示 `Skeleton` × 5 行
- 各卡片组件：`project.metadata` 为 null 时已有空状态处理，不需要骨架屏
- `SummaryRow.tsx`：AI 分析中显示加载动画

### 不做的事

- 不做全局骨架屏（只在明确的加载场景）
- 不做渐进式加载（保持简单）

---

## [S3] OPT-2：交付物自动统计

### 问题

`DeliverableCard` 已有 `DELIVERABLE_RULES` 和 `isDeliverable()` 做自动识别，但规则覆盖不完整，且只识别"上线/验收/关闭"阶段的文件。

### 现状分析

当前 `DELIVERABLE_RULES`：
```typescript
stages: ['上线', '验收', '关闭']
subcategories: ['操作手册', '测试报告', '方案文档', '蓝图', '部署文档', '交接文档', '培训资料']
filenameKeywords: ['操作手册', '用户手册', '测试报告', '蓝图', '部署文档', '交接文档', '培训资料', '方案']
```

缺失场景：
- 方案阶段的蓝图、需求规格说明书
- 构建阶段的技术设计说明书
- 测试阶段的测试计划、UAT 文档
- 启动阶段的项目章程

### 方案

扩展 `DELIVERABLE_RULES` 覆盖更多阶段和子分类，同时增加文件名关键词匹配：

```typescript
const DELIVERABLE_RULES = {
  stages: ['方案', '构建', '测试', '上线', '验收', '关闭'],
  subcategories: [
    '蓝图', '需求规格说明书', '开发规格说明书',  // 方案
    '技术设计说明书', '接口文档',                  // 构建
    '测试计划', '测试报告', '测试用例',            // 测试
    '操作手册', '用户手册',                        // 上线
    '验收报告', '项目总结',                        // 验收
    '交接文档', '培训资料',                        // 转客户成功
  ],
  filenameKeywords: [
    '蓝图', '需求规格', '技术设计', '接口文档',
    '测试计划', '测试报告', '测试用例', 'UAT',
    '操作手册', '用户手册', '部署文档',
    '验收报告', '项目总结', '交接文档', '培训资料',
    '方案', '确认单',
  ],
}
```

### 不做的事

- 不做 AI 识别交付物（规则匹配已够用）
- 不做交付物版本管理（当前已是 v1.0 固定值）
- 不做交付物导出（后续版本）

---

## 审查意见（2026-06-27 代码验证）

### OPT-5 审查

**实际数量修正**：文档称"18 处 console.error"，实际为 **23 处**（8 个文件），但并非全部需要转换：

| 分类 | 数量 | 说明 |
|------|------|------|
| 需新增 `message.error` | **9 处** | 用户操作失败时无 Toast 反馈 |
| 已有 `message.error`，`console.error` 冗余 | **12 处** | 可清理但非必须 |
| 应保留 `console.error` | **2 处** | ErrorBoundary、MermaidChart（非用户操作） |

**需转换的 9 处**（当前完全没有用户提示）：

- `BetaNoticeModal.tsx`：5 处（lines 33/44/56/80/97），需新增 `message` import
- `ChatWindow.tsx`：3 处（lines 83/95/126），已有 `message` import
- `ProfitCalculatorModal.tsx`：1 处（line 117），需新增 `message` import

**方案表格修正**：ProjectList（4处）、SettingsPage（2处）、projectHome.hooks（5处）的 `console.error` 实际都**已配对** `message.error`，属于冗余日志而非"兜底"。方案表格中这三行描述不准确——它们不需要"替换"，只需要决定是否清理冗余 `console.error`。

**建议**：方案第 1 条改为"将 9 处缺少用户提示的 `console.error` 替换为 `message.error`"；第 2 条补充"可选清理 12 处冗余日志"。

---

### OPT-6 审查

**方案整体可行**，有一个关键遗漏：

**`analyzing` 状态已存在但未接通**：`projectHome.hooks.ts` line 23 已声明 `const [analyzing, setAnalyzing] = useState(false)`，在 `handleGenerateSummary` 中正确 set true/false（lines 422/439），hook 也 return 了它（line 453）。但 `ProjectHome.tsx` 的解构（lines 30-59）**没有取 `analyzing`**，所以 SummaryRow 收不到这个状态。

这意味着 OPT-6 不需要新建 `analyzing` 状态，只需：
1. `ProjectHome.tsx` 解构 `analyzing`
2. 将 `analyzing` 作为 prop 传给 `SummaryRow`
3. `SummaryRow` 据此显示加载动画

**`filesLoading` 状态确实缺失**：`loadFiles()`（hooks lines 55-59）在 useEffect 中异步调用，没有任何 loading 标记。需要在 hooks 中新增 `filesLoading` 状态，然后传给 `FileListTable` 的 `loading` prop。

**Skeleton 组件**：项目中尚未使用过 `Skeleton`，但 `antd ^6.4.3` 已安装，可直接 `import { Skeleton } from 'antd'`。

---

### OPT-2 审查

**发现关键 Bug：`isDeliverable()` 检查了错误的字段，扩展规则无法生效。**

**问题详述**：`DeliverableCard.tsx` line 25 的 `isDeliverable()` 检查 `file.stage`，但：
- `file.stage` 存的是**项目阶段**（售前/进行中/关闭），由 AI 分类的"判断2"产生
- `file.category` 存的才是**文件分类阶段**（售前/启动/需求/方案/构建/测试/上线/验收/转客户成功/关闭）

`DELIVERABLE_RULES.stages` 里的 `'上线'`、`'验收'`、`'关闭'` 是文件分类阶段，但被拿去跟项目阶段比较。结果是：
- 项目阶段为"售前"或"进行中"的文件**永远无法匹配**（占了绝大多数）
- 只有项目阶段恰好为"关闭"的文件才可能通过第一道门
- `getDeliverableStatus()`（lines 40-45）有同样的问题

**必须先修这个 Bug，再扩展规则**。修复方案：将 `file.stage` 全部改为 `file.category`。

**子分类数据纠错**：
- 当前 `'方案文档'` 是幽灵条目——`STAGE_DEFINITIONS` 的"方案"阶段子分类是"开发规格说明书/蓝图/方案汇报材料/会议纪要"，没有"方案文档"，永远不会匹配
- 当前 `'交接文档'` 和 `'培训资料'` 属于"转客户成功"阶段，但 `stages` 数组中没有"转客户成功"，即使字段修复后也无法匹配

**扩展规则的建议修正**（在修复字段 Bug 的基础上）：

```typescript
const DELIVERABLE_RULES = {
  stages: ['方案', '构建', '测试', '上线', '验收', '转客户成功', '关闭'],
  subcategories: [
    '蓝图', '开发规格说明书',                    // 方案
    '开发文档', '接口文档', '配置文档',            // 构建
    '测试用例', '测试报告',                        // 测试
    '部署文档', '操作手册',                        // 上线
    '验收报告', '项目总结',                        // 验收
    '交接文档', '培训资料', 'FAQ',                 // 转客户成功
  ],
  filenameKeywords: [
    '蓝图', '需求规格', '技术设计', '接口文档',
    '测试计划', '测试报告', '测试用例', 'UAT',
    '操作手册', '用户手册', '部署文档',
    '验收报告', '项目总结', '交接文档', '培训资料',
    '方案', '确认单', '项目章程',
  ],
}
```

与原方案差异：
1. `stages` 增加 `'转客户成功'`（原方案遗漏）
2. `subcategories` 与 `STAGE_DEFINITIONS` 对齐，去掉不存在的 `'方案文档'`、`'需求规格说明书'`、`'技术设计说明书'`、`'测试计划'`（这些是文件名关键词而非子分类名），补充 `'开发文档'`、`'配置文档'`、`'FAQ'`
3. `filenameKeywords` 保留原方案，补充 `'项目章程'`

---

## MiMo 验证分析（2026-06-27）

### OPT-5：qoder 说的对

**数量修正接受**：实际 console.error 共 25 处（18 个 .tsx + 7 个 .ts），qoder 说 23 处接近。原方案"18 处"只统计了 .tsx 文件。

**分类修正接受**：
- BetaNoticeModal 5 处、ChatWindow 3 处、ProfitCalculatorModal 1 处 = **9 处需新增 message.error**
- ProjectList 4 处、SettingsPage 2 处、projectHome.hooks 5 处 = **11 处已有 message.error 配对，console.error 冗余**
- ErrorBoundary 1 处、MermaidChart 1 处 = **2 处应保留**
- metadata.ts 1 处 = **保留**（工具函数日志）

**方案更新**：第 1 条改为"9 处缺少用户提示的 console.error 替换为 message.error"；新增"可选清理 11 处冗余 console.error"。

### OPT-6：qoder 说的对

**analyzing 状态未接通**：验证确认 `projectHome.hooks.ts:23` 已有 `analyzing` state，`ProjectHome.tsx:30-59` 的解构确实遗漏了它。修复只需 3 步，不需要新建状态。

**filesLoading 状态缺失**：验证确认 `loadFiles()` 是异步调用但无 loading 标记。需在 hooks 中新增 `filesLoading` state。

**方案更新**：删除"新建 analyzing 状态"的描述，改为"接通已有 analyzing + 新增 filesLoading"。

### OPT-2：qoder 发现了关键 Bug

**Bug 确认**：`DeliverableCard.tsx:26` 检查 `file.stage`（项目阶段：售前/进行中/关闭），但 `DELIVERABLE_RULES.stages` 是文件分类阶段（方案/构建/测试等）。字段用错了，导致绝大多数文件无法匹配。

**必须先修 Bug**：将 `isDeliverable()` 和 `getDeliverableStatus()` 中的 `file.stage` 改为 `file.category`。

**子分类修正接受**：`STAGE_DEFINITIONS` 的子分类名与原方案不一致，qoder 的修正与实际数据对齐。

**方案更新**：在扩展规则之前，先修 `file.stage` → `file.category` 的 Bug；子分类列表按 `STAGE_DEFINITIONS` 实际值对齐。
