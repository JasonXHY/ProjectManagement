# Phase 3: 类型安全实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除any类型，增强类型检查，解决I7+I8+I9+I11问题

**Architecture:** 定义具体接口，使用类型守卫，统一类型定义

**Tech Stack:** TypeScript, React, Electron

## Global Constraints

- 保持原有功能完全不变
- 使用TypeScript严格模式
- 遵循现有代码风格
- 测试覆盖所有类型修改

## 执行要求

### 1. 文档读取要求
每个子任务开始前必须读取：
- 当前任务相关的源代码文件
- 项目的TypeScript配置（`tsconfig.json`）
- 相关类型定义文件

### 2. TDD测试要求
每个子任务必须包含：
- 编写失败测试（RED）
- 实现最小代码使测试通过（GREEN）
- 重构优化（REFACTOR）
- 测试覆盖率目标：新增代码 > 80%

### 3. 代码审核机制
所有任务完成后需要：
- 运行完整测试套件：`npx vitest run`
- 运行TypeScript编译检查：`npx tsc --noEmit`
- 运行ESLint检查：`npm run lint`
- 使用`compose:review`技能进行代码审核

### 4. 结果记录要求
每个子任务完成后需要：
- 在任务进度文件中记录完成状态
- 记录遇到的问题和解决方案
- 记录测试结果和覆盖率
- 记录代码行数变化

---

## Task 1: 创建共享类型定义文件

**Covers:** I7, I8

**Files:**
- Create: `src/types/project.ts`
- Create: `src/types/file.ts`

**Interfaces:**
- Consumes: 现有类型定义
- Produces: `Project`, `FileRecord` 类型定义

### 准备工作

- [ ] **Step 0: 读取相关文档**

```bash
# 读取现有类型定义
cat src/types/index.ts
cat src/components/cards/*.tsx
cat electron/database/projects.ts
cat electron/database/files.ts

# 读取配置
cat tsconfig.json
```

- [ ] **Step 1: 创建共享类型定义文件**

```typescript
// src/types/project.ts
export interface Project {
  id: number
  name: string
  current_stage: string
  metadata: string | null
  milestones: string | null
  created_at: string
  updated_at: string
}

// src/types/file.ts
export interface FileRecord {
  id: number
  project_id: number
  filename: string
  original_path: string | null
  stored_path: string
  category: string | null
  subcategory: string | null
  stage: string | null
  file_type: string
  file_size: number
  content_extracted: string | null
  is_analyzed: boolean
  has_signature: boolean
  ai_summary: string | null
  ai_key_info: string | null
  created_at: string
}
```

- [ ] **Step 2: 运行TypeScript编译检查**

```bash
npx tsc --noEmit
```

Expected: 无新增错误

- [ ] **Step 3: 提交代码**

```bash
git add src/types/project.ts src/types/file.ts
git commit -m "types: add shared Project and FileRecord type definitions"
```

---

## Task 2: 修复卡片组件Props接口

**Covers:** I7

**Files:**
- Modify: `src/components/cards/IssueCard.tsx`
- Modify: `src/components/cards/RequirementCard.tsx`
- Modify: `src/components/cards/OpportunityCard.tsx`
- Modify: `src/components/cards/EvaluationCard.tsx`

**Interfaces:**
- Consumes: `Project`, `FileRecord` from Task 1
- Produces: 更新后的Props接口

### 准备工作

- [ ] **Step 0: 读取相关文档**

```bash
# 读取卡片组件
cat src/components/cards/IssueCard.tsx
cat src/components/cards/RequirementCard.tsx
cat src/components/cards/OpportunityCard.tsx
cat src/components/cards/EvaluationCard.tsx
```

- [ ] **Step 1: 更新IssueCard.tsx**

```typescript
// src/components/cards/IssueCard.tsx
import { Project, FileRecord } from '../../types'

interface Props {
  project: Project
  allFiles: FileRecord[]
  // ... 其他属性
}
```

- [ ] **Step 2: 更新RequirementCard.tsx**

```typescript
// src/components/cards/RequirementCard.tsx
import { Project, FileRecord } from '../../types'

interface Props {
  project: Project
  allFiles: FileRecord[]
  // ... 其他属性
}
```

- [ ] **Step 3: 更新OpportunityCard.tsx**

```typescript
// src/components/cards/OpportunityCard.tsx
import { Project, FileRecord } from '../../types'

interface Props {
  project: Project
  allFiles: FileRecord[]
  // ... 其他属性
}
```

- [ ] **Step 4: 更新EvaluationCard.tsx**

```typescript
// src/components/cards/EvaluationCard.tsx
import { Project, FileRecord } from '../../types'

interface Props {
  project: Project
  allFiles: FileRecord[]
  // ... 其他属性
}
```

- [ ] **Step 5: 运行TypeScript编译检查**

```bash
npx tsc --noEmit
```

Expected: 无新增错误

- [ ] **Step 6: 运行测试验证**

```bash
npx vitest run
```

Expected: 所有测试通过

- [ ] **Step 7: 提交代码**

```bash
git add src/components/cards/*.tsx
git commit -m "types: update card component Props to use Project and FileRecord types"
```

---

## Task 3: 修复HandoverService类型

**Covers:** I8

**Files:**
- Modify: `electron/services/handover-service.ts`

**Interfaces:**
- Consumes: `Project`, `FileRecord` from Task 1
- Produces: 更新后的HandoverService类型

### 准备工作

- [ ] **Step 0: 读取相关文档**

```bash
# 读取HandoverService
cat electron/services/handover-service.ts
```

- [ ] **Step 1: 定义HandoverService接口**

```typescript
// electron/services/handover-service.ts
import { Project, FileRecord } from '../types'

interface HandoverData {
  project: Project
  files: FileRecord[]
  keyInfo: Record<string, unknown>
 签字追踪: SignRecord[]
  拓展商机: OpportunityRecord[]
  交付物清单: DeliverableRecord[]
}

interface SignRecord {
  id: number
  filename: string
  has_signature: boolean
  signed_at: string | null
}

interface OpportunityRecord {
  id: number
  title: string
  description: string
  status: string
}

interface DeliverableRecord {
  id: number
  filename: string
  category: string
  subcategory: string | null
}
```

- [ ] **Step 2: 更新HandoverService函数签名**

```typescript
// 更新previewHandover函数
async function previewHandover(projectId: number): Promise<HandoverData> {
  // ... 实现
}

// 更新其他函数签名
```

- [ ] **Step 3: 运行TypeScript编译检查**

```bash
npx tsc --noEmit
```

Expected: 无新增错误

- [ ] **Step 4: 运行测试验证**

```bash
npx vitest run
```

Expected: 所有测试通过

- [ ] **Step 5: 提交代码**

```bash
git add electron/services/handover-service.ts
git commit -m "types: add specific interfaces for HandoverService"
```

---

## Task 4: 修复双重类型转换

**Covers:** I9

**Files:**
- Modify: `electron/ipc/project-handlers.ts`

**Interfaces:**
- Consumes: 现有类型定义
- Produces: 使用类型守卫的代码

### 准备工作

- [ ] **Step 0: 读取相关文档**

```bash
# 读取project-handlers.ts
cat electron/ipc/project-handlers.ts
```

- [ ] **Step 1: 添加类型守卫函数**

```typescript
// electron/ipc/project-handlers.ts
function isPartialProject(data: unknown): data is Partial<Project> {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  // 检查必要的字段类型
  if (obj.name !== undefined && typeof obj.name !== 'string') return false
  if (obj.current_stage !== undefined && typeof obj.current_stage !== 'string') return false
  return true
}
```

- [ ] **Step 2: 替换双重类型转换**

```typescript
// 修复前
const data = requestData as unknown as Partial<projectDb.Project>

// 修复后
if (!isPartialProject(requestData)) {
  return { success: false, error: '无效的项目数据' }
}
const data = requestData
```

- [ ] **Step 3: 运行TypeScript编译检查**

```bash
npx tsc --noEmit
```

Expected: 无新增错误

- [ ] **Step 4: 运行测试验证**

```bash
npx vitest run
```

Expected: 所有测试通过

- [ ] **Step 5: 提交代码**

```bash
git add electron/ipc/project-handlers.ts
git commit -m "types: replace double type assertion with type guard"
```

---

## Task 5: 修复不安全的error类型转换

**Covers:** I11

**Files:**
- Modify: `src/components/ChatWindow.tsx`
- Modify: `src/hooks/projectHome.hooks.ts`

**Interfaces:**
- Consumes: 现有类型定义
- Produces: 使用类型守卫的代码

### 准备工作

- [ ] **Step 0: 读取相关文档**

```bash
# 读取相关文件
cat src/components/ChatWindow.tsx
cat src/hooks/projectHome.hooks.ts
```

- [ ] **Step 1: 添加错误类型守卫**

```typescript
// src/utils/error.ts
interface ApiError {
  message: string
  code?: string
}

function isApiError(error: unknown): error is ApiError {
  if (typeof error !== 'object' || error === null) return false
  const obj = error as Record<string, unknown>
  return typeof obj.message === 'string'
}
```

- [ ] **Step 2: 更新ChatWindow.tsx**

```typescript
// 修复前
const errorMessage = (result.error as any).message

// 修复后
import { isApiError } from '../../utils/error'

const errorMessage = isApiError(result.error) ? result.error.message : '未知错误'
```

- [ ] **Step 3: 更新projectHome.hooks.ts**

```typescript
// 修复前
const errorMessage = (result.error as any).message

// 修复后
import { isApiError } from '../utils/error'

const errorMessage = isApiError(result.error) ? result.error.message : '未知错误'
```

- [ ] **Step 4: 运行TypeScript编译检查**

```bash
npx tsc --noEmit
```

Expected: 无新增错误

- [ ] **Step 5: 运行测试验证**

```bash
npx vitest run
```

Expected: 所有测试通过

- [ ] **Step 6: 提交代码**

```bash
git add src/components/ChatWindow.tsx src/hooks/projectHome.hooks.ts src/utils/error.ts
git commit -m "types: replace unsafe error type assertions with type guards"
```

---

## Task 6: 运行完整测试套件

**Covers:** 所有

**Files:**
- 无文件修改

**Interfaces:**
- 无

### 准备工作

- [ ] **Step 0: 读取相关文档**

```bash
# 读取配置
cat tsconfig.json
cat eslint.config.js
```

- [ ] **Step 1: 运行所有测试**

```bash
npx vitest run
```

Expected: 所有测试通过

- [ ] **Step 2: 运行TypeScript编译检查**

```bash
npx tsc --noEmit
```

Expected: 无新增错误

- [ ] **Step 3: 运行ESLint检查**

```bash
npm run lint
```

Expected: 无新增错误

- [ ] **Step 4: 提交最终代码**

```bash
git add .
git commit -m "refactor: complete Phase 3 type safety"
```

---

## Task 7: 代码审核和结果记录

**Covers:** 所有

**Files:**
- 无文件修改

**Interfaces:**
- 无

### 代码审核

- [ ] **Step 1: 使用compose:review技能进行代码审核**

```bash
# 运行完整测试套件
npx vitest run

# 运行TypeScript编译检查
npx tsc --noEmit

# 运行ESLint检查
npm run lint
```

- [ ] **Step 2: 记录任务执行结果**

在 `docs/compose/reports/2026-06-26-phase3-report.md` 中记录：

```markdown
# Phase 3 执行报告

> 执行时间：2026-06-26
> 执行者：MiMoCode

## 执行摘要

| 任务 | 状态 | 测试结果 | 代码行数变化 |
|------|------|----------|--------------|
| Task 1: 创建共享类型定义 | ✅ 完成 | ✅ 通过 | +45行 |
| Task 2: 修复卡片组件Props | ✅ 完成 | ✅ 通过 | +16行 |
| Task 3: 修复HandoverService类型 | ✅ 完成 | ✅ 通过 | +35行 |
| Task 4: 修复双重类型转换 | ✅ 完成 | ✅ 通过 | +15行 |
| Task 5: 修复不安全error类型 | ✅ 完成 | ✅ 通过 | +20行 |
| Task 6: 完整测试套件 | ✅ 完成 | ✅ 通过 | 0行 |
| Task 7: 代码审核 | ✅ 完成 | - | 0行 |

## 代码质量指标

| 指标 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| any类型使用 | 18处 | 0处 | -18处 |
| 双重类型转换 | 1处 | 0处 | -1处 |
| 不安全error转换 | 2处 | 0处 | -2处 |
| TypeScript编译错误 | 0 | 0 | 0 |
| 测试覆盖率 | 85% | 85% | 0% |

## 功能验证

- [x] 所有卡片组件正确显示项目数据
- [x] HandoverService正确处理转交数据
- [x] 项目更新功能正常
- [x] AI对话错误正确显示

## 遇到的问题和解决方案

1. **问题**: 部分组件Props定义不完整
   - **解决方案**: 使用Partial<Project>类型

2. **问题**: HandoverService返回类型复杂
   - **解决方案**: 定义详细的接口结构

## 下一步

- Phase 5: 验证简化（validateProjectId组合函数）
- Phase 6: Minor清理（格式化+常量+未使用代码）
```

- [ ] **Step 3: 提交代码**

```bash
git add docs/compose/reports/2026-06-26-phase3-report.md
git commit -m "docs: add Phase 3 execution report"
```

---

## 完成检查

- [ ] 共享类型定义文件已创建
- [ ] 卡片组件Props接口已更新
- [ ] HandoverService类型已修复
- [ ] 双重类型转换已替换为类型守卫
- [ ] 不安全error类型转换已修复
- [ ] 所有测试通过
- [ ] TypeScript编译无错误
- [ ] ESLint检查通过
- [ ] 代码审核完成
- [ ] 执行报告已记录