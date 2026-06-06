import { ipcMain, app } from 'electron'
import * as fileDb from '../database/files'
import { getDatabase } from '../database'
import fs from 'fs/promises'
import path from 'path'

export function registerFileHandlers() {
  ipcMain.handle('file:upload', async (_, projectId: number, fileData: { name: string, content: ArrayBuffer, type: string }) => {
    const projectPath = path.join(app.getPath('userData'), 'projects', String(projectId))

    // 保存文件
    const filePath = path.join(projectPath, fileData.name)
    await fs.writeFile(filePath, Buffer.from(fileData.content))

    // 获取文件信息
    const stats = await fs.stat(filePath)

    // 创建数据库记录
    const id = fileDb.createFile(projectId, {
      project_id: projectId,
      filename: fileData.name,
      original_path: null,
      stored_path: filePath,
      category: null,
      stage: null,
      file_type: fileData.type,
      file_size: stats.size,
      content_extracted: null,
      is_analyzed: false
    })

    return { success: true, data: id }
  })

  ipcMain.handle('file:list', async (_, projectId: number) => {
    const files = fileDb.listFiles(projectId)
    return { success: true, data: files }
  })

  ipcMain.handle('file:listByCategory', async (_, projectId: number, category: string) => {
    const files = fileDb.getFilesByCategory(projectId, category)
    return { success: true, data: files }
  })

  ipcMain.handle('file:delete', async (_, id: number) => {
    const db = getDatabase()
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id) as any

    if (file) {
      // 删除物理文件
      await fs.rm(file.stored_path, { force: true })
      fileDb.deleteFile(id)
    }

    return { success: true }
  })
}
