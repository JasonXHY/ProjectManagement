# G5 — CSV + 图片内容提取

> 关联需求：F02.1（支持类型 CSV/PNG/JPG + 上传后自动提取内容）
> 依赖：无（独立）
> 阻塞：无
> 优先级：P2

## 背景

F02.1 列出支持类型含 CSV、PNG、JPG，且要求上传后自动提取内容供 AI 分析。当前 `electron/services/file-extractor.ts:63` 对 csv 与图片走 `default → return null`，导致这些文件无法被基于内容的 AI 分类。

## Scope

### 包含
1. `file-extractor.ts` 增加 `.csv` 分支：按文本读取并做基本的 CSV→文本规整（可复用现有 txt 读取 + 简单分隔处理）。
2. 图片（png/jpg/jpeg）内容提取：调用多模态 AI（复用 `signature-detector` / provider 的 vision 能力）做 OCR/描述，产出可供分析的文本；无可用 vision provider 时**优雅降级**（返回空而非抛错），并记录日志。
3. 与上传流程衔接：`file-handlers.ts` 上传后提取逻辑对新类型生效。

### 不包含
- 高精度 OCR 引擎集成（用现有多模态 provider 即可）。
- 扫描版 PDF 的额外处理（已有 pdfToImage 路径）。

## 成功标准
- [ ] 上传 CSV 后 `content_extracted` 非空且为可读文本
- [ ] 上传图片后，在配置了 vision provider 时 `content_extracted` 含识别文本；未配置时不报错、内容为空并记录日志
- [ ] `file-extractor` 对未知类型仍返回 null（不回归）
- [ ] 单测：CSV 提取产出文本；图片分支在无 provider 时返回空且不抛错（mock provider）
- [ ] G10 E2E：上传仓库内 `src/__tests__/test-data/test.txt`/`test.xlsx` 同级新增一个 csv 样本 → 断言提取非空

## 验证命令
```bash
(cd electron && npx tsc) && npm test
```
