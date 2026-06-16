# G9 — 补全 AI 供应商（零一万物）

> **状态：✅ 完成（TDD，commit `4b0b486`，分支 feat/v3.1-subcategories-and-fixes）**

> 关联需求：F10.1
> 依赖：无（独立）
> 阻塞：G10
> 优先级：P3

## 背景

F10.1 要求支持 11+ 厂商，明确点名含"零一万物"。当前 `electron/shared/model-registry.ts` 有 10 家（小米、智谱、阿里、腾讯、百度、DeepSeek、月之暗面、讯飞、百川、MiniMax）+ custom，**缺零一万物（01.ai / Yi）**。

## Scope

### 包含
1. `electron/shared/model-registry.ts` 增加「零一万物」供应商条目：id、name、baseUrl、模型列表（如 yi-large、yi-medium 等）、isFree 标记、计费模式。
2. 校验 `src/types/index.ts` 的 `AIProvider` 联合类型包含对应 id（如 `lingyiwanwu`）。
3. 确认设置页供应商下拉自动反映（数据驱动，无需额外改 UI）。

### 不包含
- 真实 API 联调（仅注册表与类型）。

## 成功标准
- [ ] 供应商注册表含零一万物，模型列表非空，URL 正确
- [ ] `AIProvider` 类型含其 id，typecheck 通过
- [ ] 设置页供应商下拉出现「零一万物」（数据驱动）
- [ ] 单测：注册表厂商数 ≥ 11（含 custom）且含零一万物
- [ ] `npm run typecheck && (cd electron && npx tsc) && npm test` 全绿

## 验证命令
```bash
npm run typecheck && (cd electron && npx tsc) && npm test
```
