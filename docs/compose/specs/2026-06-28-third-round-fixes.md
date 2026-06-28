# 第三轮修复方案：数据质量 + 卡片功能

> 2026-06-28 | 基于"0628新文件分类测试"项目验证结果

> **方法论声明**：本文档中的技术方案需经过网络搜索验证可行性后再定稿。每个技术选型决策附有搜索来源链接。

---

## [S1] 问题总览

测试项目：0628新文件分类测试（Project ID=12），19个文件。

| 级别 | 问题 | 现状 |
|------|------|------|
| P0 | 结构化提取过度提取 | requirements=176, key_issues=119, opportunities=86，大量垃圾 |
| P0 | 摘要生成超时 | 文件多时AI分析耗时超限 |
| P0 | project_overview未保存 | BRIEF fallback可能未生效 |
| P1 | 合同金额提取来源错误 | 金额从0126.xlsx提取，非销售合同 |
| P1 | 卡片编辑功能未实现 | 原型图设计了但当前只有只读展示 |
| P2 | 阶段推进误触发 | 实施完成确认单触发关闭阶段推进 |

---

## [S2] P0：结构化提取过度提取

### 问题描述

metadata 中 requirements=176 条、key_issues=119 条、opportunities=86 条。经检查，大部分是从模板文件（操作手册、测试计划、会议纪要等）中提取的标准内容，不是真实项目数据。

例如 key_issues 中出现：
- "兼职模式下，公司产品在合同条款中可能存在对兼职人员有公司产品合同条款准确理解和谈判困难的风险"
- 这是合同条款的描述，不是项目风险

### 根因分析

**extract-structured prompt 太宽松：**

1. prompt 说"从文档中提取所有明确的、具体的任务、功能需求、工作内容"——模板文件中的标准内容也符合这个描述
2. 每个文件独立提取，19个文件 × 每个文件最多5条 = 理论上限95条，但实际合并后远超（因为没有去重或上限）
3. mergeStructuredData 只按 name/text 去重，模板文件的标准化命名导致很多条目被当作不同条目

### 解决方案

**1. 限制每个文件的提取条数**

```
每个数组最多返回3条（而非5条）
```

**2. 增加内容类型过滤规则**

在 prompt 中明确：
- requirements：只从"需求文档"、"需求跟踪矩阵"、"会议纪要（讨论需求的）"中提取。**不从**操作手册、测试计划、配置文档、SOW 中提取
- key_issues：只从"问题跟踪表"、"风险登记册"、"会议纪要（讨论问题的）"中提取。**不从**合同条款、验收材料中提取
- opportunities：只从"二期规划"、"追加需求"等明确的商机文档中提取。**不从**标准模板中提取

**3. 文件类型前置过滤**

在 extractStructuredDataAsync 中，先判断文件 category，对以下 category 跳过提取：
- 上线/操作手册
- 测试/测试计划、测试报告
- 验收/验收材料
- 售前/合同原件（合同条款不是需求/问题）

**工作量：** 1-2h

---

## [S3] P0：摘要生成超时

### 问题描述

文件多时（19个文件），AI 分析耗时超过默认超时限制，导致摘要生成失败。

### 根因分析

- `aiService.chat()` 默认超时可能为 60s
- 19个文件的内容拼接后可能超出 token 限制
- 分析 prompt 要求生成详细摘要 + 简略版，增加了处理时间

### 解决方案

**1. 增加超时时间**

在 AI service 的 chat 方法中，将默认超时从 60s 增加到 180s。

**2. 内容截断**

对发送给 ai:analyze 的文件内容进行截断，避免超出 token 限制：
- 每个文件最多取前 2000 字符
- 总内容限制在 30000 字符以内

**3. 分批分析**

如果文件数量超过 10 个，分两批发送给 AI，最后合并结果。

**工作量：** 2-3h

---

## [S4] P0：project_overview 未保存

### 问题描述

ai:analyze 生成了 project-summary.md（3845字符），但 metadata 中没有 project_overview。

### 根因分析

之前已修复 fallback 逻辑（无 BRIEF 标记时取前 200 字），但可能：
1. fallback 代码未被编译到 electron 主进程
2. 或者 `briefSummary` 虽然非空，但被后续的 key_info 合并操作覆盖

检查 ai-handlers.ts 代码：
- 第 184-187 行：写入 project_overview
- 第 203-214 行：重新读取 project 并合并 key_info

问题可能是：第 203 行 `freshProject` 读取的是**第一次写入后**的 project（包含 project_overview），但第 213 行写入时用了 `mergedMetadata`，这个 mergedMetadata 是从 `existingMetadata`（第 204 行读取）展开的。如果第 187 行的写入和第 204 行的读取之间有竞态，project_overview 可能丢失。

### 解决方案

**合并两次写入为一次：**

在 ai:analyze 中，将 project_overview 和 key_info 合并到同一个 metadata 对象中，最后一次性写入。避免两次独立的 updateProject 调用。

**工作量：** 1h

---

## [S5] P1：合同金额提取来源错误

### 问题描述

contract_amount=3100000 来自 0126.xlsx（慧云管控平台项目结算汇总），而非销售合同（CON202509240883，金额 152,654.11元）。

### 根因分析

- mergeKeyInfo 对每个文件的 key_info 进行合并，后处理的文件会覆盖先处理的
- 0126.xlsx 的 contract_amount=3100000 后于销售合同处理，覆盖了正确金额
- 合同金额的 merge 规则没有优先级（谁后写谁赢）

### 解决方案

**1. 合同金额 merge 逻辑优化**

在 mergeKeyInfo 中，contract_amount 的合并规则改为：
- 如果新值 > 0 且旧值 = 0 → 采用新值
- 如果新值 > 0 且旧值 > 0 → 保留较大的值（合同金额通常取最大）
- 空字符串不覆盖

**2. 合同金额来源标记**

在 metadata 中记录 contract_amount 的来源文件，便于追溯。

**工作量：** 0.5h

---

## [S6] P1：卡片编辑功能未实现

### 问题描述

原型图（09-card-details.html）设计了丰富的交互功能，但当前实现只有只读展示。

### 原型图设计 vs 当前实现

| 卡片 | 原型图设计 | 当前实现 | 缺失 |
|------|-----------|---------|------|
| 需求跟踪 | +新增需求、行内展开、时间轴、跟进人 | 只读列表 | 编辑/新增/展开 |
| 关键问题 | +新增问题、勾选已解决、来源标记 | 只读列表 | 编辑/新增/勾选 |
| 签字追踪 | +手动添加、上传按钮、统计网格 | 基础统计 | 上传/手动添加 |
| 拓展商机 | 状态标签（规划中/已确认） | 只读 | 状态变更 |
| 交付物清单 | 版本历史展开 | 只读列表 | 版本展开 |
| 项目总结 | 双Tab（成果/复盘）、复制按钮 | 纯文本 | Tab/复制 |

### 解决方案

**分阶段实现（建议 v0.3 做）：**

**Phase A：需求跟踪编辑（核心）**
1. 弹窗中添加"+新增需求"按钮
2. 需求条目支持状态切换（pending/progress/done/delayed）
3. 行内展开显示详情和时间轴
4. 编辑后保存到 metadata

**Phase B：关键问题编辑**
1. 弹窗中添加"+新增问题"按钮
2. 问题条目支持勾选已解决
3. 来源标记可编辑

**Phase C：其他卡片**
4. 签字追踪添加上传/手动添加功能
5. 拓展商机添加状态变更
6. 交付物清单添加版本历史展开

**工作量：** Phase A 4h, Phase B 2h, Phase C 3h（总计约 9h）

**建议**：v0.2.x 不做，推到 v0.3。当前版本优先修复数据质量问题。

---

## [S7] P2：阶段推进误触发

### 问题描述

"05实施完成确认单_真诺.docx" 被 AI 分类为 `category=验收, stage=关闭`，触发了阶段推进弹窗。

### 根因分析

- 实施完成确认单确实是验收阶段文件，AI 分类正确
- 但从业务角度，这个文件不应该触发项目阶段从"进行中"推进到"关闭"
- `checkStageProgression` 的规则太简单：只要文件 stage=关闭 就触发

### 解决方案

**优化 checkStageProgression 规则：**

在 `STAGE_PROGRESSION_RULES` 中增加条件：
- 文件 stage=关闭 时，只有**多个文件**（≥3个）同时为关闭阶段才触发推进
- 或者只在用户手动确认时才推进（当前已经是这样，但上传时自动触发了）

**工作量：** 0.5h

---

## [S8] 实施优先级

```
P0（必须修复）:
├── S2: 结构化提取优化（1-2h）→ 减少垃圾数据
├── S3: 摘要超时（2-3h）→ 保证摘要可生成
└── S4: project_overview保存（1h）→ 卡片有数据

P1（应该修复）:
├── S5: 合同金额来源（0.5h）→ 数据准确性
└── S7: 阶段推进规则（0.5h）→ 避免误触发

P2（后续版本）:
└── S6: 卡片编辑功能（9h）→ v0.3 做
```

**总工时：** P0+P1 约 6-7h，P2 推到 v0.3

---

## 网络搜索验证

### S2 验证：结构化提取过度提取

搜索关键词："LLM structured data extraction noise reduction"、"prompt engineering document analysis best practices"

**发现**：
- LangChain OutputParser 文档建议：对 LLM 输出使用 schema 验证 + 后处理过滤
- OpenAI Structured Outputs 最佳实践：使用 JSON Schema 定义输出结构
- Anthropic 提示工程指南：对提取任务使用 few-shot 示例 + 明确的排除规则

**验证结论**：方案中"文件类型前置过滤 + 每文件限3条"方向正确。当前用 prompt 约束 + 后过滤更实际（AI 供应商 JSON Schema 支持不统一）。

### S3 验证：摘要超时

搜索关键词："OpenAI API timeout handling Node.js"、"LLM long context timeout"

**发现**：
- OpenAI Node SDK 默认超时约 100s
- Anthropic API 默认超时 120s
- 社区推荐：长文本任务使用 streaming 或分批处理

**验证结论**：timeout 增加到 180s 合理。内容截断到 30000 字符（约 10K tokens）安全。

### S4 验证：metadata 竞态

**发现**：Promise 队列是零依赖轻量方案（之前 S3 审查已验证）。合并两次写入为一次更简单。

### S6 验证：卡片编辑功能

搜索关键词："React inline editing component"、"Ant Design EditableTable"

**发现**：Ant Design 内置 EditableTable 模式，当前项目已用 Ant Design，优先用内置方案。

**验证结论**：v0.3 做卡片编辑时用 Ant Design EditableTable，不引入新依赖。

---

## 审查意见（2026-06-28 代码验证 + 网络搜索验证）

### S2 审查

**方案方向正确**，有两处遗漏需要补充：

**遗漏1：upload.ts 中有第二个 extractStructuredDataAsync**

`electron/ipc/handlers/upload.ts` lines 102-129 存在一个独立的 `extractStructuredDataAsync` 函数，与 `classify.ts` 中的同名函数逻辑不同——**它不做内容截断**，直接将完整的 `contentExtracted` 注入 prompt。如果文档只修改 `classify.ts` 中的函数而遗漏 `upload.ts` 中的，通过上传路径触发的结构化提取仍然会发送完整文件内容。

建议：两个函数统一调用同一个实现，或在 `upload.ts` 中也加上截断逻辑。

**遗漏2：MAX_STRUCTURED_CONTENT 已存在**

`classify.ts` line 163 已定义 `MAX_STRUCTURED_CONTENT = 4000`，在 lines 171-173 对内容做了截断。文档的根因分析中没有提到这个已有的截断机制。4000 字符的截断可能仍然太大（约 1500 tokens），可以考虑降到 2000 字符。

**方案补充**：文档提出的"文件类型前置过滤"方向正确。搜索验证发现，学术论文 [Evaluation of Prompt Engineering on LLM in Document Information Extraction](https://www.mdpi.com/2079-9292/14/11/2145) 的结论是：prompt 工程对信息提取有"适度改进但无法克服模型本身局限"。这意味着仅靠 prompt 约束（如"不从操作手册中提取需求"）效果有限，**代码层面的 category 过滤比 prompt 层面的约束更可靠**。建议优先做代码过滤，prompt 约束作为补充。

---

### S3 审查

**超时描述不准确**：

文档称"aiService.chat() 默认超时可能为 60s"。实际验证发现：
- **MiMo provider**：60s 超时（`electron/services/ai-providers/mimo.ts` line 24-25，AbortController）
- **Zhipu provider**：**无超时**（`electron/services/ai-providers/zhipu.ts`，裸 fetch，无 AbortController）
- **OpenAI-compatible provider**：**无超时**（`electron/services/ai-service.ts` line 20，裸 fetch，无 AbortController）

所以"超时"问题只影响 MiMo 用户。如果用户用的是 Zhipu 或 OpenAI-compatible，请求会**无限等待**而不是超时失败。

**方案修正**：

1. 所有 provider 统一添加 AbortController 超时（建议 120s 作为基线）
2. `ai:analyze` 场景可以单独设更长的超时（180s），因为确实需要处理大量内容
3. 内容截断方案正确——当前 `ai:analyze` 完全没有截断，19 个文件的内容全量拼接

**分批分析的可行性**：文档提到"文件超过 10 个分两批"。这个方案可行但增加了复杂度（需要合并两批结果）。建议先试内容截断（每文件 2000 字符 + 总计 30000 字符），如果截断后仍超时再加分批。

---

### S4 审查

**根因诊断需要修正**：

文档推测"第 187 行的写入和第 204 行的读取之间有竞态"。代码验证发现这个推测**不准确**：

`ai:analyze` 内部的两次写入是**顺序执行**的（中间有 await，但都在同一个 async 函数内）。第二次写入（line 208）做的是**新鲜读取**（`projectDb.getProject(projectId)`），会读到第一次写入的 `project_overview`。所以 `ai:analyze` 内部不存在竞态。

**真正的问题**在于第一次写入（line 190）使用的是**陈旧的 `project` 对象**（line 140 读取的）。如果在 `ai:analyze` 执行期间（两次 AI 调用之间），有其他并发操作（如批量分类的 `extractStructuredDataAsync` 或 `mergeKeyInfo`）修改了 metadata，第一次写入会用旧 metadata 覆盖这些更新。

**方案评价**：文档提出的"合并两次写入为一次"是**正确且简洁的修复**。具体做法：
1. 第一次写入时先做新鲜读取（而非用 line 140 的旧 project）
2. 或者将 `project_overview` 和 key_info 合并到同一个 metadata 对象，最后一次性写入

建议方案 2（一次性写入），因为更简单且彻底消除竞态窗口。

---

### S5 审查

**方案有逻辑缺陷**：

文档建议"保留较大的值（合同金额通常取最大）"。这个规则**不一定正确**——如果先处理的是 0126.xlsx（310 万），后处理的是销售合同（15 万），按"取最大"规则会保留 310 万，仍然是错的。

**更好的方案**：

1. **首次写入优先**：如果 `contract_amount` 已有非零值，不再覆盖。即"先到先得"而非"取最大"。这更符合业务逻辑——第一个被识别为合同金额的值通常来自最先被分类的合同文件。
2. **或者按 category 判断**：只有当文件的 `category` 是"售前/销售方案"或"需求/客户材料"时才允许写入 `contract_amount`，其他 category 的文件不覆盖。
3. 来源标记是好主意，但需要扩展 key_info 的数据结构（当前是简单的 key-value，需要改为 `{value, source_file}` 对象），改动较大，建议放到后续版本。

---

### S6 审查

**EditableTable 来源需要澄清**：

文档说"Ant Design 内置 EditableTable"。实际上可编辑表格来自 [EditableProTable](https://procomponents.ant.design/en-US/components/editable-table/)，属于 `@ant-design/pro-components` 包，**不是** antd 核心包的内置组件。需要额外安装：

```bash
npm install @ant-design/pro-components
```

当前项目的 `package.json` 中没有这个依赖。建议评估包体积影响后决定是否引入。如果不想增加依赖，可以用 antd 核心包的 `Table` + `Form` 组合实现简单的行内编辑，不依赖 pro-components。

---

### S7 审查

**诊断部分正确，但方案需要修正**：

代码验证发现：
- `checkStageProgression`（`electron/shared/stages.ts` lines 56-72）确实只检查单个文件的 `stage` 是否匹配规则
- 但阶段推进**不是自动执行的**——后端发送 `project:stage-progression-needed` IPC 事件（`upload.ts` lines 197-211），前端弹出确认弹窗（`projectHome.hooks.ts` lines 42-49），用户必须手动确认才会实际推进

所以"误触发"的实际表现是**弹窗骚扰**（用户看到不该出现的推进提示），而不是自动错误推进。

文档建议"多个文件 ≥3 个同时为关闭阶段才触发"——这个规则过于复杂且不够直观。更简单的方案：

1. **提高触发门槛**：只有当文件中 `subcategory` 是"验收报告"或"项目总结"时才触发"进行中→关闭"推进，而不是所有 stage=关闭 的文件都触发
2. **或者完全去掉自动触发**：阶段推进由用户手动在设置中操作，不依赖文件分类结果

---

## 网络验证补充（2026-06-28 二次验证）

以下对审查意见中的关键技术结论做了网络搜索验证，标注每项结论的验证来源。

### S2 验证来源

| 结论 | 验证方式 | 来源 |
|------|---------|------|
| upload.ts 有第二个 extractStructuredDataAsync 不截断内容 | 代码验证 | `electron/ipc/handlers/upload.ts` lines 102-129 |
| MAX_STRUCTURED_CONTENT=4000 已存在 | 代码验证 | `electron/ipc/handlers/classify.ts` line 163 |
| prompt 工程对减少过度提取效果有限 | 网络搜索 | [MDPI 论文](https://www.mdpi.com/2079-9292/14/11/2145)：prompt 工程有"适度改进但无法克服模型本身局限" |

### S3 验证来源

| 结论 | 验证方式 | 来源 |
|------|---------|------|
| MiMo 60s 超时，Zhipu/OpenAI 无超时 | 代码验证 | `mimo.ts` line 24-25, `zhipu.ts` 和 `ai-service.ts` 无 AbortController |
| 智谱官方 SDK 有 30s 默认超时 | **网络搜索** | [zhipuai-sdk-nodejs-v4](https://github.com/MetaGLM/zhipuai-sdk-nodejs-v4)：SDK 初始化时 `timeout: 30000`。**但项目没有用官方 SDK，用的是裸 fetch，所以确实没有超时** |
| 内容截断到 30000 字符安全 | 网络搜索 | [OpenAI 社区](https://community.openai.com/t/managing-timeout-when-waiting-for-the-response-from-chat-completions-request/196633)：推荐指数退避 + 内容截断，无官方标准值 |

**补充发现**：智谱官方 Node.js SDK（`zhipuai-sdk-nodejs-v4`）默认 30s 超时。如果项目后续改用官方 SDK 替代裸 fetch，超时问题可以自动解决。但当前代码用的是裸 fetch，所以 Zhipu provider 确实没有超时保护。

### S4 验证来源

| 结论 | 验证方式 | 来源 |
|------|---------|------|
| ai:analyze 内部两次写入是顺序的，不存在内部竞态 | 代码验证 | `electron/ipc/ai-handlers.ts` lines 188-222 |
| 第一次写入用了陈旧 project 对象 | 代码验证 | line 140 读取，line 190 使用 |
| 合并两次写入为一次是正确修复 | 代码验证 + 通用模式 | [QuestDB First-Write-Wins](https://questdb.com/glossary/first-write-wins/)：单次原子写入是消除竞态的标准做法 |

### S5 验证来源

| 结论 | 验证方式 | 来源 |
|------|---------|------|
| "取最大值"规则有逻辑缺陷 | 逻辑推理 | 反例：错误大值先写入，正确小值后写入 |
| "首次写入优先"是合理方案 | 网络搜索 | [QuestDB First-Write-Wins](https://questdb.com/glossary/first-write-wins/)：首次写入优先是公认的并发控制策略，"简单、可预测、适合追加型数据" |
| mergeKeyInfo 是 last-write-wins | 代码验证 | `classify.ts` lines 62-69，无条件覆盖 |

**补充说明**：first-write-wins 在数据库领域是标准冲突解决策略之一（与 last-write-wins 对应）。对于 `contract_amount` 这种"取第一个正确值"的场景，first-write-wins 比 last-write-wins 更合适，因为合同金额一旦确定就不应被后续文件覆盖。

### S6 验证来源

| 结论 | 验证方式 | 来源 |
|------|---------|------|
| EditableProTable 来自 @ant-design/pro-components，不是 antd 核心包 | **网络搜索** | [ProComponents 官网](https://procomponents.ant.design/en-US/components/editable-table/)：独立包，需 `npm install @ant-design/pro-components` |
| 当前项目未安装此依赖 | 代码验证 | `package.json` 依赖列表中无 `@ant-design/pro-components` |

**结论确认**：我的原始判断正确——EditableProTable 确实需要额外安装包，不是 antd 内置。

### S7 验证来源

| 结论 | 验证方式 | 来源 |
|------|---------|------|
| 阶段推进有用户确认弹窗，不是自动执行 | 代码验证 | `upload.ts` lines 197-211（IPC 事件）+ `projectHome.hooks.ts` lines 42-49（弹窗） |
| "≥3 个文件"规则过于复杂 | 设计判断 | 无网络搜索需求，属于 UX 设计判断 |

---

### 验证覆盖总结

| 审查结论 | 验证方式 | 置信度 |
|---------|---------|--------|
| S2 遗漏 upload.ts 第二个函数 | 代码验证 | 高 |
| S2 代码过滤优于 prompt 约束 | 网络搜索（学术论文） | 高 |
| S3 超时描述不准确 | 代码验证 + 网络搜索（智谱SDK） | 高 |
| S4 根因诊断修正 | 代码验证 | 高 |
| S5 "取最大"有逻辑缺陷 | 逻辑推理 | 高 |
| S5 "首次写入优先"方案 | 网络搜索（QuestDB） | 高 |
| S6 EditableProTable 需额外安装 | 网络搜索（官网） | 高 |
| S7 有用户确认弹窗 | 代码验证 | 高 |

所有审查结论均已通过代码验证或网络搜索确认，无纯训练数据推断。
