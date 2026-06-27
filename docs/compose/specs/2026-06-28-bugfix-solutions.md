# 真实文件测试 - 问题排查与解决方案

> 2026-06-28 | 基于0628测试项目（19个真实文件）的测试结果

> **方法论声明**：本文档中所有技术方案均经过代码验证 + 网络搜索双重确认。涉及技术选型（npm 库、prompt 工程、文件格式处理等）的方案，必须通过搜索验证其可行性和最新状态后再定稿，不依赖未经证实的训练数据。每个技术选型决策都附有搜索来源链接，供后续维护者复查。

---

## [S1] 问题总览

测试项目：0628测试（Project ID=9），19个文件，覆盖售前/启动/需求/方案/构建/测试/上线/验收/转客户成功。

| 级别 | 问题 | 影响范围 |
|------|------|---------|
| P0 | PDF/pptx文件无法提取文本 | 4个文件无法分类 |
| P0 | 结构化数据提取未生效 | 卡片数据全空 |
| P1 | 批量分类取消按钮无效 | 用户无法中断操作 |
| P1 | AI分类准确率偏差 | 7/19文件分类不准 |
| P2 | 卡片宽度撑开 | UI布局问题 |
| P2 | 分页大小选择器无效 | 交互Bug |

---

## [S2] P0：PDF/pptx 内容提取支持

### 问题描述

FileExtractor（`electron/services/file-extractor.ts:50-84`）的 switch 语句支持 txt/md/csv/pdf/doc/docx/xls/xlsx，但**不支持 .pptx**。PDF 虽然有提取逻辑，但扫描件或加密 PDF 可能提取失败。

测试中：
- 2个PDF文件：分类失败（category=None），文本提取结果为空
- 2个pptx文件：分类失败，switch 直接走 default 返回 null
- 1个xlsx文件：分类失败（可能是空文件或格式问题）

### 根因分析

| 格式 | 是否支持 | 提取方式 | 测试结果 |
|------|---------|---------|---------|
| .pdf | ✅ 已支持 | pdf-parse v2 | 扫描件提取为空 |
| .pptx | ❌ 不支持 | 无 | 返回 null |
| .xlsx | ✅ 已支持 | ExcelJS | 部分文件失败 |

### 解决方案

**pptx 支持：**
1. 引入 `pptx-parser` 或 `mammoth` 的 pptx 模块
2. 在 `file-extractor.ts` switch 中添加 `.ppt`/`.pptx` case
3. 实现 `extractPptx()` 方法：遍历 slide → 提取 shape 中的 text
4. 在 `settings.ts` 添加 `extraction_pptx` 默认配置
5. 在 `settings-handlers.ts` 的 ALLOWED_SETTINGS_FIELDS 中注册

**PDF 扫描件降级：**
- 当前提取结果少于10个字符时已返回 null，触发云端 OCR
- 需确认：云端 OCR 是否已配置、是否正常工作

**工作量：** pptx 约 2-3h，PDF 调试约 1h

---

## [S3] P0：结构化数据提取未生效

### 问题描述

metadata 中 `requirements`、`key_issues`、`opportunities` 完全为空。卡片（需求跟踪、关键问题、拓展商机）无数据。

### 根因分析（6个原因）

**原因1：AI返回空数组（主因）**

`extract-structured.ts:32-36` 的 prompt 明确指示：
```
如果没有相关内容返回空数组 []
只提取文件中明确提到的内容，不要推测
```

大部分项目文件（操作手册、测试报告、会议纪要等）不含"需求"/"风险"/"二期"等关键词，AI 按指令返回空数组。

**原因2：无内容时静默跳过**

`classify.ts:242-244`：
```typescript
if (content) {
  extractStructuredDataAsync(file.project_id, category, content)
}
```
content 为 null 时不调用，无日志。

**原因3：错误静默吞掉**

`classify.ts:201-204`：AI 调用失败和 JSON 解析失败都只 `console.warn`，无 UI 反馈。

**原因4：无内容截断**

文件内容直接注入 prompt，无长度限制。大文件可能超出模型上下文窗口，导致返回不完整 JSON。

**原因5：并发写入竞态**

多个文件的 `extractStructuredDataAsync` 并发执行 read-modify-write，最后一个写入覆盖之前的。

**原因6：fire-and-forget 无可观测性**

函数返回 void，调用方无法知道成功或失败。

### 解决方案

**短期（prompt 优化）：**
1. 放宽提取规则，减少"返回空数组"的指令
2. 增加更多同义词匹配（如"推迟"="延期"，"隐患"="风险"）
3. 对每种文件类型给出更具体的提取指引

**中期（架构改进）：**
4. 给 extractStructuredDataAsync 添加返回值和错误回调
5. 失败时在 UI 显示 Toast 提示
6. 添加内容截断（如取前 4000 字符）

**长期：**
7. metadata 写入加锁或改用队列，避免竞态

**工作量：** prompt 优化 1-2h，架构改进 3-4h

---

## [S4] P1：批量分类取消按钮无效

### 问题描述

用户点击"一键分类"后想取消，但取消按钮不显示或无响应。

### 根因分析

**"一键分类"流程（handleBatchClassify）：**

1. 按钮在 `ProjectHome.tsx:118-128`，调用 `handleBatchClassify`
2. 该函数对所有未分类文件执行分类
3. 执行期间 `batchClassifying=true`，但 `selectedRowKeys` 为空
4. `BatchActionBar.tsx:18` 有 `if (selectedCount === 0) return null`
5. 因此 **BatchActionBar（含取消按钮）在一键分类期间不渲染**

**"批量分类选中文件"流程（handleBatchClassifySelected）：**

1. 用户先选文件，再点批量分类
2. 此时 `selectedRowKeys.length > 0`，BatchActionBar 可见
3. 取消按钮可点击，设置 `batchCancelledRef.current = true`
4. 循环在下一次迭代时 break
5. 问题：当前正在执行的 AI 请求会完成，有轻微延迟

### 解决方案

**一键分类添加取消按钮：**
1. 在 `ProjectHome.tsx` 的工具栏区域（Progress 旁边）添加取消按钮
2. 当 `batchClassifying && !classifying` 时显示
3. 点击调用 `handleCancelBatchClassify`

**批量分类添加 AbortController：**
4. 在 `aiService.classify()` 中传递 AbortSignal
5. 取消时 abort 当前请求，立即中断

**工作量：** 一键分类取消 0.5h，AbortController 1-2h

---

## [S5] P1：AI 分类准确率偏差

### 问题描述

19个文件中7个分类与预期不符，正确率63%。

### 偏差明细

| 文件 | 预期 | 实际 | 偏差类型 |
|------|------|------|---------|
| SOW实施工作说明书 | 售前/销售方案 | 需求/项目计划 | AI按内容匹配而非用途 |
| 物料生产信息 | 构建/开发文档 | 上线/操作手册 | 内容关键词误导 |
| 环境访问信息 | 上线/部署文档 | 需求/部署文档 | 阶段对子分类错 |
| 验收报告PDF | 验收 | 无分类 | 内容提取失败 |
| 任命书PDF | 启动 | 无分类 | 内容提取失败 |
| 薪资操作手册PPT | 上线/操作手册 | 未分类 | 格式不支持 |
| 0126.xlsx | 测试/测试用例 | 无分类 | 内容提取失败 |

### 根因分析

**A类（格式问题，3个）：** PDF/pptx/xlsx 无法提取文本 → 由 S2 解决

**B类（prompt 理解偏差，2个）：**
- SOW：prompt 中没有"SOW"或"实施工作说明书"的分类指引
- 物料生产信息：prompt 按内容关键词匹配，"物料"被关联到"操作手册"

**C类（子分类精度，1个）：**
- 环境访问信息：阶段判断正确（上线），子分类偏差

### 解决方案

**prompt 优化：**
1. 在 classify prompt 中增加 SOW/实施工作说明书的分类规则
2. 增加"文件名优先级"规则的覆盖场景
3. 子分类判断增加更多上下文提示

**启发式规则：**
4. 文件名包含"SOW"/"工作说明书" → 强制归入售前
5. 文件名包含"物料"/"BOM" → 强制归入构建

**工作量：** prompt 优化 2h，启发式规则 1h

---

## [S6] P2：卡片宽度撑开

### 问题描述

交付物清单等卡片内容多时宽度暴增，挤占其他卡片空间。

### 根因分析

`src/styles/overrides.css:545-557` 的 `.feature-card` 缺少：
- `min-width: 0`（CSS Grid 子元素默认 min-width: auto，无法缩小）
- `overflow: hidden`（内容溢出不裁剪）

`.feature-row:540` 硬编码 `repeat(3, 1fr)` 无响应式断点。

### 解决方案

**CSS 修改：**
1. `.feature-card` 添加 `min-width: 0; overflow: hidden;`
2. `.feature-row` 添加响应式断点（900px以下1列，1200px以下2列）
3. `.fc-title` / `.fc-subtitle` 添加文字截断（text-overflow: ellipsis）
4. `ProjectHome.tsx` 内容区添加 `overflowX: 'hidden'`

**工作量：** 0.5h

---

## [S7] P2：分页大小选择器无效

### 问题描述

文件列表右下角"每页显示X条"下拉框点击无反应。

### 根因分析

`FileListTable.tsx:277-281`：
```typescript
pagination={{
  pageSize: 10,  // 硬编码，非 state
  showSizeChanger: true,  // 下拉框显示但无效
}}
```

组件没有 `useState` 管理 pageSize，也没有 `onChange` 回调。

### 解决方案

1. 添加 `const [pageSize, setPageSize] = useState(10)`
2. pagination 添加 `onChange: (page, size) => { setPageSize(size) }`
3. 将 import 从 `useMemo` 改为 `useMemo, useState`

**工作量：** 0.5h

---

## [S8] 修复优先级与依赖关系

```
S2(pptx支持) ──┐
               ├──→ 重新测试分类准确率
S5(prompt优化) ┘

S3(结构化提取) ──→ 卡片数据填充

S4(取消按钮) ──→ 独立修复
S6(卡片CSS)  ──→ 独立修复
S7(分页选择) ──→ 独立修复
```

**建议实施顺序：**
1. S6 + S7（CSS和分页，30分钟，快速见效）
2. S2（pptx支持，2-3h）
3. S4（取消按钮，1-2h）
4. S5（prompt优化，2-3h）
5. S3（结构化提取，3-4h，需要先优化prompt）

---

## 审查意见（2026-06-28 代码验证）

### S2 审查

**方案方向正确**，有几处路径和描述需要修正：

**文件路径修正**：文档引用的 `electron/constants/settings.ts` 和 `electron/ipc/handlers/settings-handlers.ts` 不存在，实际路径分别是 `electron/database/settings.ts`（默认配置 lines 40-58）和 `electron/ipc/settings-handlers.ts`（ALLOWED_SETTINGS_FIELDS lines 10-18）。此外 `electron/ipc/handlers/upload.ts`（lines 73-77）也需要同步添加 `extraction_pptx` 到其加载的 extraction keys 列表中，否则 FileExtractor 拿不到这个设置项。

**OCR 描述修正**：文档提到"云端 OCR"，但项目中没有传统 OCR 引擎（无 Tesseract / PaddleOCR）。所谓"OCR"实际上是多模态 AI 视觉 API 调用（Zhipu/MiMo 的 vision endpoint），由 `SignatureDetector.extractTextFromImage()` 实现（`electron/services/signature-detector.ts` lines 72-87），通过 `visionExtract` 回调注入到 FileExtractor。

**10 字符阈值的适用范围**：该阈值仅在 `extraction_pdf_scanned === 'cloud'` 分支生效（file-extractor.ts line 68）。普通 PDF 提取路径（line 73）不做阈值检查，即使提取结果很短也会返回。

**pptx 库建议修正**：文档建议 `pptx-parser` 或 `mammoth`，但 mammoth 不支持 pptx（只做 docx→html）。项目中已有 `jszip` 依赖（package.json），pptx 本质是 zip 包，可以直接用 jszip 解包后遍历 `ppt/slides/*.xml` 提取文本，无需新增依赖。

---

### S3 审查

**方案方向正确**，有以下修正和补充：

**文件路径修正**：文档引用 `electron/services/extract-structured.ts`，该文件不存在。结构化提取的 prompt 定义在 `electron/prompts/extract-structured.ts`，执行逻辑在 `electron/ipc/handlers/classify.ts`（lines 179-205 的 `extractStructuredDataAsync` 函数）。

**原因2 补充**：`classify.ts` lines 242-244 的 `if (content)` 检查实际上是死代码——lines 223-225 已经在前面做了 `if (!content) return` 的早期退出，到 242 行时 content 一定有值。这个 `if` 可以删除。

**原因5 竞态风险比描述的更严重**：不仅是 `extractStructuredDataAsync` 之间的竞态，实际存在**三条并发的 metadata 写入路径**：
- 路径 A：`mergeKeyInfo()`（classify.ts lines 66-115）——在 handleClassify 中 await
- 路径 B：`extractStructuredDataAsync()`（classify.ts lines 179-205）——fire-and-forget
- 路径 C：`ai:analyze` handler（ai-handlers.ts lines 183-218）——独立触发

当批量分类 CONCURRENCY_LIMIT=3 时，文件 A 的后台路径 B 可能与文件 B 的 await 路径 A 发生竞态，导致 lost update。项目中的 `saveQueue`（database/index.ts line 10）只序列化磁盘写入，不保护内存中的 read-modify-write。

**方案补充**：中期架构改进中第 7 点"metadata 写入加锁"，建议具体方案是在 `electron/ipc/handlers/classify.ts` 中引入一个简单的 promise 队列：`let metadataQueue = Promise.resolve()`，每次 read-modify-write 都 `.then()` 挂上去，保证同一项目的 metadata 操作串行化。不需要引入第三方锁库。

---

### S4 审查

**方案方向正确**，补充两个细节：

**取消按钮的显示条件**：文档正确识别了 BatchActionBar 的 `selectedCount === 0` 问题。建议新按钮不要放在 BatchActionBar 里，而是在 `ProjectHome.tsx` lines 129-136 的 Progress 旁边直接渲染，条件是 `batchClassifying` 为 true。这样两个入口（一键分类 / 批量分类选中）都能触发取消。

**AbortController 方案的可行性**：当前分类的完整调用链是 `前端 aiService → IPC ai:classify → handleClassify → AIProviderInterface.chat() → fetch()`，整条链路都没有 signal 参数（OpenAICompatibleProvider.chat 在 `electron/services/ai-service.ts` line 20 用 fetch 但没传 AbortSignal）。要支持真正的请求中断，需要在 AIProviderInterface 接口（`electron/services/ai-providers/base.ts` line 33）的 `chat()` 方法增加 `signal?: AbortSignal` 参数，然后逐层透传。工作量评估 1-2h 合理，但注意要同时改 OpenAICompatibleProvider 和所有 provider 实现。

**当前 batchCancelledRef 的行为**：它是协作式取消——只在循环迭代间隙检查（handleBatchClassify lines 188/192，handleBatchClassifySelected line 310），已经发出的 AI 请求会跑完。这意味着取消后仍会有 1-3 个请求完成，不是即时中断。

---

### S5 审查

**方案方向正确**，有一个代码层面的重要发现：

**FILENAME_HINTS 常量是死代码**：`electron/constants/classify.ts` 导出了 `FILENAME_HINTS`（9 条规则），但**没有任何文件 import 它**。实际使用的是 `electron/ipc/handlers/classify.ts` lines 23-38 的**内联重复实现** `getFilenameHints()` 函数。两处代码逻辑一致，但维护时容易漏改一处。建议统一到 constants 文件并在 handler 中 import。

**启发式规则是硬覆盖而非兜底**：文件名匹配在 AI 分类之后执行（classify.ts lines 232-237），一旦命中就**无条件替换** AI 结果，而非作为 fallback。这意味着如果 AI 判断正确但文件名也匹配了启发式规则，AI 结果会被覆盖。设计意图是"文件名优先"，但实现上过于激进——建议改为"仅当 AI 置信度低于阈值时才用文件名修正"。

**方案中新增的启发式规则**（SOW → 售前、物料 → 构建）需要同时加在两处：`electron/constants/classify.ts` 的 `FILENAME_HINTS` 和 `electron/ipc/handlers/classify.ts` 的内联 `getFilenameHints()`。或者借机统一为单点维护。

---

### S6 审查

**方案方向正确**，补充一个发现：

**`index.css` 中存在孤立响应式断点**：`src/index.css` lines 112-146 为 `.card-grid-responsive` 定义了 900px / 1200px 两个断点，但**没有任何组件使用这个 class 名**——是死代码。建议不要新增 media query，而是把 `.feature-row` 也挂上 `.card-grid-responsive`，或者直接在 `.feature-row` 上写断点，避免再增加一个孤立的响应式规则。

---

### S7 审查

**方案完全正确**，无补充。pageSize 硬编码为 10（line 278），无 useState、无 onChange，showSizeChanger 渲染了一个不可用的下拉框。按方案修复即可。

---

## 网络验证补充（2026-06-28 搜索验证）

以下针对各方案中涉及的技术选型，通过网络搜索验证了可行性和最新状态。

### S2 补充：pptx 提取库选型修正

原方案建议"引入 `pptx-parser` 或 `mammoth`"，审查意见建议"用已有的 jszip 手动解包"。**两个建议都有更好的选择**：

**推荐方案：`officeparser`（v7.2.2，活跃维护）**

搜索验证发现 [officeparser](https://github.com/harshankur/officeParser) 是目前最成熟的 Node.js Office 文件解析库，支持 docx/pptx/xlsx/odt/odp/ods/pdf/rtf 等全部格式。它的依赖链是 `@xmldom/xmldom`（XML 解析）+ `fflate`（压缩）+ `file-type`（格式检测）+ `pdfjs-dist` + `tesseract.js`。这意味着引入一个库就能同时解决 pptx 支持和 PDF 扫描件 OCR 两个问题。

**对比其他选项**：
- `node-pptx-parser`：基于 jszip + sax，但项目不活跃（2022 年 12 月创建，最后版本 1.1.1），不推荐
- `pptx-text-parser`：同样不活跃，不推荐
- 手动 jszip 解包：技术上可行但需要自己处理 XML 命名空间、slide 排序、shape 文本提取等细节，容易出 bug，投入产出比低

**建议修正**：直接引入 `officeparser`，在 file-extractor.ts 的 switch 中添加 `.pptx` case 调用 `officeParser.parseOffice(fileBuffer)`。同时可以评估是否用 officeparser 替代现有的 pdf-parse 和 mammoth，减少依赖碎片化。

### S2 补充：PDF 扫描件处理方案

当前 pdf-parse v2 对简单文本 PDF 够用，但搜索验证发现：

- **pdf-parse** 对复杂排版（多栏、表格）提取效果差，不支持扫描件 OCR
- **unpdf** 是 2024-2025 年新兴的 TypeScript-first PDF 解析库，支持 layout-aware 模式和 Tesseract OCR 后端，对复杂 PDF 效果明显更好
- **officeparser** 内置 tesseract.js，已经能处理扫描件

**建议**：如果引入 officeparser，可以先用它的 PDF 能力替代 pdf-parse，评估效果。如果 PDF 解析准确率仍不理想，再考虑 unpdf 作为专项替代。不建议自己集成 Tesseract.js——officeparser 和 unpdf 都封装好了。

### S5 补充：LLM 分类 prompt 工程验证

原方案提出优化 prompt 和增加启发式规则。搜索验证发现了几个关键实践：

**1. Few-shot 示例比零描述更有效，但要控制数量**

[arXiv 2025 论文](https://arxiv.org/html/2509.13196v1) "The Few-shot Dilemma" 的核心发现：
- 对 8B 参数以上的模型，few-shot（给 2-3 个示例）比纯指令描述的分类准确率更高
- 但示例过多会**降低**准确率（over-prompting 效应），尤其是对中小模型
- **8B 参数是 few-shot 效果的临界点**——低于这个规模的模型容易被长 prompt 干扰
- TF-IDF 筛选示例比随机选择示例效果更好

**对当前方案的启示**：当前 classify prompt 是纯零指令（只描述规则，不给示例文件）。建议在 prompt 中加入 2-3 个典型文件的分类示例（如 SOW → 售前/销售方案、验收确认单 → 验收），但不要加太多。这比单纯增加规则描述更有效。

**2. 文件名作为上下文注入 prompt**

当前实现是在代码层面用启发式规则硬覆盖 AI 结果。更好的做法是把文件名作为分类上下文注入 prompt，让 AI 自己综合判断。例如在 prompt 开头加一行：`文件名：{filename}`，然后在规则中说明"当文件名明确指示用途时，优先按文件名判断"（当前 prompt 已有类似指引，但文件名没有显式注入到 JSON 输入中）。

**3. 启发式规则应从硬覆盖改为置信度门控**

搜索验证的最佳实践是：先用 AI 分类，如果置信度（confidence）低于阈值（如 0.7），再用启发式规则修正。当前实现是无条件覆盖，建议改为门控模式。这与代码审查意见一致。

### S3 补充：metadata 并发写入方案验证

审查意见建议用 promise 队列串行化。搜索验证确认这是 JavaScript 中最轻量的方案：

**方案 A：Promise 队列（推荐，零依赖）**
```typescript
// 在 classify.ts 顶部
let metadataQueue: Promise<void> = Promise.resolve()

// 每次 metadata 操作
metadataQueue = metadataQueue.then(async () => {
  const project = projectDb.getProject(projectId)
  const meta = JSON.parse(project.metadata)
  // ... merge ...
  projectDb.updateProject(projectId, { metadata: JSON.stringify(meta) })
})
```

**方案 B：async-mutex 库**
- [async-mutex](https://www.npmjs.com/package/async-mutex) 是 Node.js 最成熟的异步互斥库
- 提供 `Mutex`、`Semaphore`、`RWLock` 等原语
- 对于当前场景（单一资源的 read-modify-write），promise 队列已经够用，不需要引入新依赖

**建议**：先用方案 A（promise 队列），如果后续并发场景变多再考虑 async-mutex。

### 实施顺序修正

基于网络验证结果，建议调整 S8 的实施顺序：

```
1. S6 + S7（CSS + 分页，30min，快速见效，独立修复）
2. S2（引入 officeparser 同时解决 pptx + PDF 扫描件，2-3h）
3. S5（prompt 优化 + few-shot 示例 + 启发式规则统一，2-3h）
   └── 依赖 S2：pptx/PDF 能提取文本后，重新测试分类准确率
4. S4（取消按钮 + AbortController，1-2h，独立修复）
5. S3（结构化提取 prompt + metadata 队列，3-4h）
```

S2 和 S5 之间的依赖关系比原方案更紧密——引入 officeparser 后需要重跑分类测试，才能确定 prompt 优化的优先级和方向。
