import { ipcMain, dialog, BrowserWindow } from 'electron'
import { HandoverService } from '../services/handover-service'
import { getProject } from '../database/projects'
import { handleIpcError } from '../utils/errors'

export function registerHandoverHandlers() {
  ipcMain.handle('handover:export', async (_, params: { projectId: number, mode: 'full' | 'selective', selectedFiles?: string[], handoverNote?: string }) => {
    try {
      const { projectId, mode, selectedFiles, handoverNote } = params
      const buffer = await HandoverService.exportHandover({ projectId, mode, selectedFiles, handoverNote })
      const result = await dialog.showSaveDialog(BrowserWindow.getAllWindows()[0], {
        defaultPath: `${getProject(projectId)?.name || 'project'}.pmaer.zip`,
        filters: [{ name: 'PMAer转交包', extensions: ['pmaer.zip'] }],
      })
      if (!result.canceled && result.filePath) {
        const fs = require('fs/promises')
        await fs.writeFile(result.filePath, buffer)
        return { success: true, data: { zipPath: result.filePath, fileSize: buffer.length } }
      }
      return { success: false, error: '用户取消保存' }
    } catch (error) {
      return handleIpcError(error)
    }
  })

  ipcMain.handle('handover:import', async (_, params: { zipPath: string, projectName?: string }) => {
    try {
      const { zipPath, projectName } = params
      const projectId = await HandoverService.importHandover(zipPath, projectName)
      return { success: true, data: { projectId } }
    } catch (error) {
      return handleIpcError(error)
    }
  })

  ipcMain.handle('handover:preview', async (_, params: { zipPath: string }) => {
    try {
      const { zipPath } = params
      const data = await HandoverService.previewHandover(zipPath)
      return { success: true, data }
    } catch (error) {
      return handleIpcError(error)
    }
  })

  ipcMain.handle('handover:selectFile', async () => {
    try {
      const result = await dialog.showOpenDialog(BrowserWindow.getAllWindows()[0], {
        filters: [{ name: 'PMAer转交包', extensions: ['zip'] }],
        properties: ['openFile'],
      })
      if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, data: { filePath: result.filePaths[0] } }
      }
      return { success: false, error: '用户取消选择' }
    } catch (error) {
      return handleIpcError(error)
    }
  })

  ipcMain.handle('handover:ai-select', async (_, params: { projectId: number, description: string }) => {
    try {
      const { projectId, description } = params
      const result = await HandoverService.aiSelectFiles(projectId, description)
      return { success: true, data: result }
    } catch (error) {
      return handleIpcError(error)
    }
  })
}
