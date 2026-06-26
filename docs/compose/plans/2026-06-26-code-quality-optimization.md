# PMAer 代码质量优化方案

> 版本：v1.0 | 创建时间：2026-06-26 | 状态：待Qoder审核

---

## 一、问题总览

| 严重级别 | 数量 | 说明 |
|----------|------|------|
| 🔴 Critical | 3 | 崩溃风险、超长函数 |
| 🟠 Important | 12 | 类型安全、错误处理、代码重复 |
| 🟡 Minor | 9 | 样式规范、未使用代码 |
| **总计** | **24** | 影响约30个文件 |

---

## 二、Critical 问题（必须修复）

### C1: 前端组件JSON.parse未加保护
**位置**：7个卡片组件（EvaluationCard、ContractCard、IssueCard等）
**问题**：`JSON.parse(project.metadata)` 无try-catch，metadata损坏时UI崩溃
**方案**：提取共享工具函数 `parseMetadata()`

```typescript
// src/utils/metadata.ts（新增）
export function parseMetadata(metadata: string | null): Record<string, unknown> {
  if (!metadata) return {}
  try { return JSON.parse(metadata) } catch { return {} }
}
```

**影响文件**：7个组件 + 6个后端位置

### C2: ai:classify handler过长（215行）
**位置**：`electron/ipc/ai-handlers.ts:129-346`
**问题**：混合了验证、AI调用、元数据合并、文件移动、结构化提取
**方案**：拆分为5个子函数

```typescript
// electron/ipc/handlers/classify.ts（新增）
export async function handleClassify(fileId: number, categoryType?: string) {
  const file = validateAndGetFile(fileId)
  const { category, subcategory, stage, summary, keyInfo } = await classifyWithAI(file, categoryType)
  await mergeKeyInfo(file.project_id, keyInfo)
  await moveFileToCategory(file, category, subcategory)
  await extractStructuredData(file, category)
  await checkStageProgression(file.project_id, stage)
  return { category, subcategory, stage, summary }
}
```

### C3: file:upload handler过长（195行）
**位置**：`electron/ipc/file-handlers.ts:67-265`
**问题**：文件I/O、内容提取、DB创建、AI分类、阶段推进混在一起
**方案**：拆分为子函数

```typescript
// electron/ipc/handlers/upload.ts（新增）
export async function handleUpload(projectId: number, fileData: FileUploadData) {
  const { id, filePath } = await saveFileToDisk(projectId, fileData)
  const content = await extractContent(filePath, fileData.type)
  await createFileRecord(projectId, id, fileData.name, content)
  classifyAsync(projectId, id, filePath, fileData.name, content) // fire-and-forget
  return { success: true, data: id }
}
```

---

## 三、Important 问题（应该修复）

### I4: metadata解析模式重复15+次
**位置**：前端7组件 + 后端6位置
**问题**：`X.metadata ? JSON.parse(X.metadata) : {}` 到处复制
**方案**：统一使用C1的`parseMetadata()`工具函数

### I5: 静默吞掉异步错误
**位置**：`file-handlers.ts:243`、`ai-handlers.ts:286`
**问题**：`.catch(() => {})` 丢弃所有错误
**方案**：至少添加console.warn

```typescript
.catch(err => console.warn('[结构化提取] 异步失败:', err.message))
```

### I6: 数据库层10个空catch块
**位置**：`electron/database/index.ts`（10处）
**问题**：DB写入失败无日志
**方案**：添加console.error + 错误计数

### I7: Props接口使用any类型
**位置**：IssueCard、RequirementCard、OpportunityCard、EvaluationCard
**问题**：`project: any` 而非 `Project` 类型
**方案**：统一使用 `Project` 类型

```typescript
// 修复前
interface Props { project: any; allFiles: any[] }
// 修复后
interface Props { project: Project; allFiles: FileRecord[] }
```

### I8: HandoverService类型弱化
**位置**：`electron/services/handover-service.ts`
**问题**：`ai_key_info: any`、`previewHandover`返回`Promise<any>`
**方案**：定义具体接口

### I9: 双重类型转换绕过检查
**位置**：`electron/ipc/project-handlers.ts:140`
**问题**：`data as unknown as Partial<projectDb.Project>`
**方案**：使用类型守卫或Zod验证

### I10: 验证代码重复71次
**位置**：ai-handlers.ts、file-handlers.ts、project-handlers.ts
**问题**：每个handler重复`validateRequired` + `validateType` + `validateProjectExists`
**方案**：提取`validateProjectId()`助手

```typescript
// electron/utils/validators.ts（新增）
export function validateProjectId(projectId: unknown): { valid: boolean; id?: number; error?: string } {
  const req = validateRequired(projectId, 'projectId')
  if (!req.valid) return req
  const type = validateType(projectId, 'number', 'projectId')
  if (!type.valid) return type
  const exists = validateProjectExists(projectId as number)
  if (!exists.valid) return exists
  return { valid: true, id: projectId as number }
}
```

### I11: 不安全的error类型转换
**位置**：ChatWindow.tsx:179、projectHome.hooks.ts:429
**问题**：`(result.error as any).message`
**方案**：使用类型守卫

### I12: Markdown模板重复
**位置**：ai-handlers.ts（2处）
**问题**：相同的8字段表格模板复制
**方案**：提取为共享函数

### I13: 文件读取失败返回空字符串
**位置**：ai-handlers.ts:183、mimo.ts:42
**问题**：`.catch(() => '')` 导致空内容被分类
**方案**：返回null + 跳过分类

### I14: Milestone解析重复
**位置**：ContractCard.tsx、ContractDetailModal.tsx
**问题**：相同的milestone JSON解析代码
**方案**：提取`parseMilestones()`工具函数

### I15: 路径解析重复
**位置**：file-handlers.ts、ai-handlers.ts、project-handlers.ts（6处）
**问题**：`resolveProjectPathForProject` + fallback模式
**方案**：提取`getProjectPathOrThrow()`助手

---

## 四、Minor 问题（可以修复）

### M16: formatAmount重复4次
**方案**：提取到`src/utils/format.ts`

### M17: 阶段列表硬编码两处
**方案**：统一从`stages.ts`读取

### M18: 文件名启发式规则硬编码
**方案**：提取为常量配置

### M19: 内联样式使用原始hex颜色
**方案**：迁移到CSS变量

### M20: fs.access反模式
**方案**：使用`fs.stat`或`pathExists()`

### M21: console.log调试输出
**方案**：移除或改为结构化日志

### M22: allFiles参数未使用
**方案**：移除未使用参数

### M23: _onBack未使用
**方案**：移除

### M24: localhost:1234硬编码
**方案**：改为环境变量

---

## 五、实施计划

### Phase 1: 基础工具提取（影响最大）
**目标**：提取共享工具，一次性解决C1+I4+I14+I15
**文件**：
- 新增 `src/utils/metadata.ts` — parseMetadata()
- 新增 `src/utils/format.ts` — formatAmount()
- 新增 `src/utils/milestones.ts` — parseMilestones()
- 新增 `electron/utils/project-helpers.ts` — getProjectPathOrThrow()

**测试**：每个工具函数3-5个测试
**预估**：+15测试，~200行新代码

### Phase 2: Handler拆分（解决C2+C3）
**目标**：将ai:classify和file:upload拆分为子函数
**文件**：
- 新增 `electron/ipc/handlers/classify.ts`
- 新增 `electron/ipc/handlers/upload.ts`
- 重构 `electron/ipc/ai-handlers.ts`
- 重构 `electron/ipc/file-handlers.ts`

**测试**：集成测试验证拆分后行为不变
**预估**：~500行重构，测试数不变

### Phase 3: 类型安全（解决I7+I8+I9+I11）
**目标**：消除any类型，增强类型检查
**文件**：
- 修改 4个卡片组件Props接口
- 修改 handover-service.ts
- 修改 project-handlers.ts
- 修改 ChatWindow.tsx、projectHome.hooks.ts

**测试**：确保类型修改不影响运行时行为
**预估**：~100行修改

### Phase 4: 错误处理（解决I5+I6+I13）
**目标**：统一错误处理策略
**文件**：
- 修改 file-handlers.ts、ai-handlers.ts
- 修改 electron/database/index.ts

**测试**：验证错误场景正确处理
**预估**：~50行修改

### Phase 5: 验证简化（解决I10）
**目标**：提取validateProjectId()，减少71处重复
**文件**：
- 新增 `electron/utils/validators.ts`（扩展）
- 修改 3个handler文件

**测试**：验证简化后校验行为不变
**预估**：-200行，+10测试

### Phase 6: Minor清理（M16-M24）
**目标**：代码风格统一
**文件**：约15个文件
**预估**：~100行修改

---

## 六、预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| Critical问题 | 3 | 0 |
| Important问题 | 12 | 0 |
| Minor问题 | 9 | 0 |
| 最长handler行数 | 215行 | <80行 |
| metadata解析位置 | 15+处重复 | 1处工具函数 |
| any类型使用 | 18处 | 0处 |
| 空catch块 | 10处 | 0处 |
| 新增测试 | — | +25测试 |

---

## 七、风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 拆分handler引入回归 | 中 | 高 | 拆分前后运行全量测试对比 |
| 类型修改导致编译错误 | 低 | 中 | 逐步修改，每步验证编译 |
| 工具函数接口设计不当 | 低 | 中 | 先写测试定义接口 |
| 过度重构影响进度 | 中 | 中 | 分Phase执行，每Phase独立可交付 |

---

## 八、优先级建议

**立即执行**：Phase 1（基础工具提取）— 投入小收益大
**本周执行**：Phase 2+3（Handler拆分+类型安全）
**下周执行**：Phase 4+5+6（错误处理+验证简化+清理）

---

## 九、参考

- 扫描工具：静态代码分析
- 代码规范：项目现有ESLint配置
- 测试框架：Vitest + @testing-library/react

---

## 十、Qoder 审核意见（2026-06-26）

**总体评价**：方案分析质量高，问题定位准确，可以执行。但以下 4 点必须调整，否则可能引入新问题。

### 调整 1：Phase 执行顺序必须调整

**当前顺序**：Phase 1 → Phase 2（拆 handler）→ Phase 3 → Phase 4（错误处理）→ Phase 5 → Phase 6

**问题**：拆 handler（Phase 2）过程中会大量接触 JSON.parse 和空 catch 块。如果错误处理还没修（Phase 4 才做），拆分过程本身可能引入新 bug——把原本"侥幸没出问题"的静默吞错拆到新的子函数里，更难追踪。

**调整后顺序**：
1. Phase 1（基础工具提取）— 不变
2. **Phase 4（错误处理）** — 提前到第二步，先堵住漏洞
3. Phase 2（Handler 拆分）— 在已有安全基础上拆分
4. Phase 3（类型安全）— 不变
5. Phase 5（验证简化）— 不变
6. Phase 6（Minor 清理）— 不变

### 调整 2：`electron/utils/validators.ts` 已存在，不要新建

**问题**：方案 Phase 5 写的是"新增 `electron/utils/validators.ts`"，但该文件已存在（89 行），包含 `validateRequired`、`validateType`、`validateProjectExists`、`validateFileExists` 等基础函数。

**修正**：Phase 5 应改为"在现有 `electron/utils/validators.ts` 中**追加**组合函数 `validateProjectId()`"，不是新建文件。

### 调整 3：Handler 拆分时注意文件路径时序

**问题**：方案 C2 伪代码中：
```typescript
await moveFileToCategory(file, category, subcategory)  // 文件已移动到新路径
await extractStructuredData(file, category)  // file 对象里的路径还是旧路径！
```

当前代码里，结构化提取是在文件移动**之前**以 fire-and-forget 方式发起的。拆分后如果改成"先移动再提取"，`file` 对象的路径已是旧路径，读文件会失败。

**修正**：
- 方案 A：保持原顺序——先发起结构化提取（fire-and-forget），再移动文件。提取时文件还在原路径。
- 方案 B：如果一定要先移动再提取，必须用移动后的新路径构造 file 对象。
- **无论哪种方案**，fire-and-forget 必须加 `.catch(err => console.warn('[结构化提取] 异步失败:', err.message))`，不能继续保持 `.catch(() => {})`。

### 调整 4：`parseMetadata()` 解析失败时应打日志

**问题**：方案 C1 的 `parseMetadata()` 解析失败时静默返回 `{}`。如果 metadata 真的损坏了，所有调用方都拿到空对象，没有任何提示，排查问题极其困难。

**修正**：
```typescript
export function parseMetadata(metadata: string | null): Record<string, unknown> {
  if (!metadata) return {}
  try { return JSON.parse(metadata) } catch (e) {
    console.warn('[parseMetadata] JSON 解析失败，返回空对象:', (e as Error).message)
    return {}
  }
}
```

### 补充说明

1. **`electron/utils/structured-merge.ts` 已存在**：里面有 metadata 合并逻辑。方案 I12（Markdown 模板重复）提取共享函数时，先看这个文件有没有现成实现，避免重复造轮子。

2. **`FeatureCards.tsx` handover 分组已实现**：mimo 已经完成了转客户成功的独立分组（签字追踪 + 拓展商机 + 交付物清单），不需要再做。

3. **I13 调用链检查**：方案说"文件读取失败返回 null + 跳过分类"，方向正确。但需要确保调用链上所有位置都检查了 null，特别是 `ai-handlers.ts` 和 `file-handlers.ts` 中的多处文件读取点。

4. **unsafe JSON.parse 实际数量**：方案说 7 个卡片组件无保护，实际验证结果是 **12 处**（7 个卡片组件 + ContractDetailModal + ProfitCalculatorModal + 后端 5 处），影响范围比方案描述更大，Phase 1 的优先级更高。
