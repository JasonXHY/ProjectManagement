import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'

/**
 * 清理文件名中的特殊字符
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_')
}

/**
 * 获取项目根目录
 */
export function getProjectsRoot(): string {
  return path.join(app.getPath('userData'), 'projects')
}

/**
 * 根据项目ID查找项目文件夹路径
 * 文件夹命名格式: {sanitized_name}_{id}
 */
export async function resolveProjectPath(projectId: number): Promise<string | null> {
  const projectsRoot = getProjectsRoot()
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
  const projectPath = path.join(projectsRoot, `${sanitized}_${projectId}`)
  await fs.mkdir(projectPath, { recursive: true })
  return projectPath
}
