# 真实文件测试 Bugfix 修复计划

> 2026-06-28 | 基于 qoder 审查 + 网络验证后的方案

---

## 阶段一：快速修复（30min）

### F1: S6 卡片宽度撑开
- 文件：`src/styles/overrides.css`、`src/components/ProjectHome/ProjectHome.tsx`
- 改动：
  - `.feature-card` 添加 `min-width: 0; overflow: hidden;`
  - `.feature-row` 添加响应式断点（复用已有的 `.card-grid-responsive` class 或直接写断点）
  - `.fc-title` / `.fc-subtitle` 添加文字截断
  - ProjectHome 内容区添加 `overflowX: 'hidden'`
- 测试：调整浏览器宽度验证卡片布局

### F2: S7 分页选择器
- 文件：`src/components/ProjectHome/FileListTable.tsx`
- 改动：
  - import 添加 `useState`
  - 添加 `const [pageSize, setPageSize] = useState(10)`
  - pagination 添加 `onChange: (page, size) => setPageSize(size)`
- 测试：点击每页条数下拉框验证切换生效

---

## 阶段二：pptx 支持（2-3h）

### F3: S2 引入 jszip 解析 pptx
- 文件：`electron/services/file-extractor.ts`
- 方案（qoder 审查确认）：
  - 不引入新库，用已有的 `jszip` 解包 pptx
  - pptx 本质是 zip，解包后遍历 `ppt/slides/*.xml` 提取文本
  - 添加 `.ppt`/`.pptx` case 到 switch
  - 实现 `extractPptx()` 方法
- 测试：上传 pptx 文件验证内容提取

---

## 阶段三：prompt 优化 + 启发式统一（2-3h）

### F4: S5 分类准确率优化
- 文件：`electron/prompts/classify.ts`、`electron/ipc/handlers/classify.ts`、`electron/constants/classify.ts`
- 改动：
  - classify prompt 添加 2-3 个 few-shot 示例（SOW→售前、验收确认单→验收）
  - 文件名作为上下文注入 prompt（`文件名：{filename}`）
  - 统一 `FILENAME_HINTS`：删除 classify.ts 内联版本，改为 import constants
  - 启发式规则从硬覆盖改为置信度门控（AI 返回 confidence < 0.7 时才用文件名修正）
- 测试：重新分类 0628 测试项目，对比准确率

---

## 阶段四：取消按钮（1-2h）

### F5: S4 批量分类取消
- 文件：`src/components/ProjectHome/ProjectHome.tsx`
- 改动：
  - 在 Progress 旁边添加取消按钮（`batchClassifying` 为 true 时显示）
  - 点击调用 `handleCancelBatchClassify`
- 测试：一键分类过程中点取消验证中断

---

## 阶段五：结构化提取（3-4h）

### F6: S3 结构化数据提取修复
- 文件：`electron/prompts/extract-structured.ts`、`electron/ipc/handlers/classify.ts`
- 改动：
  - 优化 extract prompt：放宽提取规则、增加同义词、按文件类型给指引
  - 添加内容截断（取前 4000 字符）
  - metadata 写入引入 promise 队列串行化
  - 删除 classify.ts:242 的死代码 `if (content)`
- 测试：分类后检查 metadata 中 requirements/key_issues/opportunities 是否有数据

---

## 验证清单

全部完成后：
1. 重新上传 0628 测试项目的 20 个文件
2. 对比分类准确率（目标 > 80%）
3. 检查卡片数据是否填充
4. 验证取消按钮、分页选择器、卡片布局
5. 运行全量测试确保无回归
