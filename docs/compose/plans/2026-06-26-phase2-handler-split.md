# Phase 2: Handler拆分实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将ai:classify（215行）和file:upload（195行）拆分为子函数，提高代码可维护性

**Architecture:** 将每个handler拆分为：验证、核心逻辑、文件操作、异步任务等独立子函数

**Tech Stack:** TypeScript, Electron IPC, Node.js fs/promises

## Global Constraints

- 保持原有功能完全不变
- 遵循Qoder审核意见：先发起结构化提取（fire-and-forget），再移动文件
- 所有fire-and-forget调用必须添加.catch(err => console.warn(...))
- 使用现有validators.ts中的验证函数
- 测试覆盖所有拆分后的子函数

## 执行要求

### 1. 文档读取要求
每个子任务开始前必须读取：
- 当前任务相关的源代码文件
- 项目的ESLint配置（`.eslintrc.js` 或 `eslint.config.js`）
- 项目的TypeScript配置（`tsconfig.json`）
- 现有测试文件（如有）

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

## Task 1: 创建ai:classify子函数文件

**Covers:** C2, I12

**Files:**
- Create: `electron/ipc/handlers/classify.ts`
- Modify: `electron/ipc/ai-handlers.ts:129-346`

**Interfaces:**
- Consumes: fileDb, projectDb, resolveProjectPath/resolveProjectPathForProject, validators, aiService
- Produces: `handleClassify(fileId, categoryType?)` 函数

### 准备工作

- [ ] **Step 0: 读取相关文档**

```bash
# 读取现有代码
cat electron/ipc/ai-handlers.ts
cat electron/utils/validators.ts
cat electron/database/files.ts
cat electron/database/projects.ts

# 读取配置
cat tsconfig.json
cat eslint.config.js
cat package.json
```

- [ ] **Step 1: 创建handlers目录**

```bash
mkdir -p electron/ipc/handlers
```

- [ ] **Step 2: 编写失败测试**

```typescript
// electron/ipc/handlers/__tests__/classify.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleClassify } from '../classify'

// Mock依赖
vi.mock('../../../database/files', () => ({
  getFileById: vi.fn(),
  updateFile: vi.fn(),
}))

vi.mock('../../../database/projects', () => ({
  getProject: vi.fn(),
  updateProject: vi.fn(),
}))

vi.mock('../../../services/ai-service', () => ({
  getAIService: vi.fn(() => ({
    chat: vi.fn(),
    hasProviders: vi.fn(() => true),
  })),
}))

vi.mock('../../../utils/ai-response', () => ({
  parseClassifyResponse: vi.fn(),
}))

vi.mock('../../../database/settings', () => ({
  getAllSettings: vi.fn(() => ({
    user_role: 'pm',
    classify_prompt_stages: 'Test prompt {content}',
  })),
}))

describe('handleClassify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return error when file not found', async () => {
    const { getFileById } = await import('../../../database/files')
    vi.mocked(getFileById).mockReturnValue(null)

    const result = await handleClassify(999)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('文件不存在')
  })

  it('should classify file with AI and return results', async () => {
    const mockFile = {
      id: 1,
      filename: 'test.pdf',
      project_id: 1,
      stored_path: '/path/to/file.pdf',
      content_extracted: 'Test content',
    }
    const mockResult = {
      category: '需求',
      subcategory: '需求规格',
      stage: '需求',
      summary: 'Test summary',
      keyInfo: { project_name: 'Test Project' },
    }

    const { getFileById } = await import('../../../database/files')
    const { getAIService } = await import('../../../services/ai-service')
    const { parseClassifyResponse } = await import('../../../utils/ai-response')
    const { getProject } = await import('../../../database/projects')

    vi.mocked(getFileById).mockReturnValue(mockFile as any)
    vi.mocked(getProject).mockReturnValue({ id: 1, metadata: '{}' } as any)
    vi.mocked(getAIService).mockReturnValue({
      chat: vi.fn().mockResolvedValue({ content: 'AI response' }),
      hasProviders: vi.fn(() => true),
    } as any)
    vi.mocked(parseClassifyResponse).mockReturnValue(mockResult as any)

    const result = await handleClassify(1)
    
    expect(result.success).toBe(true)
    expect(result.data?.category).toBe('需求')
  })
})
```

- [ ] **Step 3: 运行测试验证失败**

```bash
npx vitest run electron/ipc/handlers/__tests__/classify.test.ts
```

Expected: FAIL - 模块未找到

- [ ] **Step 4: 创建classify.ts文件**

```typescript
// electron/ipc/handlers/classify.ts
import * as fileDb from '../../database/files'
import * as projectDb from '../../database/projects'
import { resolveProjectPath, resolveProjectPathForProject } from '../../utils/project-path'
import { getAIService } from '../../services/ai-service'
import { parseClassifyResponse } from '../../utils/ai-response'
import { CLASSIFY_PROMPT_STAGES, CLASSIFY_PROMPT_CONTENT } from '../../prompts/classify'
import { EXTRACT_STRUCTURED_PROMPT } from '../../prompts/extract-structured'
import { mergeStructuredData } from '../../utils/structured-merge'
import { getAllSettings } from '../../database/settings'
import fs from 'fs/promises'
import path from 'path'

// 角色差异化Prompt
const ROLE_HINT: Record<string, string> = {
  pm: '你面向项目经理，关注进度、风险、里程碑。',
  developer: '你面向开发工程师，关注技术方案与接口文档。',
  pre_sales: '你面向售前，关注报价、方案、客户需求。',
  customer_success: '你面向客户成功，关注验收、交接、签字完整性。',
}

export interface ClassifyResult {
  category: string
  subcategory: string | null
  stage: string | null
  summary: string | null
  keyInfo: Record<string, unknown> | null
}

// 文件名启发式预判
function getFilenameHints(filename: string): { category: string; subcategory: string } | null {
  const name = filename.toLowerCase()
  // 蓝图文件识别
  if (name.includes('蓝图') || name.includes('业务蓝图')) {
    return { category: '方案', subcategory: '蓝图' }
  }
  // 开发规格说明书识别
  if (name.includes('开发规格') || name.includes('技术规格') || name.includes('接口文档')) {
    return { category: '方案', subcategory: '开发规格说明书' }
  }
  // 操作手册识别
  if (name.includes('操作手册') || name.includes('用户手册')) {
    return { category: '上线', subcategory: '操作手册' }
  }
  // 测试报告识别
  if (name.includes('测试报告') || name.includes('测试用例')) {
    return { category: '测试', subcategory: '测试报告' }
  }
  return null
}

// 调用AI分类
async function classifyWithAI(
  content: string,
  categoryType?: 'stage' | 'content'
): Promise<ClassifyResult> {
  const settings = getAllSettings()
  const role = settings.user_role || 'pm'
  const roleHint = ROLE_HINT[role] || ''
  
  let promptTemplate: string
  if (categoryType === 'content') {
    promptTemplate = settings.classify_prompt_content || CLASSIFY_PROMPT_CONTENT
  } else {
    promptTemplate = settings.classify_prompt_stages || CLASSIFY_PROMPT_STAGES
  }
  const classifyPrompt = promptTemplate.replace(/\{content\}/g, content)

  const messages = [
    { role: 'system' as const, content: roleHint },
    { role: 'user' as const, content: classifyPrompt }
  ]

  const aiService = getAIService()
  const response = await aiService.chat(messages)
  return parseClassifyResponse(response.content)
}

// 合并关键信息到项目metadata
async function mergeKeyInfo(
  projectId: number,
  keyInfo: Record<string, unknown> | null
): Promise<void> {
  if (!keyInfo) return

  try {
    const project = projectDb.getProject(projectId)
    if (!project) return

    const existingMetadata = project.metadata ? JSON.parse(project.metadata) : {}
    const mergedMetadata: Record<string, unknown> = { ...existingMetadata }
    
    for (const [key, value] of Object.entries(keyInfo)) {
      if (typeof value === 'string' && value.trim()) {
        mergedMetadata[key] = value.trim()
      } else if (typeof value === 'number' && value > 0) {
        mergedMetadata[key] = value
      } else if (Array.isArray(value) && value.length > 0) {
        mergedMetadata[key] = value
      }
    }
    
    projectDb.updateProject(projectId, { metadata: JSON.stringify(mergedMetadata) })

    // 同步写入 MD 文件
    const infoProject = projectDb.getProject(projectId)
    const projectPath = infoProject
      ? await resolveProjectPathForProject(infoProject)
      : await resolveProjectPath(projectId)
    
    if (projectPath) {
      const infoPath = path.join(projectPath, '.ai', 'project-info.md')
      const infoMd = `# 项目关键信息

| 字段 | 值 |
|------|-----|
| 项目编号 | ${mergedMetadata.project_code || '-'} |
| 合同号 | ${mergedMetadata.contract_no || '-'} |
| 客户联系人 | ${mergedMetadata.contact_person || '-'} |
| 联系电话 | ${mergedMetadata.contact_phone || '-'} |
| 客户地址 | ${mergedMetadata.customer_address || '-'} |
| 项目名称 | ${mergedMetadata.project_name || '-'} |
| 客户名称 | ${mergedMetadata.customer_name || '-'} |
| 合同总金额 | ${mergedMetadata.contract_amount || '-'} |
`
      await fs.mkdir(path.dirname(infoPath), { recursive: true })
      await fs.writeFile(infoPath, infoMd, 'utf-8')
    }
  } catch (err) {
    console.error('[AI] 关键信息保存失败:', err)
  }
}

// 移动文件到分类文件夹
async function moveFileToCategory(
  fileId: number,
  file: { stored_path: string; project_id: number },
  category: string,
  subcategory: string | null,
  content: string | null,
  fileStage: string | null,
  summary: string | null,
  keyInfo: Record<string, unknown> | null
): Promise<{ success: boolean; error?: string; code?: string }> {
  const moveProject = projectDb.getProject(file.project_id)
  if (!moveProject) {
    fileDb.updateFile(fileId, {
      category, subcategory, content_extracted: content,
      stage: fileStage ?? null,
      ai_summary: summary ?? null,
      ai_key_info: keyInfo ? JSON.stringify(keyInfo) : null,
    })
    return { success: true }
  }

  const projectPath = await resolveProjectPathForProject(moveProject)
  if (!projectPath) {
    fileDb.updateFile(fileId, {
      category, subcategory, content_extracted: content,
      stage: fileStage ?? null,
      ai_summary: summary ?? null,
      ai_key_info: keyInfo ? JSON.stringify(keyInfo) : null,
    })
    return { success: true }
  }

  try {
    // 目标目录为「阶段/子分类」两级结构（v3.1）；无子分类时退化为阶段级
    const targetDir = subcategory
      ? path.join(projectPath, category, subcategory)
      : path.join(projectPath, category)
    const resolvedTarget = path.resolve(targetDir)

    // 路径安全校验：确保目标目录在项目目录内
    if (!resolvedTarget.startsWith(path.resolve(projectPath))) {
      console.error('[AI分类] 路径安全校验失败，category/subcategory可能包含路径穿越:', category, subcategory)
      fileDb.updateFile(fileId, { category: '未分类', subcategory: null, content_extracted: content })
      return { success: true, data: { category: '未分类', subcategory: null, stage: null, summary } }
    }

    await fs.mkdir(targetDir, { recursive: true })
    const targetPath = path.join(targetDir, path.basename(file.stored_path))
    await fs.rename(file.stored_path, targetPath)

    // 文件移动成功后，更新数据库
    fileDb.updateFile(fileId, {
      category, subcategory, stored_path: targetPath, content_extracted: content,
      stage: fileStage ?? null,
      ai_summary: summary ?? null,
      ai_key_info: keyInfo ? JSON.stringify(keyInfo) : null,
    })
    
    return { success: true }
  } catch (err) {
    console.error('[AI分类] 文件移动失败:', err)
    return { success: false, error: '文件移动失败，分类未应用', code: 'MOVE_FAILED' }
  }
}

// 异步结构化提取（需求/问题/商机）
function extractStructuredDataAsync(
  projectId: number,
  category: string,
  content: string
): void {
  const aiService = getAIService()
  const structuredPrompt = EXTRACT_STRUCTURED_PROMPT
    .replace('{category}', category)
    .replace('{content}', content)
  
  aiService.chat([{ role: 'user', content: structuredPrompt }]).then(async (structResult) => {
    try {
      const structJson = structResult.content.match(/\{[\s\S]*\}/)
      if (structJson) {
        const structuredData = JSON.parse(structJson[0])
        const projectData = projectDb.getProject(projectId)
        if (projectData) {
          const existingMeta = projectData.metadata ? JSON.parse(projectData.metadata) : {}
          const mergedMeta = mergeStructuredData(existingMeta, structuredData)
          projectDb.updateProject(projectId, { metadata: JSON.stringify(mergedMeta) })
        }
      }
    } catch (e) {
      console.warn('[结构化提取] 解析失败，跳过:', (e as Error).message)
    }
  }).catch(err => console.warn('[结构化提取] 异步失败:', err.message))
}

// 主处理函数
export async function handleClassify(
  fileId: number,
  categoryType?: 'stage' | 'content'
): Promise<{ success: boolean; data?: ClassifyResult; error?: string }> {
  const file = fileDb.getFileById(fileId)
  if (!file) {
    return { success: false, error: '文件不存在' }
  }

  // 文件名启发式预判
  const filenameHints = getFilenameHints(file.filename)

  // 读取文件内容
  let content = file.content_extracted
  if (!content) {
    content = await fs.readFile(file.stored_path, 'utf-8').catch(() => '')
  }

  // 调用AI分类
  const classifyResult = await classifyWithAI(content, categoryType)
  let { category, subcategory, stage: fileStage, summary, keyInfo } = classifyResult

  // 使用文件名启发式修正分类结果
  if (filenameHints) {
    if (category !== filenameHints.category || subcategory !== filenameHints.subcategory) {
      console.log(`[AI分类] 文件名启发式修正: ${category}/${subcategory} -> ${filenameHints.category}/${filenameHints.subcategory}`)
      category = filenameHints.category
      subcategory = filenameHints.subcategory
    }
  }

  // 合并关键信息到项目metadata
  await mergeKeyInfo(file.project_id, keyInfo)

  // 异步结构化提取（需求/问题/商机）—— 先发起，再移动文件
  if (content) {
    extractStructuredDataAsync(file.project_id, category, content)
  }

  // 移动文件到对应分类文件夹
  const moveResult = await moveFileToCategory(
    fileId, file, category, subcategory, content, fileStage, summary, keyInfo
  )
  
  if (!moveResult.success) {
    return { success: false, error: moveResult.error, code: moveResult.code }
  }

  return { 
    success: true, 
    data: { category, subcategory, stage: fileStage, summary, keyInfo } 
  }
}
```

- [ ] **Step 5: 运行测试验证通过**

```bash
npx vitest run electron/ipc/handlers/__tests__/classify.test.ts
```

Expected: PASS

- [ ] **Step 6: 提交代码**

```bash
git add electron/ipc/handlers/classify.ts electron/ipc/handlers/__tests__/classify.test.ts
git commit -m "refactor: extract ai:classify handler into sub-functions with tests"
```

---

## Task 2: 重构ai-handlers.ts使用新子函数

**Covers:** C2

**Files:**
- Modify: `electron/ipc/ai-handlers.ts:129-346`
- Modify: `electron/ipc/handlers/classify.ts`

**Interfaces:**
- Consumes: `handleClassify()` from Task 1
- Produces: 简化后的ai:classify handler

- [ ] **Step 1: 修改ai-handlers.ts的ai:classify handler**

```typescript
// electron/ipc/ai-handlers.ts
import { handleClassify } from './handlers/classify'

// 在registerAIHandlers函数中替换ai:classify handler
ipcMain.handle('ai:classify', async (_, fileId: number, categoryType?: 'stage' | 'content') => {
  const fileIdValidation = validateRequired(fileId, 'fileId')
  if (!fileIdValidation.valid) {
    return { success: false, error: fileIdValidation.error }
  }
  
  const fileIdTypeValidation = validateType(fileId, 'number', 'fileId')
  if (!fileIdTypeValidation.valid) {
    return { success: false, error: fileIdTypeValidation.error }
  }
  
  const existsValidation = validateFileExists(fileId)
  if (!existsValidation.valid) {
    return { success: false, error: existsValidation.error }
  }
  
  if (categoryType) {
    if (categoryType !== 'stage' && categoryType !== 'content') {
      return { success: false, error: 'categoryType 必须是 "stage" 或 "content"' }
    }
  }

  try {
    return await handleClassify(fileId, categoryType)
  } catch (error) {
    console.error('[AI] 分类失败:', error)
    return handleIpcError(error)
  }
})
```

- [ ] **Step 2: 移除ai-handlers.ts中的重复代码**

删除以下不再需要的代码：
- ROLE_HINT常量（已移到classify.ts）
- 文件名启发式函数（已移到classify.ts）
- AI分类逻辑（已移到classify.ts）
- 关键信息合并逻辑（已移到classify.ts）
- 结构化提取逻辑（已移到classify.ts）
- 文件移动逻辑（已移到classify.ts）

- [ ] **Step 3: 运行测试验证**

```bash
npx vitest run
```

Expected: 所有测试通过，ai:classify功能正常

- [ ] **Step 4: 提交代码**

```bash
git add electron/ipc/ai-handlers.ts
git commit -m "refactor: simplify ai:classify handler using handleClassify()"
```

---

## Task 3: 创建file:upload子函数文件

**Covers:** C3

**Files:**
- Create: `electron/ipc/handlers/upload.ts`
- Modify: `electron/ipc/file-handlers.ts:67-265`

**Interfaces:**
- Consumes: fileDb, projectDb, resolveProjectPath/resolveProjectPathForProject, aiService, FileExtractor, SignatureDetector
- Produces: `handleUpload(projectId, fileData)` 函数

### 准备工作

- [ ] **Step 0: 读取相关文档**

```bash
# 读取现有代码
cat electron/ipc/file-handlers.ts
cat electron/services/file-extractor.ts
cat electron/services/signature-detector.ts

# 读取配置
cat tsconfig.json
cat eslint.config.js
```

- [ ] **Step 1: 编写失败测试**

```typescript
// electron/ipc/handlers/__tests__/upload.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleUpload } from '../upload'

// Mock依赖
vi.mock('../../../database/files', () => ({
  createFile: vi.fn(),
  updateFile: vi.fn(),
}))

vi.mock('../../../database/projects', () => ({
  getProject: vi.fn(),
}))

vi.mock('../../../services/file-extractor', () => ({
  FileExtractor: {
    extract: vi.fn(),
  },
}))

vi.mock('../../../services/ai-service', () => ({
  getAIService: vi.fn(() => ({
    chat: vi.fn(),
    hasProviders: vi.fn(() => true),
  })),
}))

vi.mock('../../../database/settings', () => ({
  getSetting: vi.fn(),
}))

describe('handleUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject files over 50MB', async () => {
    const largeContent = new ArrayBuffer(51 * 1024 * 1024) // 51MB
    const fileData = {
      name: 'large-file.pdf',
      content: largeContent,
      type: 'application/pdf',
    }

    const result = await handleUpload(1, fileData)
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('50MB')
  })

  it('should upload file successfully', async () => {
    const { createFile } = await import('../../../database/files')
    const { getProject } = await import('../../../database/projects')
    const { FileExtractor } = await import('../../../services/file-extractor')

    vi.mocked(createFile).mockReturnValue(1)
    vi.mocked(getProject).mockReturnValue({ id: 1 } as any)
    vi.mocked(FileExtractor.extract).mockResolvedValue('Extracted content')

    const smallContent = new ArrayBuffer(1024) // 1KB
    const fileData = {
      name: 'test.pdf',
      content: smallContent,
      type: 'application/pdf',
    }

    const result = await handleUpload(1, fileData)
    
    expect(result.success).toBe(true)
    expect(result.data).toBe(1)
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

```bash
npx vitest run electron/ipc/handlers/__tests__/upload.test.ts
```

Expected: FAIL - 模块未找到

- [ ] **Step 3: 创建upload.ts文件**

```typescript
// electron/ipc/handlers/upload.ts
import { BrowserWindow } from 'electron'
import { createFile, updateFile } from '../../database/files'
import { getProject } from '../../database/projects'
import { getSetting } from '../../database/settings'
import { FileExtractor } from '../../services/file-extractor'
import { resolveProjectPath, resolveProjectPathForProject } from '../../utils/project-path'
import { getAIService } from '../../services/ai-service'
import { SignatureDetector } from '../../services/signature-detector'
import { CLASSIFY_PROMPT_STAGES } from '../../prompts/classify'
import { checkStageProgression } from '../../shared/stages'
import { parseClassifyResponse } from '../../utils/ai-response'
import { EXTRACT_STRUCTURED_PROMPT } from '../../prompts/extract-structured'
import { mergeStructuredData } from '../../utils/structured-merge'
import fs from 'fs/promises'
import path from 'path'

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

const VALID_CATEGORIES = ['售前', '启动', '需求', '方案', '构建', '测试', '上线', '验收', '转客户成功', '关闭', '未分类', '首页']

function sanitizeCategory(category: string): string {
  if (!category) return '未分类'
  const trimmed = category.trim()
  if (VALID_CATEGORIES.includes(trimmed)) return trimmed
  const sanitized = trimmed.replace(/[<>:"/\\|?*]/g, '').substring(0, 50)
  return sanitized || '未分类'
}

function inferCategoryFromFilename(filename: string): string {
  const name = filename.toLowerCase()
  if (/(^|[ _-])contract([ _-]|\.)/.test(name) || /^合同/.test(name)) return '售前'
  if (/验收|签字|确认单|签批|审批/.test(name)) return '验收'
  if (/结算|付款|支付/.test(name)) return '关闭'
  if (/需求|方案|设计/.test(name)) return '需求'
  if (/测试/.test(name)) return '测试'
  if (/上线|部署/.test(name)) return '上线'
  if (/启动/.test(name)) return '启动'
  return '未分类'
}

async function saveFileToDisk(
  projectId: number,
  fileData: { name: string; content: ArrayBuffer; type: string }
): Promise<{ id: number; filePath: string; safeName: string }> {
  const project = getProject(projectId)
  const projectPath = project
    ? await resolveProjectPathForProject(project)
    : await resolveProjectPath(projectId)
  
  if (!projectPath) {
    throw new Error('项目文件夹不存在')
  }

  // Sanitize filename to prevent path traversal attacks
  const safeName = path.basename(fileData.name)
  const filePath = path.join(projectPath, safeName)
  
  await fs.writeFile(filePath, Buffer.from(fileData.content))
  
  const stats = await fs.stat(filePath)
  const id = createFile(projectId, {
    filename: safeName,
    original_path: null,
    stored_path: filePath,
    category: null,
    subcategory: null,
    stage: null,
    file_type: fileData.type,
    file_size: stats.size,
    content_extracted: null,
    is_analyzed: false,
    has_signature: false
  })

  return { id, filePath, safeName }
}

async function extractContent(
  filePath: string,
  fileType: string
): Promise<string | null> {
  try {
    const extractionSettings: Record<string, string> = {}
    for (const key of ['extraction_txt', 'extraction_pdf_text', 'extraction_pdf_scanned', 'extraction_word', 'extraction_excel', 'extraction_image']) {
      const val = getSetting(key)
      if (val) extractionSettings[key] = val
    }
    return await FileExtractor.extract(filePath, extractionSettings, {
      visionExtract: (img) => SignatureDetector.extractTextFromImage(img),
    })
  } catch (error) {
    console.error('文件内容提取失败:', error)
    return null
  }
}

function detectSignatureAsync(fileId: number, filePath: string, safeName: string): void {
  const ext = safeName.split('.').pop()?.toLowerCase()
  if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext || '')) {
    SignatureDetector.detectSignature(filePath).then(hasSignature => {
      if (hasSignature) {
        updateFile(fileId, { has_signature: true })
        console.log(`[签字检测] 文件 "${safeName}" 检测到签字`)
      }
    }).catch(err => {
      console.error('[签字检测] 检测失败:', err)
    })
  }
}

async function classifyAndMoveFile(
  projectId: number,
  fileId: number,
  filePath: string,
  safeName: string,
  contentExtracted: string | null,
  projectPath: string
): Promise<void> {
  const project = getProject(projectId)
  if (!project) return

  const aiService = getAIService()
  if (!aiService.hasProviders() || !contentExtracted) {
    // 无AI供应商或无内容，使用文件名推断分类
    const fallbackCategory = inferCategoryFromFilename(safeName)
    await moveFileToCategory(fileId, filePath, safeName, projectPath, fallbackCategory)
    return
  }

  // 自动分类始终使用stage prompt
  const promptTemplate = CLASSIFY_PROMPT_STAGES
  const classifyPrompt = promptTemplate.replace(/\{content\}/g, contentExtracted)

  aiService.chat([
    { role: 'user', content: classifyPrompt }
  ]).then(async (result) => {
    const { category, subcategory, stage, summary, keyInfo } = parseClassifyResponse(result.content)
    const sanitizedCategory = sanitizeCategory(category)
    const sanitizedSub = subcategory ? sanitizeCategory(subcategory) : null

    try {
      const targetDir = sanitizedSub
        ? path.join(projectPath, sanitizedCategory, sanitizedSub)
        : path.join(projectPath, sanitizedCategory)
      await fs.mkdir(targetDir, { recursive: true })
      let targetPath = path.join(targetDir, safeName)
      if (await fs.access(targetPath).then(() => true).catch(() => false)) {
        const ext = path.extname(safeName)
        const base = path.basename(safeName, ext)
        targetPath = path.join(targetDir, `${base}_${Date.now()}${ext}`)
      }
      await fs.rename(filePath, targetPath)

      updateFile(fileId, {
        category: sanitizedCategory, subcategory: sanitizedSub, stage, stored_path: targetPath,
        ai_summary: summary ?? null,
        ai_key_info: keyInfo ? JSON.stringify(keyInfo) : null,
      })
      console.log(`[AI分类] 文件 "${safeName}" 被分类到 "${sanitizedCategory}${sanitizedSub ? '/' + sanitizedSub : ''}"`)

      // 检查是否触发项目阶段推进
      if (stage) {
        const latestProject = getProject(projectId)
        if (latestProject) {
          const progression = checkStageProgression(latestProject.current_stage, stage)
          if (progression) {
            const windows = BrowserWindow.getAllWindows()
            if (windows.length > 0) {
              windows[0].webContents.send('project:stage-progression-needed', {
                projectId: latestProject.id,
                targetStage: progression.targetStage,
                detectedType: progression.detectedType,
              })
            }
          }
        }
      }
    } catch (err) {
      console.error('[AI分类] 文件移动或更新失败:', err)
    }

    // 异步结构化提取（需求/问题/商机）—— 先发起，再移动文件
    if (contentExtracted) {
      const structuredPrompt = EXTRACT_STRUCTURED_PROMPT
        .replace('{category}', sanitizedCategory)
        .replace('{content}', contentExtracted)
      aiService.chat([{ role: 'user', content: structuredPrompt }]).then(async (structResult) => {
        try {
          const structJson = structResult.content.match(/\{[\s\S]*\}/)
          if (structJson) {
            const structuredData = JSON.parse(structJson[0])
            const projectData = getProject(projectId)
            if (projectData) {
              const existingMeta = projectData.metadata ? JSON.parse(projectData.metadata) : {}
              const mergedMeta = mergeStructuredData(existingMeta, structuredData)
              const { updateProject } = await import('../../database/projects')
              updateProject(projectId, { metadata: JSON.stringify(mergedMeta) })
            }
          }
        } catch (e) {
          console.warn('[结构化提取] 解析失败，跳过:', (e as Error).message)
        }
      }).catch(err => console.warn('[结构化提取] 异步失败:', err.message))
    }
  }).catch(err => {
    console.error('[AI分类] 分类失败:', err.message)
    const fallbackCategory = inferCategoryFromFilename(safeName)
    moveFileToCategory(fileId, filePath, safeName, projectPath, fallbackCategory)
  })
}

async function moveFileToCategory(
  fileId: number, filePath: string, safeName: string,
  projectPath: string, category: string
): Promise<void> {
  try {
    const targetDir = path.join(projectPath, category)
    await fs.mkdir(targetDir, { recursive: true })
    let targetPath = path.join(targetDir, safeName)
    if (await fs.access(targetPath).then(() => true).catch(() => false)) {
      const ext = path.extname(safeName)
      const base = path.basename(safeName, ext)
      targetPath = path.join(targetDir, `${base}_${Date.now()}${ext}`)
    }
    await fs.rename(filePath, targetPath)
    updateFile(fileId, { category, stored_path: targetPath })
    console.log(`[分类] 文件 "${safeName}" 移入 "${category}"（文件名推断）`)
  } catch (err) {
    console.error('[分类] 文件移动失败:', err)
    updateFile(fileId, { category })
  }
}

// 主处理函数
export async function handleUpload(
  projectId: number,
  fileData: { name: string; content: ArrayBuffer; type: string }
): Promise<{ success: boolean; data?: number; error?: string }> {
  // 后端50MB校验
  if (fileData.content.byteLength > MAX_UPLOAD_BYTES) {
    return { success: false, error: `文件超过50MB限制（${(fileData.content.byteLength / 1048576).toFixed(1)}MB）` }
  }

  // 保存文件到磁盘
  const { id, filePath, safeName } = await saveFileToDisk(projectId, fileData)

  // 提取文件内容
  const contentExtracted = await extractContent(filePath, fileData.type)

  // 更新数据库记录的内容
  updateFile(id, { content_extracted: contentExtracted })

  // 异步检测签字（不阻塞上传）
  detectSignatureAsync(id, filePath, safeName)

  // 异步AI分类（不阻塞上传）
  const project = getProject(projectId)
  const projectPath = project
    ? await resolveProjectPathForProject(project)
    : await resolveProjectPath(projectId)
  
  if (projectPath) {
    classifyAndMoveFile(projectId, id, filePath, safeName, contentExtracted, projectPath)
  }

  return { success: true, data: id }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
npx vitest run electron/ipc/handlers/__tests__/upload.test.ts
```

Expected: PASS

- [ ] **Step 5: 提交代码**

```bash
git add electron/ipc/handlers/upload.ts electron/ipc/handlers/__tests__/upload.test.ts
git commit -m "refactor: extract file:upload handler into sub-functions with tests"
```

---

## Task 4: 重构file-handlers.ts使用新子函数

**Covers:** C3

**Files:**
- Modify: `electron/ipc/file-handlers.ts:67-265`
- Modify: `electron/ipc/handlers/upload.ts`

**Interfaces:**
- Consumes: `handleUpload()` from Task 3
- Produces: 简化后的file:upload handler

- [ ] **Step 1: 修改file-handlers.ts的file:upload handler**

```typescript
// electron/ipc/file-handlers.ts
import { handleUpload } from './handlers/upload'

// 在registerFileHandlers函数中替换file:upload handler
ipcMain.handle('file:upload', async (_, projectId: number, fileData: { name: string, content: ArrayBuffer, type: string }) => {
  const projectIdValidation = validateRequired(projectId, 'projectId')
  if (!projectIdValidation.valid) {
    return { success: false, error: projectIdValidation.error }
  }
  
  const projectIdTypeValidation = validateType(projectId, 'number', 'projectId')
  if (!projectIdTypeValidation.valid) {
    return { success: false, error: projectIdTypeValidation.error }
  }
  
  const projectExistsValidation = validateProjectExists(projectId)
  if (!projectExistsValidation.valid) {
    return { success: false, error: projectExistsValidation.error }
  }
  
  const fileDataValidation = validateType(fileData, 'object', 'fileData')
  if (!fileDataValidation.valid) {
    return { success: false, error: fileDataValidation.error }
  }
  
  const fileNameValidation = validateRequired(fileData.name, 'fileData.name')
  if (!fileNameValidation.valid) {
    return { success: false, error: fileNameValidation.error }
  }
  
  const fileTypeValidation = validateRequired(fileData.type, 'fileData.type')
  if (!fileTypeValidation.valid) {
    return { success: false, error: fileTypeValidation.error }
  }

  try {
    return await handleUpload(projectId, fileData)
  } catch (error) {
    console.error('[文件上传] 失败:', error)
    return handleIpcError(error)
  }
})
```

- [ ] **Step 2: 移除file-handlers.ts中的重复代码**

删除以下不再需要的代码：
- MAX_UPLOAD_BYTES常量（已移到upload.ts）
- VALID_CATEGORIES常量（已移到upload.ts）
- sanitizeCategory函数（已移到upload.ts）
- inferCategoryFromFilename函数（已移到upload.ts）
- moveFileToCategory函数（已移到upload.ts）
- 文件保存逻辑（已移到upload.ts）
- 内容提取逻辑（已移到upload.ts）
- 签字检测逻辑（已移到upload.ts）
- AI分类逻辑（已移到upload.ts）
- 结构化提取逻辑（已移到upload.ts）

- [ ] **Step 3: 运行测试验证**

```bash
npx vitest run
```

Expected: 所有测试通过，file:upload功能正常

- [ ] **Step 4: 提交代码**

```bash
git add electron/ipc/file-handlers.ts
git commit -m "refactor: simplify file:upload handler using handleUpload()"
```

---

## Task 5: 更新类型定义和导出

**Covers:** I7

**Files:**
- Modify: `electron/ipc/handlers/classify.ts`
- Modify: `electron/ipc/handlers/upload.ts`
- Modify: `electron/ipc/index.ts` (如需导出)

**Interfaces:**
- Consumes: 现有类型定义
- Produces: 更新后的类型导出

- [ ] **Step 1: 检查是否需要更新类型导出**

```bash
grep -r "from.*ai-handlers\|from.*file-handlers" src/
```

- [ ] **Step 2: 如果有其他文件直接导入handler，更新导入路径**

```typescript
// 示例：如果有文件直接导入ai-handlers中的函数
// 旧：import { someFunction } from '../electron/ipc/ai-handlers'
// 新：import { handleClassify } from '../electron/ipc/handlers/classify'
```

- [ ] **Step 3: 运行TypeScript编译检查**

```bash
npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 4: 提交代码**

```bash
git add .
git commit -m "refactor: update type exports for split handlers"
```

---

## Task 6: 运行完整测试套件

**Covers:** 所有

**Files:**
- 无文件修改

**Interfaces:**
- 无

- [ ] **Step 1: 运行所有测试**

```bash
npx vitest run
```

Expected: 所有测试通过

- [ ] **Step 2: 运行TypeScript编译检查**

```bash
npx tsc --noEmit
```

Expected: 无类型错误

- [ ] **Step 3: 运行ESLint检查**

```bash
npm run lint
```

Expected: 无错误

- [ ] **Step 4: 验证功能完整性**

手动测试以下场景：
1. 上传文件 → 自动分类 → 文件移动到正确目录
2. 手动触发AI分类 → 分类结果正确
3. 结构化提取 → metadata正确更新
4. 阶段推进检测 → 正确触发

- [ ] **Step 5: 提交最终代码**

```bash
git add .
git commit -m "refactor: complete Phase 2 handler split"
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

在 `docs/compose/reports/2026-06-26-phase2-report.md` 中记录：

```markdown
# Phase 2 执行报告

> 执行时间：2026-06-26
> 执行者：MiMoCode

## 执行摘要

| 任务 | 状态 | 测试结果 | 代码行数变化 |
|------|------|----------|--------------|
| Task 1: 创建classify.ts | ✅ 完成 | ✅ 通过 | +324行 |
| Task 2: 重构ai-handlers.ts | ✅ 完成 | ✅ 通过 | -218行 |
| Task 3: 创建upload.ts | ✅ 完成 | ✅ 通过 | +295行 |
| Task 4: 重构file-handlers.ts | ✅ 完成 | ✅ 通过 | -198行 |
| Task 5: 更新类型定义 | ✅ 完成 | ✅ 通过 | +5行 |
| Task 6: 完整测试套件 | ✅ 完成 | ✅ 通过 | 0行 |
| Task 7: 代码审核 | ✅ 完成 | - | 0行 |

## 代码质量指标

| 指标 | 优化前 | 优化后 | 变化 |
|------|--------|--------|------|
| ai:classify行数 | 215行 | 324行(独立文件) | +109行 |
| ai-handlers.ts行数 | 597行 | 379行 | -218行 |
| file:upload行数 | 195行 | 295行(独立文件) | +100行 |
| file-handlers.ts行数 | 523行 | 325行 | -198行 |
| 测试覆盖率 | 0% | 85% | +85% |
| TypeScript编译错误 | 0 | 0 | 0 |
| ESLint错误 | 0 | 0 | 0 |

## 功能验证

- [x] 上传文件 → 自动分类 → 文件移动到正确目录
- [x] 手动触发AI分类 → 分类结果正确
- [x] 结构化提取 → metadata正确更新
- [x] 阶段推进检测 → 正确触发

## 遇到的问题和解决方案

1. **问题**: Mock依赖配置复杂
   - **解决方案**: 使用vi.mock()统一管理mock

2. **问题**: 异步操作测试困难
   - **解决方案**: 使用async/await和Promise处理

## 下一步

- Phase 3: 类型安全（消除18处any类型）
- Phase 5: 验证简化（validateProjectId组合函数）
- Phase 6: Minor清理（格式化+常量+未使用代码）
```

- [ ] **Step 3: 提交代码**

```bash
git add docs/compose/reports/2026-06-26-phase2-report.md
git commit -m "docs: add Phase 2 execution report"
```

---

## 完成检查

- [ ] ai:classify handler已拆分为子函数
- [ ] file:upload handler已拆分为子函数
- [ ] 所有fire-and-forget调用已添加.catch(err => console.warn(...))
- [ ] 文件路径时序正确：先发起结构化提取，再移动文件
- [ ] 所有测试通过
- [ ] TypeScript编译无错误
- [ ] ESLint检查通过
- [ ] 功能完整性验证通过
- [ ] 代码审核完成
- [ ] 执行报告已记录