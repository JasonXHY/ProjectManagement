import { ipcMain, app } from 'electron'
import * as projectDb from '../database/projects'
import fs from 'fs/promises'
import path from 'path'

// 默认阶段列表（与 src/types 中的 DEFAULT_STAGES 保持一致）
const DEFAULT_STAGES = [
  '启动', '调研', '规划', '设计', '开发',
  '测试', '部署', '运维', '评估', '归档'
]

export function registerProjectHandlers() {
  ipcMain.handle('project:create', async (_, name: string, categoryType: string, customStages?: string[]) => {
    const id = projectDb.createProject(name, categoryType as any, customStages)

    // 创建项目文件夹
    const projectPath = path.join(app.getPath('userData'), 'projects', String(id))
    await fs.mkdir(projectPath, { recursive: true })

    // 根据分类方式创建子文件夹
    if (categoryType === 'stage') {
      const stages = customStages || DEFAULT_STAGES
      for (const stage of stages) {
        await fs.mkdir(path.join(projectPath, stage), { recursive: true })
      }
    }

    // 创建.ai目录
    await fs.mkdir(path.join(projectPath, '.ai'), { recursive: true })
    await fs.mkdir(path.join(projectPath, '.ai', 'issues'), { recursive: true })
    await fs.mkdir(path.join(projectPath, '.ai', 'files'), { recursive: true })
    await fs.mkdir(path.join(projectPath, '.ai', 'progress'), { recursive: true })

    return { success: true, data: id }
  })

  ipcMain.handle('project:list', async () => {
    const projects = projectDb.listProjects()
    return { success: true, data: projects }
  })

  ipcMain.handle('project:get', async (_, id: number) => {
    const project = projectDb.getProject(id)
    return { success: true, data: project }
  })

  ipcMain.handle('project:update', async (_, id: number, data: any) => {
    projectDb.updateProject(id, data)
    return { success: true }
  })

  ipcMain.handle('project:delete', async (_, id: number) => {
    // 删除项目文件夹
    const projectPath = path.join(app.getPath('userData'), 'projects', String(id))
    await fs.rm(projectPath, { recursive: true, force: true })

    projectDb.deleteProject(id)
    return { success: true }
  })
}
