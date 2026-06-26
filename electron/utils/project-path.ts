import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
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
 * 打包后默认放在安装目录下的 projects 文件夹（便携模式）
 * 开发模式下放在 userData 目录
 */
export function getProjectsRoot(): string {
  const customPath = getSetting('project_storage_path')
  if (customPath && customPath.trim()) {
    return customPath.trim()
  }
  // 打包后：安装目录/projects（用户可见、方便分享）
  // 开发模式：userData/projects
  const baseDir = app.isPackaged
    ? path.dirname(app.getPath('exe'))
    : app.getPath('userData')
  return path.join(baseDir, 'projects')
}

/**
 * 生成项目 UUID（用于文件夹标识）
 */
export function generateProjectUuid(): string {
  return uuidv4()
}

/**
 * 在文件夹内写入 .uuid 标识文件
 */
async function writeUuidFile(folderPath: string, uuid: string): Promise<void> {
  const uuidPath = path.join(folderPath, '.uuid')
  await fs.writeFile(uuidPath, uuid, 'utf-8')
}

/**
 * 读取文件夹内的 .uuid 标识文件
 */
async function readUuidFile(folderPath: string): Promise<string | null> {
  try {
    const uuidPath = path.join(folderPath, '.uuid')
    const content = await fs.readFile(uuidPath, 'utf-8')
    return content.trim() || null
  } catch {
    return null
  }
}

/**
 * 根据项目UUID查找项目文件夹路径
 * 查找策略：
 *   1. 扫描 getProjectsRoot() 下所有文件夹，读取 .uuid 匹配
 *   2. fallback：按名称匹配（兼容旧版无UUID文件夹）
 */
export async function resolveProjectPath(projectId: number, folderUuid?: string | null): Promise<string | null> {
  const projectsRoot = getProjectsRoot()

  // 先检查projects目录是否存在
  try {
    await fs.stat(projectsRoot)
  } catch {
    // 目录不存在，创建它
    await fs.mkdir(projectsRoot, { recursive: true })
    return null
  }

  const entries = await fs.readdir(projectsRoot, { withFileTypes: true })
  const directories = entries.filter(e => e.isDirectory())

  // 策略1：通过 .uuid 文件匹配（精确）
  if (folderUuid) {
    for (const dir of directories) {
      const dirPath = path.join(projectsRoot, dir.name)
      const uuid = await readUuidFile(dirPath)
      if (uuid === folderUuid) {
        return dirPath
      }
    }
  }

  // 策略2：扫描所有文件夹的 .uuid 文件匹配（兜底）
  for (const dir of directories) {
    const dirPath = path.join(projectsRoot, dir.name)
    const uuid = await readUuidFile(dirPath)
    if (uuid && folderUuid && uuid === folderUuid) {
      return dirPath
    }
  }

  // 策略3：兼容旧版 — 通过 _{id} 后缀匹配
  const suffix = `_${projectId}`
  const match = directories.find(e => e.name.endsWith(suffix))
  if (match) {
    return path.join(projectsRoot, match.name)
  }

  // 策略4：按文件夹名称匹配（新命名格式无编号）
  // 由调用方传入 projectName 进行匹配（此处不实现，由 resolveProjectPathByName 处理）

  return null
}

/**
 * 根据项目名称查找项目文件夹路径（兼容新命名格式）
 * 新格式：文件夹名 = sanitized 项目名（无编号）
 */
export async function resolveProjectPathByName(projectName: string): Promise<string | null> {
  const projectsRoot = getProjectsRoot()

  try {
    await fs.stat(projectsRoot)
  } catch {
    return null
  }

  const sanitized = sanitizeFileName(projectName)
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true })

  // 精确匹配：文件夹名 == sanitized 项目名
  const exactMatch = entries.find(e => e.isDirectory() && e.name === sanitized)
  if (exactMatch) {
    return path.join(projectsRoot, exactMatch.name)
  }

  // 模糊匹配：文件夹名以 sanitized 项目名开头（兼容旧格式 "名称_id"）
  const prefixMatch = entries.find(e => e.isDirectory() && e.name.startsWith(sanitized))
  if (prefixMatch) {
    return path.join(projectsRoot, prefixMatch.name)
  }

  return null
}

/**
 * 创建项目文件夹（返回创建的路径）
 * 文件夹命名格式: {sanitized_name}（不再附带编号）
 */
export async function createProjectDirectory(projectId: number, projectName: string, folderUuid?: string): Promise<string> {
  const projectsRoot = getProjectsRoot()
  const sanitized = sanitizeFileName(projectName)
  const projectPath = path.join(projectsRoot, sanitized)

  try {
    await fs.mkdir(projectPath, { recursive: true })
  } catch (error) {
    console.error('[ProjectPath] 创建文件夹失败:', error)
    throw error
  }

  // 写入 .uuid 标识文件
  if (folderUuid) {
    await writeUuidFile(projectPath, folderUuid)
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

/**
 * 便捷方法：根据项目对象解析文件夹路径（自动传入 UUID）
 * 查找失败时会尝试名称匹配（兼容旧版文件夹命名）
 */
export async function resolveProjectPathForProject(project: { id: number; name: string; folder_uuid?: string | null }): Promise<string | null> {
  // 优先通过 UUID 查找
  const byUuid = await resolveProjectPath(project.id, project.folder_uuid)
  if (byUuid) return byUuid

  // fallback：通过名称查找（兼容无 UUID 的旧版文件夹）
  return resolveProjectPathByName(project.name)
}
