import { ipcMain, app } from 'electron'
import * as projectDb from '../database/projects'
import { sanitizeFileName, resolveProjectPath, createProjectDirectory } from '../utils/project-path'
import fs from 'fs/promises'
import path from 'path'

interface ProjectUpdateData {
  name?: string
  category_type?: 'stage' | 'content' | 'smart'
  custom_stages?: string[]
  current_stage?: string
}

// 默认11个阶段
const DEFAULT_STAGES = [
  '首页', '售前', '启动', '需求', '方案',
  '构建', '测试', '上线', '验收', '转客户成功', '关闭'
]

export function registerProjectHandlers() {
  ipcMain.handle('project:create', async (_, name: string, categoryType: string, customStages?: string[]) => {
    // 先创建数据库记录
    console.log('[Project] ========== 开始创建项目 ==========')
    console.log('[Project] 项目名称:', name)
    console.log('[Project] 分类方式:', categoryType)
    const id = projectDb.createProject(name, categoryType as any, customStages)
    console.log('[Project] 数据库记录创建成功，ID:', id)

    try {
      // 创建项目文件夹（使用项目名称作为目录名）
      console.log('[Project] 开始创建项目文件夹...')
      const projectPath = await createProjectDirectory(id, name)
      console.log('[Project] 项目文件夹路径:', projectPath)

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
    } catch (error) {
      // 如果文件系统操作失败，回滚数据库
      console.error('创建项目文件系统失败，回滚数据库:', error)
      try {
        projectDb.deleteProject(id)
      } catch (rollbackError) {
        console.error('回滚数据库失败:', rollbackError)
      }
      throw error
    }
  })

  ipcMain.handle('project:list', async () => {
    const projects = projectDb.listProjects()
    return { success: true, data: projects }
  })

  ipcMain.handle('project:get', async (_, id: number) => {
    const project = projectDb.getProject(id)
    return { success: true, data: project }
  })

  ipcMain.handle('project:update', async (_, id: number, data: ProjectUpdateData) => {
    // Cast custom_stages to string since the DB stores it as JSON-serialized string
    projectDb.updateProject(id, data as unknown as Partial<projectDb.Project>)
    return { success: true }
  })

  ipcMain.handle('project:delete', async (_, id: number) => {
    // 先删除数据库记录（确保即使文件系统删除失败，数据库也不会留下孤儿记录）
    projectDb.deleteProject(id)

    // 再删除文件系统
    const projectPath = await resolveProjectPath(id)
    if (projectPath) {
      await fs.rm(projectPath, { recursive: true, force: true })
    }

    return { success: true }
  })
}
