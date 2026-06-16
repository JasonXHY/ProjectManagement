# G1 — 子分类数据模型

> **状态：✅ 完成（TDD，commit `54f138c`，分支 feat/v3.1-subcategories-and-fixes）**

> 关联需求：业务需求 v3.1 §1.1、F04.2
> 依赖：无（基础任务）
> 阻塞：G2、G3、G4、G6、G10
> 优先级：P0（最高，先做）

## 背景

v3.1 引入「子分类」体系：10 个文件分类阶段，每个阶段下有 3–7 个子分类（按文档用途划分，见 §1.1 表格）。当前代码 `electron/shared/stages.ts` 只有一个扁平的 10 字符串数组，子分类在全代码库 0 命中。本任务建立单一数据源的数据模型，供后续所有子分类相关功能复用。

## Scope

### 包含
1. 在 `electron/shared/stages.ts` 定义带子分类的结构，例如：
   ```ts
   export interface StageDef { name: string; subcategories: string[] }
   export const FILE_CLASSIFICATION_STAGES_V2: StageDef[] = [
     { name: '售前', subcategories: ['销售方案','报价单','合同原件','客户沟通','成本评估','POC材料'] },
     { name: '启动', subcategories: ['项目章程','团队组建','启动会议'] },
     // ... 按 §1.1 表格完整填充 10 个阶段
   ]
   ```
2. 子分类默认值**严格对照** v3.1 §1.1 子分类表（含验收阶段的「验收材料待签」「验收签字件已签」）。
3. 保留/兼容现有 `FILE_CLASSIFICATION_STAGES`（扁平字符串数组）作为派生导出（`.map(s => s.name)`），避免破坏现有引用。
4. 在 `src/types/index.ts` 重导出新结构，renderer 经 `../../electron/shared/stages` 使用，保持前后端单一数据源。
5. 为 `StageDef` 与默认值写单元测试（纯函数级）：阶段数=10、每阶段子分类数在 3–7、验收含待签/已签、无重复。

### 不包含
- 文件夹创建（G2）、prompt（G3）、UI（G4/G6）——本任务只交付数据与类型。
- 用户自定义子分类的持久化（G4 负责 settings 读写）。

## 成功标准
- [ ] `electron/shared/stages.ts` 导出 `StageDef` 与含子分类的默认结构，10 个阶段全部对照 §1.1 填充正确
- [ ] 验收阶段子分类包含「验收材料待签」与「验收签字件已签」
- [ ] 旧 `FILE_CLASSIFICATION_STAGES` 仍可用（派生），现有引用零改动
- [ ] `src/types` 重导出可用，renderer 与 electron 共用同一定义
- [ ] 新增单测覆盖：阶段数、子分类数区间、待签/已签存在、唯一性
- [ ] `npm run typecheck` + `cd electron && npx tsc` + `npm test` 全绿，无新增 lint error

## 验证命令
```bash
npm run typecheck && (cd electron && npx tsc) && npm test
```
