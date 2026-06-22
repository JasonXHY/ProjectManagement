import { ipcMain, shell, BrowserWindow } from 'electron'
import { createFile, deleteFile, listFiles, getFilesByCategory, getFileById, updateFile } from '../database/files'
import { getProject } from '../database/projects'
import { getSetting } from '../database/settings'
import { FileExtractor } from '../services/file-extractor'
import { resolveProjectPath, resolveProjectPathForProject, getProjectsRoot } from '../utils/project-path'
import { getAIService } from '../services/ai-service'
import { SignatureDetector } from '../services/signature-detector'
import { CLASSIFY_PROMPT_STAGES } from '../prompts/classify'
import { checkStageProgression } from '../shared/stages'
import { validateRequired, validateType, validateProjectExists, validateFileExists } from '../utils/validators'
import { handleIpcError } from '../utils/errors'
import { parseClassifyResponse } from '../utils/ai-response'
import fs from 'fs/promises'
import path from 'path'

// 50MB文件大小限制
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

const VALID_CATEGORIES = ['售前', '启动', '需求', '方案', '构建', '测试', '上线', '验收', '转客户成功', '关闭', '未分类', '首页']

function sanitizeCategory(category: string): string {
  if (!category) return '未分类'
  const trimmed = category.trim()
  if (VALID_CATEGORIES.includes(trimmed)) return trimmed
  const sanitized = trimmed.replace(/[<>:"/\\|?*]/g, '').substring(0, 50)
  return sanitized || '未分类'
}

async function moveFileToCategory(
  fileId: number, filePath: string, safeName: string,
  projectPath: string, category: string
) {
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

function inferCategoryFromFilename(filename: string): string {
  const name = filename.toLowerCase()
  if (/(^|[ _-])contract([ _-]|\.)/.test(name) || /^合同/.test(name)) return '售前'
  if (/验收/.test(name)) return '验收'
  if (/结算|付款|支付/.test(name)) return '关闭'
  if (/需求|方案|设计/.test(name)) return '需求'
  if (/测试/.test(name)) return '测试'
  if (/上线|部署/.test(name)) return '上线'
  if (/启动/.test(name)) return '启动'
  return '未分类'
}

export function registerFileHandlers() {
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

    // 后端50MB校验
    if (fileData.content.byteLength > MAX_UPLOAD_BYTES) {
      return { success: false, error: `文件超过50MB限制（${(fileData.content.byteLength / 1048576).toFixed(1)}MB）` }
    }

    try {
      const project = getProject(projectId)
      const projectPath = project
        ? await resolveProjectPathForProject(project)
        : await resolveProjectPath(projectId)
      if (!projectPath) {
        return { success: false, error: '项目文件夹不存在' }
      }

      // Sanitize filename to prevent path traversal attacks
      const safeName = path.basename(fileData.name)

      // 保存文件
      const filePath = path.join(projectPath, safeName)
      await fs.writeFile(filePath, Buffer.from(fileData.content))

      // 获取文件信息
      const stats = await fs.stat(filePath)

      // 提取文件内容
      let contentExtracted: string | null = null
      try {
        const extractionSettings: Record<string, string> = {}
        for (const key of ['extraction_txt', 'extraction_pdf_text', 'extraction_pdf_scanned', 'extraction_word', 'extraction_excel', 'extraction_image']) {
          const val = getSetting(key)
          if (val) extractionSettings[key] = val
        }
        contentExtracted = await FileExtractor.extract(filePath, extractionSettings, {
          visionExtract: (img) => SignatureDetector.extractTextFromImage(img),
        })
      } catch (error) {
        console.error('文件内容提取失败:', error)
      }

      // 创建数据库记录
      const id = createFile(projectId, {
        filename: safeName,
        original_path: null,
        stored_path: filePath,
        category: null,
        subcategory: null,
        stage: null,
        file_type: fileData.type,
        file_size: stats.size,
        content_extracted: contentExtracted,
        is_analyzed: false,
        has_signature: false
      })

      // 异步检测签字（不阻塞上传）
      const ext = safeName.split('.').pop()?.toLowerCase()
      if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext || '')) {
        SignatureDetector.detectSignature(filePath).then(hasSignature => {
          if (hasSignature) {
            updateFile(id, { has_signature: true })
            console.log(`[签字检测] 文件 "${safeName}" 检测到签字`)
          }
        }).catch(err => {
          console.error('[签字检测] 检测失败:', err)
        })
      }

    // --- 自动 AI 分类（异步，不阻塞上传） ---
    if (project) {
      const aiService = getAIService()
      if (aiService.hasProviders() && contentExtracted) {
        // 自动分类始终使用stage prompt，确保AI返回stage字段用于阶段推进判断
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

            updateFile(id, {
              category: sanitizedCategory, subcategory: sanitizedSub, stage, stored_path: targetPath,
              ai_summary: summary ?? null,
              ai_key_info: keyInfo ? JSON.stringify(keyInfo) : null,
            })
            console.log(`[AI分类] 文件 "${safeName}" 被分类到 "${sanitizedCategory}${sanitizedSub ? '/' + sanitizedSub : ''}"`)

            // 检查是否触发项目阶段推进（重新读取最新项目数据，避免闭包过期）
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
        }).catch(err => {
          console.error('[AI分类] 分类失败:', err.message)
          const fallbackCategory = inferCategoryFromFilename(safeName)
          moveFileToCategory(id, filePath, safeName, projectPath, fallbackCategory)
        })
      } else if (!aiService.hasProviders()) {
        console.warn('[AI分类] 未配置AI供应商，使用文件名推断分类')
        const fallbackCategory = inferCategoryFromFilename(safeName)
        moveFileToCategory(id, filePath, safeName, projectPath, fallbackCategory)
      } else {
        const fallbackCategory = inferCategoryFromFilename(safeName)
        moveFileToCategory(id, filePath, safeName, projectPath, fallbackCategory)
      }
    }

    return { success: true, data: id }
    } catch (error) {
      console.error('[文件上传] 失败:', error)
      return handleIpcError(error)
    }
  })

  ipcMain.handle('file:list', async (_, projectId: number) => {
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

    const files = listFiles(projectId)
    return { success: true, data: files }
  })

  ipcMain.handle('file:listByCategory', async (_, projectId: number, category: string) => {
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
    
    const categoryValidation = validateRequired(category, 'category')
    if (!categoryValidation.valid) {
      return { success: false, error: categoryValidation.error }
    }
    
    const categoryTypeValidation = validateType(category, 'string', 'category')
    if (!categoryTypeValidation.valid) {
      return { success: false, error: categoryTypeValidation.error }
    }

    const files = getFilesByCategory(projectId, category)
    return { success: true, data: files }
  })

  ipcMain.handle('file:delete', async (_, id: number) => {
    const idValidation = validateRequired(id, 'id')
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error }
    }
    
    const idTypeValidation = validateType(id, 'number', 'id')
    if (!idTypeValidation.valid) {
      return { success: false, error: idTypeValidation.error }
    }
    
    const existsValidation = validateFileExists(id)
    if (!existsValidation.valid) {
      return { success: false, error: existsValidation.error }
    }

    const file = getFileById(id)
    if (!file) {
      return { success: false, error: '文件不存在' }
    }

    // Validate path safety — ensure stored_path is within the projects root
    // 使用 getProjectsRoot() 以兼容自定义存储路径（NF-01），与 file:open 保持一致
    const projectsRoot = getProjectsRoot()
    const resolvedPath = path.resolve(file.stored_path)
    if (!resolvedPath.startsWith(path.resolve(projectsRoot))) {
      return { success: false, error: '文件路径无效' }
    }

    // 删除物理文件
    try {
      await fs.rm(resolvedPath, { force: true })
    } catch (err) {
      console.error('删除物理文件失败:', err)
      // Continue to delete database record even if physical file removal fails
    }

    // 删除数据库记录
    deleteFile(id)
    return { success: true }
  })

  ipcMain.handle('file:updateCategory', async (_, id: number, category: string, subcategory?: string | null) => {
    const idValidation = validateRequired(id, 'id')
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error }
    }
    
    const idTypeValidation = validateType(id, 'number', 'id')
    if (!idTypeValidation.valid) {
      return { success: false, error: idTypeValidation.error }
    }
    
    const existsValidation = validateFileExists(id)
    if (!existsValidation.valid) {
      return { success: false, error: existsValidation.error }
    }
    
    const categoryValidation = validateRequired(category, 'category')
    if (!categoryValidation.valid) {
      return { success: false, error: categoryValidation.error }
    }
    
    const categoryTypeValidation = validateType(category, 'string', 'category')
    if (!categoryTypeValidation.valid) {
      return { success: false, error: categoryTypeValidation.error }
    }

    const file = getFileById(id)
    if (!file) {
      return { success: false, error: '文件不存在' }
    }

    const project = getProject(file.project_id)
    if (!project) {
      return { success: false, error: '项目不存在' }
    }

    const projectPath = await resolveProjectPathForProject(project)
    if (!projectPath) {
      return { success: false, error: '项目文件夹不存在' }
    }

    try {
      // 目标目录为「阶段/子分类」两级结构（v3.1）；无子分类时退化为阶段级
      const targetDir = subcategory
        ? path.join(projectPath, category, subcategory)
        : path.join(projectPath, category)
      const resolvedTarget = path.resolve(targetDir)

      if (!resolvedTarget.startsWith(path.resolve(projectPath))) {
        return { success: false, error: '无效的分类路径' }
      }

      await fs.mkdir(targetDir, { recursive: true })
      const targetPath = path.join(targetDir, path.basename(file.stored_path))

      if (file.stored_path !== targetPath) {
        await fs.rename(file.stored_path, targetPath)
        updateFile(id, { category, subcategory: subcategory ?? null, stored_path: targetPath })
      } else {
        updateFile(id, { category, subcategory: subcategory ?? null })
      }

      return { success: true }
    } catch (err) {
      console.error('[文件分类] 移动失败:', err)
      // 文件移动失败，不更新分类信息，返回错误
      return { success: false, error: '文件移动失败，分类未应用', code: 'MOVE_FAILED' }
    }
  })

  ipcMain.handle('file:getSummary', async (_, projectId: number) => {
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

    const summaryProject = getProject(projectId)
    const projectPath = summaryProject
      ? await resolveProjectPathForProject(summaryProject)
      : await resolveProjectPath(projectId)
    if (!projectPath) {
      return { success: false, error: '项目文件夹不存在' }
    }
    const summaryPath = path.join(projectPath, '.ai', 'project-summary.md')
    try {
      const content = await fs.readFile(summaryPath, 'utf-8')
      return { success: true, data: content }
    } catch {
      return { success: false, error: '摘要文件不存在' }
    }
  })

  ipcMain.handle('file:open', async (_, fileId: number) => {
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

    const file = getFileById(fileId)
    if (!file) {
      return { success: false, error: '文件不存在' }
    }

    // 校验路径安全性
    const projectsRoot = getProjectsRoot()
    const resolvedPath = path.resolve(file.stored_path)
    if (!resolvedPath.startsWith(path.resolve(projectsRoot))) {
      return { success: false, error: '文件路径无效' }
    }

    try {
      await shell.openPath(resolvedPath)
      return { success: true }
    } catch (err) {
      return handleIpcError(err)
    }
  })

  ipcMain.handle('file:openFolder', async (_, projectId: number) => {
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

    const openProject = getProject(projectId)
    const projectPath = openProject
      ? await resolveProjectPathForProject(openProject)
      : await resolveProjectPath(projectId)
    if (!projectPath) {
      return { success: false, error: '项目文件夹不存在' }
    }
    shell.openPath(projectPath)
    return { success: true }
  })
}
