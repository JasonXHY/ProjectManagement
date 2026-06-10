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

  // 先检查projects目录是否存在
  try {
    await fs.access(projectsRoot)
  } catch {
    // 目录不存在，创建它
    console.log('[ProjectPath] projects目录不存在，创建:', projectsRoot)
    await fs.mkdir(projectsRoot, { recursive: true })
    return null
  }

  const entries = await fs.readdir(projectsRoot, { withFileTypes: true })
  const suffix = `_${projectId}`
  console.log('[ProjectPath] 查找项目文件夹，后缀:', suffix, '现有目录:', entries.map(e => e.name))
  const match = entries.find(e => e.isDirectory() && e.name.endsWith(suffix))
  if (match) {
    console.log('[ProjectPath] 找到项目文件夹:', match.name)
    return path.join(projectsRoot, match.name)
  }
  console.log('[ProjectPath] 未找到项目文件夹')
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
  console.log('[ProjectPath] 项目根目录:', projectsRoot)
  console.log('[ProjectPath] 项目名称:', projectName)
  console.log('[ProjectPath] 清理后名称:', sanitized)
  console.log('[ProjectPath] 文件夹名:', folderName)
  console.log('[ProjectPath] 完整路径:', projectPath)

  try {
    await fs.mkdir(projectPath, { recursive: true })
    console.log('[ProjectPath] 文件夹创建成功')

    // 验证文件夹是否真的创建了
    const stats = await fs.stat(projectPath)
    console.log('[ProjectPath] 文件夹存在:', stats.isDirectory())
  } catch (error) {
    console.error('[ProjectPath] 创建文件夹失败:', error)
    throw error
  }

  return projectPath
}
