import { ipcMain, app } from 'electron'
import * as projectDb from '../database/projects'
import { sanitizeFileName, resolveProjectPath, createProjectDirectory } from '../utils/project-path'
import fs from 'fs/promises'
import path from 'path'

// 默认11个阶段
const DEFAULT_STAGES = [
  '首页', '售前', '启动', '需求', '方案',
  '构建', '测试', '上线', '验收', '转客户成功', '关闭'
]

export function registerProjectHandlers() {
  ipcMain.handle('project:create', async (_, name: string, categoryType: string, customStages?: string[]) => {
    const id = projectDb.createProject(name, categoryType as any, customStages)

    // 创建项目文件夹（使用项目名称作为目录名）
    const projectPath = await createProjectDirectory(id, name)

    // 根据分类方式创建子文件夹
    if (categoryType === 'stage') {
      const stages = customStages || DEFAULT_STAGES
      for (const stage of stages) {
        const stageDir = path.join(projectPath, sanitizeFileName(stage))
        await fs.mkdir(stageDir, { recursive: true })
      }
    }
    // 按内容/智能分类时，文件夹由AI分类后动态创建

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
    // 查找并删除项目文件夹
    const projectPath = await resolveProjectPath(id)
    if (projectPath) {
      await fs.rm(projectPath, { recursive: true, force: true })
    }

    projectDb.deleteProject(id)
    return { success: true }
  })
}
