import { ipcMain, shell } from 'electron'
import { deleteFile, listFiles, getFilesByCategory, getFileById, updateFile } from '../database/files'
import { getProject } from '../database/projects'
import { resolveProjectPath, resolveProjectPathForProject, getProjectsRoot } from '../utils/project-path'
import { validateRequired, validateType, validateProjectExists, validateFileExists } from '../utils/validators'
import { handleIpcError } from '../utils/errors'
import { handleUpload } from './handlers/upload'
import fs from 'fs/promises'
import path from 'path'

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

    try {
      return await handleUpload(projectId, fileData)
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
