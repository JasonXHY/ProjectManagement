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
import { sanitizeCategory } from '../../utils/sanitize'
import { matchFilenameHints } from '../../constants/classify'
import fs from 'fs/promises'
import path from 'path'

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

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
  _fileType: string
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
        console.warn(`[签字检测] 文件 "${safeName}" 检测到签字`)
      }
    }).catch(err => {
      console.warn('[签字检测] 检测失败:', (err as Error).message)
    })
  }
}

const MAX_STRUCTURED_CONTENT = 2000

const SKIP_STRUCTURED_CATEGORIES = new Set([
  '上线', '测试', '验收',
])

function extractStructuredDataAsync(
  projectId: number,
  category: string,
  contentExtracted: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiService: any
): void {
  if (SKIP_STRUCTURED_CATEGORIES.has(category)) {
    return
  }

  const truncatedContent = contentExtracted.length > MAX_STRUCTURED_CONTENT
    ? contentExtracted.substring(0, MAX_STRUCTURED_CONTENT) + '\n...(内容截断)'
    : contentExtracted

  const structuredPrompt = EXTRACT_STRUCTURED_PROMPT
    .replace('{category}', category)
    .replace('{content}', truncatedContent)
  ;(aiService as { chat: (messages: { role: string; content: string }[]) => Promise<{ content: string }> }).chat([{ role: 'user', content: structuredPrompt }]).then(async (structResult) => {
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
  }).catch(err => console.warn('[结构化提取] 异步失败:', (err as Error).message))
}

function classifyAndMoveFile(
  projectId: number,
  fileId: number,
  filePath: string,
  safeName: string,
  contentExtracted: string | null,
  projectPath: string
): void {
  const project = getProject(projectId)
  if (!project) return

  const aiService = getAIService()
  if (!aiService.hasProviders() || !contentExtracted) {
    const fallbackCategory = inferCategoryFromFilename(safeName)
    moveFileToCategory(fileId, filePath, safeName, projectPath, fallbackCategory)
    return
  }

  const promptTemplate = CLASSIFY_PROMPT_STAGES
  const classifyPrompt = promptTemplate.replace(/\{content\}/g, contentExtracted)

  aiService.chat([
    { role: 'user', content: classifyPrompt }
  ]).then(async (result) => {
    const { category, subcategory, stage, summary, keyInfo } = parseClassifyResponse(result.content)
    let sanitizedCategory = sanitizeCategory(category)
    let sanitizedSub = subcategory ? sanitizeCategory(subcategory) : null

    // 应用文件名启发式修正
    const filenameHints = matchFilenameHints(safeName)
    if (filenameHints) {
      if (sanitizedCategory !== filenameHints.category || sanitizedSub !== filenameHints.subcategory) {
        console.warn(`[上传分类] 文件名启发式修正: ${sanitizedCategory}/${sanitizedSub} -> ${filenameHints.category}/${filenameHints.subcategory}`)
        sanitizedCategory = filenameHints.category
        sanitizedSub = filenameHints.subcategory
      }
    }

    // 先发起结构化提取（fire-and-forget），再移动文件
    if (contentExtracted) {
      extractStructuredDataAsync(projectId, sanitizedCategory, contentExtracted, aiService)
    }

    try {
      const targetDir = sanitizedSub
        ? path.join(projectPath, sanitizedCategory, sanitizedSub)
        : path.join(projectPath, sanitizedCategory)
      await fs.mkdir(targetDir, { recursive: true })
      let targetPath = path.join(targetDir, safeName)
      try {
        await fs.stat(targetPath)
        const ext = path.extname(safeName)
        const base = path.basename(safeName, ext)
        targetPath = path.join(targetDir, `${base}_${Date.now()}${ext}`)
      } catch {
        // file doesn't exist, use original path
      }
      await fs.rename(filePath, targetPath)

      updateFile(fileId, {
        category: sanitizedCategory, subcategory: sanitizedSub, stage, stored_path: targetPath,
        ai_summary: summary ?? null,
        ai_key_info: keyInfo ? JSON.stringify(keyInfo) : null,
      })
      console.warn(`[AI分类] 文件 "${safeName}" 被分类到 "${sanitizedCategory}${sanitizedSub ? '/' + sanitizedSub : ''}"`)

      if (stage) {
        const latestProject = getProject(projectId)
        if (latestProject) {
          const progression = checkStageProgression(latestProject.current_stage, stage, sanitizedSub)
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
  }).catch(err => {
    console.warn('[AI分类] 分类失败:', (err as Error).message)
    const fallbackCategory = inferCategoryFromFilename(safeName)
    moveFileToCategory(fileId, filePath, safeName, projectPath, fallbackCategory)
  })
}

function moveFileToCategory(
  fileId: number, filePath: string, safeName: string,
  projectPath: string, category: string
): void {
  const targetDir = path.join(projectPath, category)
  fs.mkdir(targetDir, { recursive: true }).then(async () => {
    let exists = false
    try {
      await fs.stat(path.join(targetDir, safeName))
      exists = true
    } catch {
      // file doesn't exist
    }
    let targetPath = path.join(targetDir, safeName)
    if (exists) {
      const ext = path.extname(safeName)
      const base = path.basename(safeName, ext)
      targetPath = path.join(targetDir, `${base}_${Date.now()}${ext}`)
    }
    await fs.rename(filePath, targetPath)
    updateFile(fileId, { category, stored_path: targetPath })
    console.warn(`[分类] 文件 "${safeName}" 移入 "${category}"（文件名推断）`)
  }).catch(err => {
    console.error('[分类] 文件移动失败:', err)
    updateFile(fileId, { category })
  })
}

export async function handleUpload(
  projectId: number,
  fileData: { name: string; content: ArrayBuffer; type: string }
): Promise<{ success: boolean; data?: number; error?: string }> {
  if (fileData.content.byteLength > MAX_UPLOAD_BYTES) {
    return { success: false, error: `文件超过50MB限制（${(fileData.content.byteLength / 1048576).toFixed(1)}MB）` }
  }

  const { id, filePath, safeName } = await saveFileToDisk(projectId, fileData)

  const contentExtracted = await extractContent(filePath, fileData.type)

  updateFile(id, { content_extracted: contentExtracted })

  detectSignatureAsync(id, filePath, safeName)

  const project = getProject(projectId)
  const projectPath = project
    ? await resolveProjectPathForProject(project)
    : await resolveProjectPath(projectId)

  if (projectPath) {
    classifyAndMoveFile(projectId, id, filePath, safeName, contentExtracted, projectPath)
  }

  return { success: true, data: id }
}
