# 卡片数据模型完善方案

> 版本：v0.2 | 创建时间：2026-06-26 | 状态：待用户最终确认

---

## 一、现状分析

### 1.1 当前AI提取能力

AI分类流程（`electron/prompts/classify.ts`）每次文件上传/分析时提取以下字段：

| 字段 | 来源Prompt | 存储位置 | 提取状态 |
|------|-----------|---------|---------|
| project_code | CLASSIFY_PROMPT_STAGES | project.metadata | ✅ 已实现 |
| contract_no | CLASSIFY_PROMPT_STAGES | project.metadata | ✅ 已实现 |
| contact_person | CLASSIFY_PROMPT_STAGES | project.metadata | ✅ 已实现 |
| contact_phone | CLASSIFY_PROMPT_STAGES | project.metadata | ✅ 已实现 |
| customer_address | CLASSIFY_PROMPT_STAGES | project.metadata | ✅ 已实现 |
| project_name | CLASSIFY_PROMPT_STAGES | project.metadata | ✅ 已实现 |

**Metadata合并逻辑**（`ai-handlers.ts:217-256`）：AI返回的key_info字段会合并到project.metadata，但只覆盖非空值，不删除已有数据。

### 1.2 各卡片数据源现状

| 卡片 | 期望数据源 | 当前状态 | 缺口 |
|------|-----------|---------|------|
| **ProjectInfoPlaceholderCard** | metadata.customer_name | ❌ 未提取 | customer_name字段 |
| **ProjectInfoPlaceholderCard** | metadata.project_manager | ❌ 未提取 | 内部指定，无法AI提取 |
| **EvaluationCard** | metadata.evaluation | ❌ 未提取 | 利润测算结果联动 |
| **EvaluationCard** | metadata.contract_amount | ❌ 未提取 | contract_amount字段 |
| **ContractCard** | metadata.contract_amount + contract_items | ✅ 已实现 | 无 |
| **RequirementCard** | metadata.requirements[] | ❌ 空数组 | requirements数组 |
| **IssueCard** | metadata.key_issues[] | ❌ 空数组 | key_issues数组 |
| **SignatureCard** | metadata.signature_docs | ✅ 已实现 | 无 |
| **OpportunityCard** | metadata.opportunities[] | ❌ 空数组 | opportunities数组 |
| **DeliverableCard** | metadata.deliverables | ✅ 已实现 | 无 |
| **SummaryCard** | .ai/project-summary.md（简略版） | ❌ 未联动 | 简略版未生成 |

---

## 二、已确认决策

1. **T3触发方式**：每次分类后自动提取（无需用户操作）
2. **项目总结**：AI摘要更新时同步生成简略版（不新增独立生成逻辑）
3. **SummaryCard数据源**：读取AI摘要的简略版本（metadata.project_overview）
4. **去重策略**：requirements用模糊匹配，key_issues用精确匹配
5. **数组追加**：新条目追加到已有数组，按规则去重

---

## 三、实施方案（5个任务）

### T1：扩展AI提取字段（Prompt + 解析）

**目标**：让AI在分类时额外提取客户名称、合同金额、合同分项。

**修改文件**：
- `electron/prompts/classify.ts` — 扩展CLASSIFY_PROMPT_STAGES的key_info

**新增提取字段**：

```json
{
  "key_info": {
    "project_code": "",
    "contract_no": "",
    "contact_person": "",
    "contact_phone": "",
    "customer_address": "",
    "project_name": "",
    "customer_name": "",
    "contract_amount": 0,
    "contract_items": [
      { "name": "软件许可", "amount": 0, "description": "" }
    ]
  }
}
```

| 新字段 | AI提取方式 | 用途 |
|--------|-----------|------|
| customer_name | 从合同/SOW中提取客户公司名称 | 项目信息卡片 |
| contract_amount | 从合同中提取总金额（数字） | 合同概览+项目评估 |
| contract_items | 从合同中提取分项明细 | 合同概览卡片 |

**关键点**：
- contract_amount和contract_items已由ContractCard使用，当前依赖用户手动通过利润测算工具写入metadata。T1实现AI自动提取，后续利润测算工具的计算结果会覆盖AI提取值（用户手动优先）
- customer_name是新字段，用于替代当前ProjectInfoPlaceholderCard中缺失的客户名称

**测试**：验证Prompt格式、parseClassifyResponse解析新字段、metadata合并逻辑

### T2：利润测算工具联动写入metadata

**目标**：用户在ProfitCalculatorModal中完成测算后，结果自动写入metadata。

**修改文件**：
- `src/components/ProjectHome/ProfitCalculatorModal.tsx` — 测算完成后调用保存API
- `electron/ipc/project-handlers.ts` — 新增 `project:updateMetadata` IPC handler
- `src/types/windowApi.ts` — 新增updateMetadata类型
- `electron/preload.ts` — 暴露updateMetadata IPC

**写入字段**：

| 字段 | 来源 | 说明 |
|------|------|------|
| metadata.evaluation | ProfitCalculatorModal | 完整测算结果 |
| metadata.contract_amount | 同步 | 测算输入的合同金额 |
| metadata.cost_estimate | 同步 | 总成本 = 内部成本 + 外部成本 |
| metadata.profit_rate | 同步 | 内部利润率 |
| metadata.person_days | 同步 | 总人天 = 内部人天 + 外部人天 |

**数据结构**（metadata.evaluation）：

```json
{
  "evaluation": {
    "contractAmount": 1000000,
    "internalDays": 50,
    "externalDays": 30,
    "internalUnitPrice": { "role": "实施顾问", "level": "C2-1", "price": 1500 },
    "externalUnitPrice": { "role": "实施顾问", "level": "C2-1", "price": 2000 },
    "internalTravel": 5000,
    "externalTravel": 3000,
    "result": {
      "totalCost": 263000,
      "internalProfitRate": 0.35,
      "externalProfitRate": 0.45,
      "isInternalRedLine": false,
      "isExternalRedLine": false
    },
    "calculatedAt": "2026-06-26T10:00:00Z"
  }
}
```

**EvaluationCard读取逻辑**（修改 `cards/EvaluationCard.tsx`）：
- 优先读取 metadata.evaluation.result 中的计算结果
- 回退到 metadata.contract_amount / metadata.cost_estimate 等独立字段
- 利润测算按钮保留，点击弹出ProfitCalculatorModal

**测试**：验证保存API、数据读取优先级、EvaluationCard显示逻辑

### T3：AI自动提取需求/问题/商机（结构化提取）

**目标**：新增专门的AI分析Prompt，在文件分类后追加提取需求、问题、商机信息。

**方案**：不在分类Prompt中增加这些字段（避免分类Prompt过长影响分类准确性），而是新增独立的结构化提取Prompt，在分类完成后异步调用。

**新增文件**：
- `electron/prompts/extract-structured.ts` — 结构化数据提取Prompt

**Prompt设计**：

```
你是一个项目管理数据提取专家。请从以下文件内容中提取结构化信息。

文件类型：{category}
文件内容：{content}

请返回以下JSON格式：
{
  "requirements": [
    {
      "name": "需求名称",
      "detail": "需求描述",
      "status": "pending"
    }
  ],
  "key_issues": [
    {
      "text": "问题描述",
      "priority": "medium",
      "status": "open"
    }
  ],
  "opportunities": [
    {
      "name": "商机标题",
      "description": "客户需求描述",
      "status": "planned"
    }
  ]
}

提取规则：
- requirements：从需求文档、会议纪要、周报中提取用户提出的或确认的需求
- key_issues：根据关键词（问题/风险/阻塞/延期/缺陷）识别项目风险点
- opportunities：识别"二期/三期/追加需求/后续优化"等拓展商机关键词
- 每个数组最多返回5条，如果没有相关内容返回空数组
- status默认值：requirements=pending, key_issues=open, opportunities=planned
```

**修改文件**：
- `electron/ipc/file-handlers.ts` — 分类完成后调用结构化提取
- `electron/ipc/ai-handlers.ts` — 手动分析时也调用结构化提取
- `electron/ipc/project-handlers.ts` — 新增 `project:updateMetadata` IPC handler

**Metadata合并逻辑**（数组追加+去重）：

```
// 去重规则：
// requirements: 按name模糊匹配（包含关系），匹配到则追加source，不匹配则新增
// key_issues: 按text精确匹配，匹配到则不重复添加
// opportunities: 按name模糊匹配，匹配到则更新description，不匹配则新增
```

**关键点**：
- 结构化提取与分类是**两个独立的AI调用**，分类不影响分类准确性
- 每个文件分类后自动触发一次结构化提取，同一文件不会重复提取
- 结构化提取失败不影响分类结果（静默降级）

**测试**：验证去重逻辑、合并逻辑、各文件类型提取准确性

### T4：AI摘要更新时同步生成简略版

**目标**：在现有AI摘要生成流程中，同步生成一个简略版本写入metadata.project_overview，供SummaryCard显示。

**修改文件**：
- `electron/ipc/ai-handlers.ts` — 修改摘要生成逻辑，扩展Prompt返回格式
- `src/components/ProjectHome/cards/SummaryCard.tsx` — 改为读取.ai/project-summary.md的简略版

**方案**：
- 不新增独立的生成逻辑
- 在现有摘要生成Prompt中追加指令："同时返回一个200字以内的简略版本"
- 完整版写入 `.ai/project-summary.md`（保持不变）
- 简略版写入 `metadata.project_overview`（新增）

**Prompt修改**（ai-handlers.ts中摘要生成部分）：

```
在现有摘要Prompt末尾追加：

请同时在摘要最后用以下格式输出简略版本：
---BRIEF---
[200字以内的项目简要总结，包含核心成果和关键数据]
```

**解析逻辑**：

```typescript
const fullSummary = response.content.split('---BRIEF---')[0].trim()
const briefSummary = response.content.split('---BRIEF---')[1]?.trim() || ''

// 写入文件
await fs.writeFile(summaryPath, fullSummary, 'utf-8')

// 写入metadata
const metadata = JSON.parse(project.metadata || '{}')
metadata.project_overview = briefSummary
projectDb.updateProject(projectId, { metadata: JSON.stringify(metadata) })
```

**SummaryCard读取**：
- 当前已有逻辑：读取 `metadata.project_overview`
- 无需修改读取逻辑，只要T4写入即可

**关键点**：
- 一次AI调用同时生成完整版+简略版，零额外成本
- 简略版长度可控（200字以内），适合卡片展示
- 用户点击"生成/更新"时同步更新两个版本
- 增量策略保持不变：新文件上传时只读现有摘要+新文件内容

**测试**：验证Prompt返回格式、解析逻辑、两个版本正确写入

### T5：卡片UI数据适配

**目标**：修改卡片组件的读取逻辑，适配新的数据源。

**修改文件和内容**：

| 文件 | 修改内容 |
|------|---------|
| `cards/ProjectInfoPlaceholderCard.tsx` | 读取 metadata.customer_name（新增字段） |
| `cards/EvaluationCard.tsx` | 优先读取 metadata.evaluation.result，回退到独立字段 |
| `cards/SummaryCard.tsx` | 无修改（已读取 metadata.project_overview，T4写入后自动生效） |

**EvaluationCard数据读取优先级**：

```typescript
const meta = JSON.parse(project.metadata || '{}')
const evaluation = meta.evaluation?.result

if (evaluation) {
  // 优先使用利润测算结果
  contractAmount = evaluation.contractAmount || meta.contract_amount || 0
  costEstimate = evaluation.totalCost || meta.cost_estimate || 0
  profitRate = evaluation.internalProfitRate || meta.profit_rate || 0
  personDays = (evaluation.internalDays || 0) + (evaluation.externalDays || 0)
} else {
  // 回退到独立字段（AI提取值）
  contractAmount = meta.contract_amount || 0
  costEstimate = meta.cost_estimate || 0
  profitRate = meta.profit_rate || 0
  personDays = meta.person_days || 0
}
```

**测试**：验证各卡片在有数据/无数据时的显示逻辑

---

## 四、数据流总览

```
文件上传
  ├── AI分类（CLASSIFY_PROMPT_STAGES）
  │     └── 提取 key_info → 合并到 project.metadata
  │         （project_code, contract_no, contact_person, 
  │          contact_phone, customer_address, project_name,
  │          customer_name, contract_amount, contract_items）
  │
  └── 结构化提取（EXTRACT_STRUCTURED_PROMPT）
        └── 提取 requirements/key_issues/opportunities
            → 合并到 project.metadata（数组追加+去重）

利润测算
  └── ProfitCalculatorModal
        └── 计算结果 → 写入 project.metadata
            （evaluation, contract_amount, cost_estimate, 
             profit_rate, person_days）

AI摘要生成/更新
  └── 完整版 → .ai/project-summary.md
  └── 简略版 → metadata.project_overview
```

---

## 五、测试策略

| 任务 | 测试重点 | 预期新增测试数 |
|------|---------|-------------|
| T1 | Prompt格式验证、parseClassifyResponse解析新字段、metadata合并 | ~3 |
| T2 | 保存API、EvaluationCard数据读取优先级、显示逻辑 | ~5 |
| T3 | 去重逻辑（模糊/精确）、合并逻辑、空数组处理 | ~8 |
| T4 | Prompt返回格式、完整版+简略版解析、metadata写入 | ~4 |
| T5 | 各卡片有数据/无数据显示、回退逻辑 | ~3 |
| **合计** | | **~23** |

---

## 六、实施顺序

```
T1（扩展Prompt）→ T2（利润测算联动）→ T3（结构化提取）→ T4（简略版摘要）→ T5（UI适配）
```

- T1先行：T2依赖contract_amount字段扩展
- T2/T3可并行：T2处理利润测算，T3处理需求/问题/商机
- T4独立：修改摘要生成流程
- T5最后：依赖T1/T2/T4的数据写入

**预估工时**：2-3天（TDD模式）
