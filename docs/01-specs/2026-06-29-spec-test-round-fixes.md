# 测试轮次问题修复方案

> 2026-06-29 | 基于测试项目1530（Project ID=16）的测试结果
> 状态：待Qoder审核

---

## 一、问题背景

测试项目1530导入19个文件，分类完成后发现以下问题：
1. AI摘要已生成（project-summary.md），但project_overview未写入metadata
2. 利润测算弹窗缺少外包人天字段，测算逻辑不成立
3. MiMo provider超时限制为60s，AI摘要生成超时
4. 合同金额默认值未从contract_items带入
5. 5/19文件分类与上一轮测试不一致

---

## 二、问题1：project_overview未写入metadata

### 现象
- `.ai/project-summary.md`文件存在（5081字），内容完整
- 但metadata中无`project_overview`字段
- 项目总结卡片显示"暂无项目总结"

### 根因

**fallback已存在**（lines 180-182）：代码已有`if (!briefSummary && fullSummary)`的fallback逻辑，briefSummary实际上有值。问题不是fallback缺失。

**真正原因：5处metadata写入无锁竞态覆盖**

项目中有5个独立的metadata写入点，全部采用"读-改-写"模式，无跨handler锁：

| # | 文件 | 行号 | 触发时机 |
|---|------|------|---------|
| 1 | `classify.ts` / `mergeKeyInfo` | line 75 | 每个文件分类完成后 |
| 2 | `classify.ts` / `extractStructuredDataAsync` | line 208 | 分类完成后异步触发 |
| 3 | `upload.ts` / `extractStructuredDataAsync` | line 136 | 文件上传后 |
| 4 | `ai-handlers.ts` / `ai:analyze` | line 232 | 用户点击"生成分析" |
| 5 | `ai-handlers.ts` / milestones | line 279 | 分析完成后 |

`classify.ts`内部有`metadataQueue`（line 177）串行化`extractStructuredDataAsync`的写入，但该队列不跨handler——`ai:analyze`不使用它。

竞态场景：用户批量分类→分类handler异步写metadata→同时点击"生成分析"→ai:analyze写入project_overview→后续分类handler的异步写入基于不含project_overview的旧snapshot覆盖→project_overview丢失。

### 修复方案

**方案A（推荐，轻量）**：将metadataQueue提升为跨handler共享的全局promise chain

新建`electron/utils/metadata-queue.ts`：
```typescript
let queue: Promise<void> = Promise.resolve()
export function enqueueMetadataWrite(fn: () => void | Promise<void>): Promise<void> {
  queue = queue.then(fn)
  return queue
}
```

所有5个写入点改为通过`enqueueMetadataWrite`执行，保证串行化。每次写入在回调内重新读取最新metadata。

改动文件：
- `electron/utils/metadata-queue.ts`（新建）
- `electron/ipc/handlers/classify.ts`（line 75, 208）
- `electron/ipc/handlers/upload.ts`（line 136）
- `electron/ipc/ai-handlers.ts`（line 232, 279）

**验证**：重启PMAer，导入文件+分类+生成摘要，检查metadata中project_overview是否保留

---

## 三、问题2：利润测算缺少外包人天字段

### 现象
- 利润测算弹窗中没有"外包人天"输入框
- `externalDays`在代码中硬编码为`0`（line 60）
- 外包成本无法计算，测算结果不准确

### 根因
`src/components/ProjectHome/ProfitCalculatorModal.tsx:60`：
```typescript
externalDays: 0,  // 硬编码，无输入框
```

Mockup设计（07-eval-card-card.html）中有完整的外包资源区域：
- 外包人天（input）
- 外包单价（input，默认1200）
- 外部差旅（input）

当前实现只有外包单价和外部差旅，缺少外包人天。

### 修复方案

**改动文件**：`src/components/ProjectHome/ProfitCalculatorModal.tsx`

**方案**：添加externalDays state和输入框，对齐mockup设计

1. 添加state：
```typescript
const [externalDays, setExternalDays] = useState<number>(0)
```

2. 在"外包资源"区域添加输入框（参考mockup 07-eval-card-card.html:124-129）：
```tsx
<div style={{ fontSize: '13px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>外包资源</div>
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
  <div>
    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>人天</label>
    <InputNumber
      value={externalDays}
      onChange={v => setExternalDays(v || 0)}
      min={0}
      style={{ width: '100%' }}
      placeholder="0"
    />
  </div>
  <div>
    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>单价（元/天）</label>
    <InputNumber
      value={externalUnitPrice}
      onChange={v => setExternalUnitPrice(v || 1200)}
      min={0}
      style={{ width: '100%' }}
    />
  </div>
</div>
<div style={{ marginTop: '12px' }}>
  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>外部差旅（元）</label>
  <InputNumber
    value={externalTravel}
    onChange={v => setExternalTravel(v || 0)}
    min={0}
    style={{ width: '100%' }}
    placeholder="0"
  />
</div>
```

3. 修改calculateProfit调用（line 57-65）：
```typescript
return calculateProfit({
  contractAmount,
  internalDays,
  externalDays,  // 改为使用state变量，不再硬编码0
  internalUnitPrice: weightedInternalUnitPrice,
  externalUnitPrice,
  internalTravel,
  externalTravel,
})
```

4. 修改useMemo依赖数组（line 66），保留`members`（因internalDays从members计算）：
```typescript
}, [contractAmount, members, externalDays, externalUnitPrice, internalTravel, externalTravel])
```

5. 保存到metadata时包含externalDays（line 121-146的saveToProject函数）：
```typescript
const evaluation = {
  members: members.map(({ id, ...rest }) => rest),
  contractAmount,
  externalDays,  // 新增
  externalUnitPrice,
  internalTravel,
  externalTravel,
  result,
  calculatedAt: new Date().toISOString(),
}
```

注意：saveToProject还会写`contract_amount: contractAmount`（line 138）。如果用户先通过问题4设置了合同金额，再打开利润测算，保存时会用弹窗里的值覆盖metadata中的contract_amount，这是预期行为。

### UI设计原则对齐

根据`docs/design/design-tokens.md`和`docs/design/ui-design-spec.md`：
- 输入框使用`InputNumber`组件，高度36px，圆角`--radius-sm`(6px)
- 标签使用`fontSize: 12px`，颜色`var(--text-secondary)`
- 外包资源区域用grid布局（2列），与内部团队区域风格一致
- 实时计算（useMemo），无需点击按钮

---

## 四、问题3：MiMo超时限制（已修复）

### 现象
AI摘要生成报错"小米MiMo请求超时（60秒）"

### 根因
`electron/services/ai-providers/mimo.ts:25`原为60000ms。`zhipu.ts`和`ai-service.ts`中的`OpenAICompatibleProvider`（给deepseek等第三方provider的通用实现）已是120000ms。

### 修复
已修改`mimo.ts`为120000ms（120秒）。需重启PMAer生效。

---

## 五、问题4：合同金额默认值

### 现象
- 新建项目时contract_amount为0
- 利润测算弹窗打开时合同总额为空
- 需要手动输入

### 修复方案

**改动文件**：`src/components/ProjectHome/ProfitCalculatorModal.tsx`

**方案**：打开弹窗时从project metadata读取contract_amount作为默认值

```typescript
// 在ProfitCalculatorModal组件中，打开时读取contract_amount
useEffect(() => {
  if (open && projectId) {
    window.api.project.get(projectId).then(result => {
      if (result.success && result.data) {
        const meta = parseMetadata(result.data?.metadata ?? null)
        const amount = (meta.contract_amount as number) || 0
        if (amount > 0) {
          setContractAmount(amount)
        }
      }
    })
  }
}, [open, projectId])
```

注意：需要添加`useEffect`导入（如果尚未导入）。

---

## 六、问题5：分类不一致

### 现象
5/19文件两次测试分类不同：
- 低利润率测算表标准模板.xlsx：P15=方案/开发规格说明书，P16=售前/成本评估
- 销售合同-CON202509240883_绩效FV1.docx：P15=售前/销售方案，P16=售前/合同原件
- CON202509240883-项目经理任命书.pdf：P15=验收/验收材料待签，P16=售前/销售方案
- CON202512090686-上海朋熙半导体-验收-SS.pdf：P15=售前/销售方案，P16=上线/上线切换方案
- 0126.xlsx：P15=测试/测试报告，P16=构建/开发文档

### 分析
- 低利润率测算表：P16分类（售前/成本评估）更准确 ✅
- 销售合同：P16分类（售前/合同原件）更准确 ✅
- 项目经理任命书：P16分类（售前/销售方案）正确（用户确认）✅
- 验收SS.pdf：跨项目验收文件，分类困难
- 0126.xlsx：无意义文件（系统截图），分类无关紧要

### 结论
LLM分类的非确定性是固有问题。当前分类结果整体合理，无需修复。如果需要更稳定的分类，可以考虑：
1. 对已分类文件缓存结果，避免重复分类
2. 在prompt中增加更多上下文（如文件名关键词提示）

---

## 七、实施优先级

| 优先级 | 问题 | 工作量 |
|--------|------|--------|
| P0 | 问题1：project_overview fallback | 0.5天 |
| P0 | 问题2：利润测算外包人天字段 | 0.5天 |
| P1 | 问题4：合同金额默认值 | 0.5天 |
| - | 问题3：MiMo超时 | 已修复 |
| - | 问题5：分类不一致 | 不修复 |

---

## 八、搜索验证参考

- Ant Design InputNumber: https://ant.design/components/input-number
- Promise chain串行化: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
- SQLite WAL mode for concurrent writes: https://www.sqlite.org/wal.html
- Electron IPC超时: 项目内已有120s AbortController模式（zhipu.ts、ai-service.ts中OpenAICompatibleProvider）

---

## 审查意见（2026-06-29）

> 审查方法：逐条对照源码验证技术描述准确性，网络搜索验证技术方案可行性

### 问题1：根因不是 fallback 缺失——是 metadata 竞态覆盖

**第一轮审查指出**：代码 lines 180-182 已有 fallback，文档的根因分析遗漏了这一点。进一步排查后发现，**fallback 本身没有问题，真正导致 project_overview 丢失的是 metadata 的并发写入竞态**。

#### 排查过程

代码执行流程（ai-handlers.ts `ai:analyze`）：

```
T=0s   line 174: AI 调用 #1（摘要生成）—— 网络请求，耗时数秒
T=3s   line 177-182: split + fallback → briefSummary 有值 ✅
T=3s   line 185: 写入 .ai/project-summary.md → 成功（文件存在，5081字）✅
T=3s   line 194: AI 调用 #2（关键信息提取）—— 网络请求，耗时数秒
T=8s   line 204: 读取 freshProject，解析 metadata
T=8s   line 207-209: briefSummary 写入 mergedMetadata.project_overview ✅
T=8s   line 232: updateProject → 写入数据库 ✅
T=8s   line 249: 写入 project-info.md
T=8s   line 257: AI 调用 #3（里程碑提取）—— 网络请求
T=13s  line 279: updateProject milestones
```

从代码看，line 185（写文件）和 line 232（写 metadata）之间没有会抛异常的代码（key info 提取有 try/catch 包裹）。如果 summary 文件写入成功，metadata 写入也应该成功。**所以 project_overview 不是"没写入"，而是"写入后被覆盖丢失"。**

#### 真正的根因：5 处 metadata 写入无锁竞态

项目中有 **5 个独立的 metadata 写入点**，全部采用相同的"读-改-写"模式，没有任何跨 handler 的锁或队列：

| # | 文件 | 行号 | 触发时机 |
|---|------|------|---------|
| 1 | `classify.ts` / `mergeKeyInfo` | line 75 | 每个文件分类完成后 |
| 2 | `classify.ts` / `extractStructuredDataAsync` | line 208 | 分类完成后异步触发 |
| 3 | `upload.ts` / `extractStructuredDataAsync` | line 136 | 文件上传后 |
| 4 | **`ai-handlers.ts` / `ai:analyze`** | **line 232** | **用户点击"生成分析"** |
| 5 | `ai-handlers.ts` / milestones | line 279 | 分析完成后 |

每个写入点的模式都是：
```typescript
const project = projectDb.getProject(projectId)          // 读
const metadata = JSON.parse(project.metadata)             // 解析
metadata.newKey = newValue                                // 改
projectDb.updateProject(projectId, { metadata: JSON.stringify(metadata) })  // 写
```

`updateProject` 是**整列覆盖**（`UPDATE projects SET metadata = ? WHERE id = ?`），不是合并。

#### 竞态场景还原

用户的操作流程：导入 19 个文件 → 批量分类 → 点击"生成分析"。

批量分类触发 19 个 `handleClassify`，每个分类完成后调用 `mergeKeyInfo`（同步写 metadata）+ `extractStructuredDataAsync`（异步 AI 调用后写 metadata）。`classify.ts` 内部有一个 `metadataQueue`（line 177）来串行化 `extractStructuredDataAsync` 的写入，但这个队列**不跨 handler**——`ai:analyze` 完全不使用它。

```
T=0s    用户点击"全部分类"→ 19个 classify 开始
T=2s    classify #1 完成 → mergeKeyInfo 写 metadata（加入 contract_no）
T=3s    classify #1 的 extractStructuredDataAsync 开始 AI 调用
T=4s    classify #2 完成 → mergeKeyInfo 写 metadata（加入 customer_name）
        ↑ 但 T=2s 的写入可能还没完成，读到了旧 snapshot
...
T=10s   用户点击"生成分析"→ ai:analyze 开始
T=10s   ai:analyze line 204: 读取 metadata snapshot A
T=12s   classify #5 的 extractStructuredDataAsync 完成 → 写入 metadata（基于 T=8s 的 snapshot）
T=15s   ai:analyze line 232: 写入 metadata（基于 T=10s 的 snapshot A + project_overview）
        ↑ classify #5 在 T=12s 写入的字段被覆盖丢失
T=18s   classify #8 的 extractStructuredDataAsync 完成 → 写入 metadata（基于 T=12s 的 snapshot）
        ↑ ai:analyze 在 T=15s 写入的 project_overview 被覆盖丢失！
```

最终 metadata 中不包含 project_overview，因为最后一次 classify 的写入基于一个不含 project_overview 的旧 snapshot。

#### 修复建议

文档中提出的"改进 fallback 质量"（去掉 Markdown 标题行）是锦上添花，但**不能解决这个 bug**。真正需要修的是竞态：

**方案 A（推荐，轻量）**：将 `metadataQueue` 提升为跨 handler 共享的全局 promise chain

```typescript
// electron/utils/metadata-queue.ts（新建）
let queue: Promise<void> = Promise.resolve()
export function enqueueMetadataWrite(fn: () => void | Promise<void>): Promise<void> {
  queue = queue.then(fn)
  return queue
}
```

所有 5 个写入点改为通过 `enqueueMetadataWrite` 执行，保证串行化。每次写入在回调内重新读取最新 metadata。

**方案 B（中等工作量）**：metadata 改为 JSON 列级操作，在 SQLite 层面用 JSON_PATCH 合并，而非应用层读-改-写。

**方案 C（最小改动）**：在 `ai:analyze` 的 line 204 读取 freshProject 之前，等待所有进行中的 classify 完成。但这会引入耦合，不推荐。

### 问题2：方案基本正确，有几处需补充

**代码验证确认**：
- `externalDays: 0` 硬编码 ✅（line 60）
- `calculateProfit` 调用传参 ✅（lines 57-65）
- `useMemo` 依赖数组 ✅（line 66，5个依赖项）
- `saveToProject` 未保存 externalDays ✅（lines 121-146 确认无此字段）
- `useEffect` 未导入 ✅（line 1 只有 `useState, useMemo`）
- `calculateProfit` 函数签名 ✅（`ProfitCalculator.ts` 接受 7 个参数的 `ProfitInput` 接口）

**需补充/修正的点**：

1. **当前 UI 布局描述不准确**：文档说"外包资源区域"只有外包单价和外部差旅，但实际上这两个字段和内部差旅一起放在一个三列 grid 中（lines 225-238），并非独立的"外包资源"区域。方案中提出的新布局（独立外包资源区域 + 2列 grid）需要确认与现有差旅字段的排列关系——是拆分现有三列 grid 还是新增一个区域？

2. **useMemo 依赖数组修正不完整**：文档 line 147 的依赖数组加了 `externalDays`，但漏了 `members`（原数组有 `members`，因为 `internalDays` 是从 `members` 计算的）。应确保 `members` 仍在依赖数组中。

3. **saveToProject 的 evaluation 对象**：文档 line 152-161 的 evaluation 对象加了 `externalDays`，这部分正确。但注意 `saveToProject` 还会写 `contract_amount: contractAmount`（line 138），这与问题4的方案有交互——如果用户先设了合同金额再打开利润测算，保存时会用弹窗里的值覆盖 metadata 中的 contract_amount，这是预期行为但值得明确说明。

### 问题3：描述与当前代码不符

**代码验证发现**：`mimo.ts` line 25 当前值已经是 **120000ms**（120秒），不是文档描述的 60000ms。错误提示也已经是"小米MiMo请求超时（120秒）"。

文档标注"已修复"是正确的，但根因描述有误：
- 文档说"zhipu和OpenAI兼容provider已改为120000ms"——**项目中不存在 OpenAI 兼容 provider**。`electron/services/ai-providers/` 目录下只有 3 个文件：`base.ts`（接口定义）、`mimo.ts`、`zhipu.ts`。没有 `openai-compatible.ts` 或类似文件。
- 文档"搜索验证参考"中也提到"项目内已有120s AbortController模式（zhipu.ts、ai-service.ts）"——`ai-service.ts` 不在 ai-providers 目录下，且文档未说明它是什么角色。

**建议**：修正问题3的描述，说明 mimo.ts 超时已从 60s 改为 120s（已完成），不要引用不存在的 provider 文件。

### 问题4：方案正确，补充一个细节

**代码验证确认**：
- `parseMetadata` 定义在 `src/utils/metadata.ts`，安全处理 null/空字符串 ✅
- `window.api.project.get` 调用链：preload.ts → project-handlers.ts → projectDb.getProject()，返回 `{ success: true, data: project }` ✅
- `ProfitCalculatorModal` 接收 `projectId` prop ✅（从 EvaluationCard.tsx 传入）

**需补充**：
- 文档 line 204 写 `window.api.project.get(projectId).then(result => { if (result.success && result.data) { ... } })`，但 `result.data` 可能是 `undefined`（当 project 不存在时）。line 206 的 `result.data.metadata` 会报错。应改为 `result.data?.metadata`（与 saveToProject 中 line 133 的写法一致：`projectResult.data?.metadata ?? null`）。

### 问题5：结论合理

分类不一致是 LLM 的固有问题，不修复的结论合理。文档提出的两个改进方向（缓存已分类结果、增加 prompt 上下文）也是正确的思路。

### 汇总

| 问题 | 方案准确性 | 需修正项 |
|------|-----------|---------|
| 问题1 | ❌→✅ 已修正 | 根因改为metadata竞态，方案改为全局queue |
| 问题2 | ✅ 已补充 | 补充useMemo依赖数组、saveToProject交互说明 |
| 问题3 | ⚠️ 已修正 | mimo.ts已120s；OpenAICompatibleProvider在ai-service.ts中定义 |
| 问题4 | ✅ 已补充 | result.data?.metadata防空指针 |
| 问题5 | ✅ 无需修正 | 无 |

---

### 网络验证来源

| 结论 | 验证方式 | 来源 |
|------|---------|------|
| Ant Design InputNumber API（value/onChange/min） | 网络搜索 | [Ant Design InputNumber](https://ant.design/components/input-number/) |
| AbortController + setTimeout 超时模式 | 网络搜索 | [MDN AbortSignal](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortSignal)、[node-fetch #523](https://github.com/node-fetch/node-fetch/issues/523) |
| mimo.ts 超时已为 120s | 代码验证 | `electron/services/ai-providers/mimo.ts` line 25 |
| zhipu.ts 超时为 120s | 代码验证 | `electron/services/ai-providers/zhipu.ts` line 15 |
| ai-handlers.ts 已有 fallback | 代码验证 | `electron/ipc/ai-handlers.ts` lines 180-182 |
| externalDays 硬编码为 0 | 代码验证 | `ProfitCalculatorModal.tsx` line 60 |
| useEffect 未导入 | 代码验证 | `ProfitCalculatorModal.tsx` line 1 |
| parseMetadata 安全处理 null | 代码验证 | `src/utils/metadata.ts` |
| project.get API 调用链 | 代码验证 | `preload.ts` line 14 → `project-handlers.ts` lines 105-114 |
| ai-providers 目录仅 3 文件 | 代码验证 | `electron/services/ai-providers/` 目录列表 |
| updateProject 是整列覆盖 | 代码验证 | `electron/database/projects.ts` lines 49-62 |
| 5 处 metadata 写入无跨 handler 锁 | 代码验证 | `classify.ts` L75/L208, `upload.ts` L136, `ai-handlers.ts` L232/L279 |
| metadataQueue 仅限 classify.ts 内部 | 代码验证 | `classify.ts` line 177 |
