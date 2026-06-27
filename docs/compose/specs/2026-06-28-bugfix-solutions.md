# 真实文件测试 - 问题排查与解决方案

> 2026-06-28 | 基于0628测试项目（19个真实文件）的测试结果

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
