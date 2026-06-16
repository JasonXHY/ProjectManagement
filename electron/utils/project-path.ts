import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { getSetting } from '../database/settings'
import type { StageDef } from '../shared/stages'

/**
 * 清理文件名中的特殊字符
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_')
}

/**
 * 获取项目根目录（优先使用用户自定义路径）
 */
export function getProjectsRoot(): string {
  const customPath = getSetting('project_storage_path')
  if (customPath && customPath.trim()) {
    return customPath.trim()
  }
  return path.join(app.getPath('userData'), 'projects')
}

/**
 * 根据项目ID查找项目文件夹路径
 * 文件夹命名格式: {sanitized_name}_{id}
 */
export async function resolveProjectPath(projectId: number): Promise<string | null> {
  const projectsRoot = getProjectsRoot()

  // 先检查projects目录是否存在
  try {
    await fs.access(projectsRoot)
  } catch {
    // 目录不存在，创建它
    await fs.mkdir(projectsRoot, { recursive: true })
    return null
  }

  const entries = await fs.readdir(projectsRoot, { withFileTypes: true })
  const suffix = `_${projectId}`
  const match = entries.find(e => e.isDirectory() && e.name.endsWith(suffix))
  if (match) {
    return path.join(projectsRoot, match.name)
  }
  return null
}

/**
 * 创建项目文件夹（返回创建的路径）
 */
export async function createProjectDirectory(projectId: number, projectName: string): Promise<string> {
  const projectsRoot = getProjectsRoot()
  const sanitized = sanitizeFileName(projectName)
  const folderName = `${sanitized}_${projectId}`
  const projectPath = path.join(projectsRoot, folderName)

  try {
    await fs.mkdir(projectPath, { recursive: true })
  } catch (error) {
    console.error('[ProjectPath] 创建文件夹失败:', error)
    throw error
  }

  return projectPath
}

/**
 * 在项目目录下创建「阶段/子分类」两级目录结构（v3.1 §4.2）。
 * 无子分类的阶段只创建阶段级目录。
 */
export async function createStageFolders(projectPath: string, stages: StageDef[]): Promise<void> {
  for (const stage of stages) {
    const stageDir = path.join(projectPath, sanitizeFileName(stage.name))
    await fs.mkdir(stageDir, { recursive: true })
    for (const sub of stage.subcategories) {
      await fs.mkdir(path.join(stageDir, sanitizeFileName(sub)), { recursive: true })
    }
  }
}
