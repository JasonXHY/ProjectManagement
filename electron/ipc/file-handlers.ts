import { ipcMain, app } from 'electron'
import { createFile, deleteFile, listFiles, getFilesByCategory, getFileById } from '../database/files'
import { FileExtractor } from '../services/file-extractor'
import { resolveProjectPath } from '../utils/project-path'
import fs from 'fs/promises'
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
