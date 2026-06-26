import { ipcMain } from 'electron'
import * as projectDb from '../database/projects'
import { resolveProjectPath, resolveProjectPathForProject, createProjectDirectory, createStageFolders, generateProjectUuid } from '../utils/project-path'
import { validateRequired, validateType, validateProjectExists, validateCategoryType, validateStringArray } from '../utils/validators'
import { handleIpcError } from '../utils/errors'
import { STAGE_DEFINITIONS, getSubcategories, type StageDef } from '../shared/stages'
import { parseSubcategoryConfig } from '../shared/subcategory-config'
import { getSetting } from '../database/settings'
import fs from 'fs/promises'
import path from 'path'

interface ProjectUpdateData {
  name?: string
  category_type?: 'stage' | 'content'
  custom_stages?: string[]
  current_stage?: string
  milestones?: string
}

function isPartialProject(data: unknown): data is Partial<projectDb.Project> {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  if (obj.name !== undefined && typeof obj.name !== 'string') return false
  if (obj.current_stage !== undefined && typeof obj.current_stage !== 'string') return false
  return true
}

export function registerProjectHandlers() {
  ipcMain.handle('project:create', async (_, name: string, categoryType: string, customStages?: string[]) => {
    const nameValidation = validateRequired(name, 'name')
    if (!nameValidation.valid) {
      return { success: false, error: nameValidation.error }
    }
    
    const nameTypeValidation = validateType(name, 'string', 'name')
    if (!nameTypeValidation.valid) {
      return { success: false, error: nameTypeValidation.error }
    }
    
    const categoryTypeValidation = validateType(categoryType, 'string', 'categoryType')
    if (!categoryTypeValidation.valid) {
      return { success: false, error: categoryTypeValidation.error }
    }
    
    const categoryValidation = validateCategoryType(categoryType)
    if (!categoryValidation.valid) {
      return { success: false, error: categoryValidation.error }
    }
    
    if (customStages) {
      const stagesValidation = validateStringArray(customStages, 'customStages')
      if (!stagesValidation.valid) {
        return { success: false, error: stagesValidation.error }
      }
    }

    // 生成 UUID 用于文件夹标识
    const folderUuid = generateProjectUuid()

    // 先创建数据库记录
    const id = projectDb.createProject(name, categoryType as any, customStages, folderUuid)

    try {
      // 创建项目文件夹（UUID 写入 .uuid 文件，文件夹名不含编号）
      const projectPath = await createProjectDirectory(id, name, folderUuid)

      // 根据分类方式创建「阶段/子分类」两级目录结构（v3.1 §4.2）
      if (categoryType === 'stage') {
        // 读取用户自定义子分类配置（未配置时为默认）
        const subMap = parseSubcategoryConfig(getSetting('custom_subcategories'))
        // 自定义阶段（扁平字符串）映射为带子分类的定义；未自定义阶段时用默认阶段列表
        const stageNames = customStages ?? STAGE_DEFINITIONS.map((s) => s.name)
        const stages: StageDef[] = stageNames.map((name) => ({
          name,
          subcategories: subMap[name] ?? getSubcategories(name),
        }))
        await createStageFolders(projectPath, stages)
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
      return handleIpcError(error)
    }
  })

  ipcMain.handle('project:list', async () => {
    const projects = projectDb.listProjects()
    return { success: true, data: projects }
  })

  ipcMain.handle('project:get', async (_, id: number) => {
    const idValidation = validateRequired(id, 'id')
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error }
    }
    
    const idTypeValidation = validateType(id, 'number', 'id')
    if (!idTypeValidation.valid) {
      return { success: false, error: idTypeValidation.error }
    }
    
    const existsValidation = validateProjectExists(id)
    if (!existsValidation.valid) {
      return { success: false, error: existsValidation.error }
    }

    const project = projectDb.getProject(id)
    return { success: true, data: project }
  })

  ipcMain.handle('project:update', async (_, id: number, data: ProjectUpdateData) => {
    const idValidation = validateRequired(id, 'id')
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error }
    }
    
    const idTypeValidation = validateType(id, 'number', 'id')
    if (!idTypeValidation.valid) {
      return { success: false, error: idTypeValidation.error }
    }
    
    const existsValidation = validateProjectExists(id)
    if (!existsValidation.valid) {
      return { success: false, error: existsValidation.error }
    }
    
    const dataValidation = validateType(data, 'object', 'data')
    if (!dataValidation.valid) {
      return { success: false, error: dataValidation.error }
    }

    try {
      if (!isPartialProject(data)) {
        return { success: false, error: '无效的项目数据' }
      }
      projectDb.updateProject(id, data)
      return { success: true }
    } catch (error) {
      console.error('[项目更新] 失败:', error)
      return handleIpcError(error)
    }
  })

  ipcMain.handle('project:delete', async (_, id: number) => {
    const idValidation = validateRequired(id, 'id')
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error }
    }
    
    const idTypeValidation = validateType(id, 'number', 'id')
    if (!idTypeValidation.valid) {
      return { success: false, error: idTypeValidation.error }
    }
    
    const existsValidation = validateProjectExists(id)
    if (!existsValidation.valid) {
      return { success: false, error: existsValidation.error }
    }

    try {
      // 先获取项目信息（用于文件夹路径查找）
      const deleteProject = projectDb.getProject(id)

      // 先删除数据库记录（确保即使文件系统删除失败，数据库也不会留下孤儿记录）
      projectDb.deleteProject(id)

      // 再删除文件系统
      const projectPath = deleteProject
        ? await resolveProjectPathForProject(deleteProject)
        : await resolveProjectPath(id)
      if (projectPath) {
        await fs.rm(projectPath, { recursive: true, force: true })
      }

      return { success: true }
    } catch (error) {
      console.error('[项目删除] 失败:', error)
      return handleIpcError(error)
    }
  })

  ipcMain.handle('project:checkFolder', async (_, id: number) => {
    const idValidation = validateRequired(id, 'id')
    if (!idValidation.valid) {
      return { success: false, error: idValidation.error }
    }

    const idTypeValidation = validateType(id, 'number', 'id')
    if (!idTypeValidation.valid) {
      return { success: false, error: idTypeValidation.error }
    }

    const project = projectDb.getProject(id)
    if (!project) {
      return { success: false, exists: false, error: '项目不存在' }
    }

    const projectPath = await resolveProjectPathForProject(project)
    return { success: true, exists: !!projectPath, path: projectPath }
  })
}
