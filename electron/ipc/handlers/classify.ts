import * as fileDb from '../../database/files'
import * as projectDb from '../../database/projects'
import { resolveProjectPath, resolveProjectPathForProject } from '../../utils/project-path'
import { getAIService } from '../../services/ai-service'
import { parseClassifyResponse } from '../../utils/ai-response'
import { CLASSIFY_PROMPT_STAGES, CLASSIFY_PROMPT_CONTENT } from '../../prompts/classify'
import { EXTRACT_STRUCTURED_PROMPT } from '../../prompts/extract-structured'
import { mergeStructuredData } from '../../utils/structured-merge'
import { getAllSettings } from '../../database/settings'
import { ROLE_HINT } from '../../constants/ai'
import { matchFilenameHints } from '../../constants/classify'
import { sanitizeCategory } from '../../utils/sanitize'
import fs from 'fs/promises'
import path from 'path'

export interface ClassifyResult {
  category: string
  subcategory: string | null
  stage: string | null
  summary: string | null
  keyInfo: Record<string, unknown> | null
}

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
        // contract_amount 使用 first-write-wins：已有非零值时不覆盖
        if (key === 'contract_amount' && mergedMetadata[key] && (mergedMetadata[key] as number) > 0) {
          continue
        }
        mergedMetadata[key] = value
      } else if (Array.isArray(value) && value.length > 0) {
        mergedMetadata[key] = value
      }
    }
    projectDb.updateProject(projectId, { metadata: JSON.stringify(mergedMetadata) })

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
    const targetDir = subcategory
      ? path.join(projectPath, category, subcategory)
      : path.join(projectPath, category)
    const resolvedTarget = path.resolve(targetDir)

    if (!resolvedTarget.startsWith(path.resolve(projectPath))) {
      console.error('[AI分类] 路径安全校验失败，category/subcategory可能包含路径穿越:', category, subcategory)
      fileDb.updateFile(fileId, { category: '未分类', subcategory: null, content_extracted: content })
      return { success: true }
    }

    await fs.mkdir(targetDir, { recursive: true })
    const targetPath = path.join(targetDir, path.basename(file.stored_path))
    await fs.rename(file.stored_path, targetPath)

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

const MAX_STRUCTURED_CONTENT = 2000

// 这些分类的文件不提取 requirements/key_issues/opportunities
// 因为它们是标准模板内容，不是真实项目数据
const SKIP_STRUCTURED_CATEGORIES = new Set([
  '上线',     // 操作手册、部署文档
  '测试',     // 测试计划、测试报告
  '验收',     // 验收材料、确认单
])

let metadataQueue: Promise<void> = Promise.resolve()

function extractStructuredDataAsync(
  projectId: number,
  category: string,
  content: string
): void {
  // 跳过不适合提取的文件类型
  if (SKIP_STRUCTURED_CATEGORIES.has(category)) {
    return
  }

  const truncatedContent = content.length > MAX_STRUCTURED_CONTENT
    ? content.substring(0, MAX_STRUCTURED_CONTENT) + '\n...(内容截断)'
    : content

  const aiService = getAIService()
  const structuredPrompt = EXTRACT_STRUCTURED_PROMPT
    .replace('{category}', category)
    .replace('{content}', truncatedContent)

  metadataQueue = metadataQueue.then(async () => {
    try {
      const structResult = await aiService.chat([{ role: 'user', content: structuredPrompt }])
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
      console.warn('[结构化提取] 失败:', (e as Error).message)
    }
  })
}

export async function handleClassify(
  fileId: number,
  categoryType?: 'stage' | 'content'
): Promise<{ success: boolean; data?: ClassifyResult; error?: string }> {
  const file = fileDb.getFileById(fileId)
  if (!file) {
    return { success: false, error: '文件不存在' }
  }

  const filenameHints = matchFilenameHints(file.filename)

  let content = file.content_extracted
  if (!content) {
    content = await fs.readFile(file.stored_path, 'utf-8').catch(() => null)
  }

  if (!content) {
    return { success: false, error: '文件内容为空，无法分类' }
  }

  const classifyResult = await classifyWithAI(content, categoryType)
  let { category, subcategory } = classifyResult
  category = sanitizeCategory(category)
  const { stage: fileStage, summary, keyInfo } = classifyResult

  if (filenameHints) {
    if (category !== filenameHints.category || subcategory !== filenameHints.subcategory) {
      console.warn(`[AI分类] 文件名启发式修正: ${category}/${subcategory} -> ${filenameHints.category}/${filenameHints.subcategory}`)
      category = filenameHints.category
      subcategory = filenameHints.subcategory
    }
  }

  await mergeKeyInfo(file.project_id, keyInfo)

  if (content) {
    extractStructuredDataAsync(file.project_id, category, content)
  }

  const moveResult = await moveFileToCategory(
    fileId, file, category, subcategory, content, fileStage, summary, keyInfo
  )

  if (!moveResult.success) {
    return { success: false, error: moveResult.error }
  }

  return {
    success: true,
    data: { category, subcategory, stage: fileStage, summary, keyInfo }
  }
}
