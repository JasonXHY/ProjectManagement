import { ipcMain, app } from 'electron'
import { createFile, deleteFile, listFiles, getFilesByCategory, getFileById, updateFile } from '../database/files'
import { getProject } from '../database/projects'
import { FileExtractor } from '../services/file-extractor'
import { resolveProjectPath } from '../utils/project-path'
import { getAIService } from '../services/ai-service'
import { CLASSIFY_PROMPT_STAGES, CLASSIFY_PROMPT_CONTENT } from './ai-handlers'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'

export function registerFileHandlers() {
  ipcMain.handle('file:upload', async (_, projectId: number, fileData: { name: string, content: ArrayBuffer, type: string }) => {
    const projectPath = await resolveProjectPath(projectId)
    if (!projectPath) {
      throw new Error('项目文件夹不存在')
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
      contentExtracted = await FileExtractor.extract(filePath)
    } catch (error) {
      console.error('文件内容提取失败:', error)
    }

    // 创建数据库记录
    const id = createFile(projectId, {
      project_id: projectId,
      filename: safeName,
      original_path: null,
      stored_path: filePath,
      category: null,
      stage: null,
      file_type: fileData.type,
      file_size: stats.size,
      content_extracted: contentExtracted,
      is_analyzed: false
    })

    // --- 自动 AI 分类（异步，不阻塞上传） ---
    if (contentExtracted) {
      const project = getProject(projectId)
      if (project) {
        const promptTemplate = project.category_type === 'stage'
          ? CLASSIFY_PROMPT_STAGES
          : CLASSIFY_PROMPT_CONTENT

        const classifyPrompt = promptTemplate.replace('{content}', contentExtracted.substring(0, 2000))

        getAIService().chat([
          { role: 'user', content: classifyPrompt }
        ]).then(async (result) => {
          // 解析AI返回的JSON
          let category: string
          try {
            const jsonMatch = result.content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0])
              category = parsed.category || '未分类'
            } else {
              category = result.content.trim() || '未分类'
            }
          } catch {
            category = result.content.trim() || '未分类'
          }

          // 更新文件的category字段
          updateFile(id, { category })

          // 移动文件到对应文件夹
          const targetDir = path.join(projectPath, category)
          if (!fsSync.existsSync(targetDir)) {
            fsSync.mkdirSync(targetDir, { recursive: true })
          }
          const targetPath = path.join(targetDir, safeName)
          fsSync.renameSync(filePath, targetPath)

          // 更新数据库中的stored_path
          updateFile(id, { stored_path: targetPath })

          console.log(`[AI分类] 文件 "${safeName}" 被分类到 "${category}"`)
        }).catch(err => {
          console.error('[AI分类] 分类失败:', err)
        })
      }
    }

    return { success: true, data: id }
  })

  ipcMain.handle('file:list', async (_, projectId: number) => {
    const files = listFiles(projectId)
    return { success: true, data: files }
  })

  ipcMain.handle('file:listByCategory', async (_, projectId: number, category: string) => {
    const files = getFilesByCategory(projectId, category)
    return { success: true, data: files }
  })

  ipcMain.handle('file:delete', async (_, id: number) => {
    const file = getFileById(id)
    if (!file) {
      throw new Error('文件不存在')
    }

    // Validate path safety — ensure stored_path is within the projects root
    const projectsRoot = path.join(app.getPath('userData'), 'projects')
    const resolvedPath = path.resolve(file.stored_path)
    if (!resolvedPath.startsWith(path.resolve(projectsRoot))) {
      throw new Error('文件路径无效')
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
}
