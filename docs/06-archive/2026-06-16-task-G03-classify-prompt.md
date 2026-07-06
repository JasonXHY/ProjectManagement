# G3 — 分类 Prompt 支持子分类 + 待签/已签

> **状态：✅ 完成（TDD，commit `b43411e`，分支 feat/v3.1-subcategories-and-fixes）**

> 关联需求：F03.3、F03.1、§1.1
> 依赖：G1
> 阻塞：G10
> 优先级：P1

## 背景

F03.3 要求分类 Prompt 让 AI 同时判断：(1) 文件属于哪个阶段 (2) 属于该阶段的哪个子分类；验收阶段额外判断待签 vs 已签；会议纪要按内容关键词归属阶段。当前 `electron/prompts/classify.ts` 只列 10 个阶段，无子分类、无待签/已签、无会议纪要规则。

## Scope

### 包含
1. 改写 `electron/prompts/classify.ts`：在 prompt 中嵌入 G1 的阶段+子分类清单，要求 AI 返回结构化 JSON，含 `stage`、`subcategory`（验收时含状态待签/已签）。
2. `electron/ipc/ai-handlers.ts` 的 `ai:classify`：解析并持久化 `subcategory`；移动文件到 `阶段/子分类/` 目录（与 G2 结构一致）。
3. `electron/utils/ai-response.ts` 的 `parseClassifyResponse`：扩展解析 `subcategory` 字段，保持对旧格式（仅 category）的向后兼容回退。
4. DB `files` 表增加 `subcategory` 字段（迁移 + 默认 null），更新 `files.ts` 读写白名单。
5. 自定义 prompt（`classify_prompt_stages`）仍优先生效。

### 不包含
- 子分类管理 UI（G4）；手动选择子分类（G6）。
- 会议纪要的高级语义判断——只需在 prompt 中给出"按会议内容关键词判断阶段"的指引即可。

## 成功标准
- [ ] `classify.ts` prompt 含全部阶段子分类清单 + 待签/已签 + 会议纪要规则
- [ ] `ai:classify` 返回并存储 `subcategory`，文件移动到正确的 `阶段/子分类/` 目录
- [ ] `parseClassifyResponse` 能解析含 `subcategory` 的 JSON，且旧格式仍回退正常（扩展现有 `ai-response.test.ts`）
- [ ] `files` 表 `subcategory` 字段迁移生效，重启后保留
- [ ] 单测：`parseClassifyResponse` 子分类解析 + 向后兼容；移动失败仍返回 `{success:false, code:'MOVE_FAILED'}`（沿用 B3 修复约定）
- [ ] G10 中有 E2E 用例：分类一个含已知内容的文件 → 断言 DB `subcategory` 与磁盘路径

## 验证命令
```bash
(cd electron && npx tsc) && npm test
```
