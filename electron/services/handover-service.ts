import JSZip from 'jszip'
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { getProject, createProject } from '../database/projects'
import { listFiles, createFile } from '../database/files'
import { resolveProjectPathForProject, resolveProjectPath, createProjectDirectory, createStageFolders, generateProjectUuid } from '../utils/project-path'
import { getAIService } from './ai-service'
import { getSetting } from '../database/settings'
import { STAGE_DEFINITIONS, getSubcategories, type StageDef } from '../shared/stages'
import { parseSubcategoryConfig } from '../shared/subcategory-config'

export interface HandoverExportParams {
  projectId: number
  mode: 'full' | 'selective'
  selectedFiles?: string[]
  handoverNote?: string
}

export interface HandoverFileInfo {
  filename: string
  relative_path: string
  category: string | null
  subcategory: string | null
  stage: string | null
  file_type: string | null
  file_size: number | null
  content_extracted: string | null
  signature_status: string
  ai_summary: string | null
  ai_key_info: any
}

export class HandoverService {
  static async exportHandover(params: HandoverExportParams): Promise<Buffer> {
    const { projectId, mode, selectedFiles, handoverNote } = params

    const project = getProject(projectId)
    if (!project) throw new Error('项目不存在')

    const projectPath = await resolveProjectPathForProject(project)
    if (!projectPath) throw new Error('项目文件夹不存在')

    const allFiles = listFiles(projectId)
    const filesToExport = mode === 'full'
      ? allFiles
      : allFiles.filter(f => selectedFiles?.includes(f.filename))

    const zip = new JSZip()

    const handoverJSON = {
      format_version: '1.0',
      type: mode,
      project: {
        name: project.name,
        category_type: project.category_type,
        current_stage: project.current_stage,
        created_at: project.created_at,
        milestones: project.milestones ? JSON.parse(project.milestones) : [],
        metadata: project.metadata ? JSON.parse(project.metadata) : {},
      },
      files: filesToExport.map(f => ({
        filename: f.filename,
        relative_path: `files/${f.category || '未分类'}/${f.filename}`,
        category: f.category,
        subcategory: f.subcategory,
        stage: f.stage,
        file_type: f.file_type,
        file_size: f.file_size,
        content_extracted: f.content_extracted,
        signature_status: f.signature_status,
        ai_summary: f.ai_summary,
        ai_key_info: f.ai_key_info ? JSON.parse(f.ai_key_info) : null,
      })),
      handover_note: handoverNote || '',
      exported_at: new Date().toISOString(),
      exported_by: `PMAer v${app.getVersion()}`,
    }
    zip.file('handover.json', JSON.stringify(handoverJSON, null, 2))

    try {
      const summaryPath = path.join(projectPath, '.ai', 'project-summary.md')
      const summary = await fs.readFile(summaryPath, 'utf-8')
      zip.file('project-summary.md', summary)
    } catch { /* skip */ }

    if (handoverNote) {
      zip.file('context.md', handoverNote)
    }

    for (const file of filesToExport) {
      const filePath = path.join(projectPath, file.filename)
      try {
        const content = await fs.readFile(filePath)
        const category = file.category || '未分类'
        zip.file(`files/${category}/${file.filename}`, content)
      } catch { /* skip */ }
    }

    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  }

  static async previewHandover(zipPath: string): Promise<any> {
    const zipData = await fs.readFile(zipPath)
    const zip = await JSZip.loadAsync(zipData)
    const handoverJSONFile = zip.file('handover.json')
    if (!handoverJSONFile) throw new Error('无效的转交包')
    return JSON.parse(await handoverJSONFile.async('text'))
  }

  static async importHandover(zipPath: string, projectName?: string): Promise<number> {
    const data = await HandoverService.previewHandover(zipPath)

    const name = projectName || data.project?.name || '导入项目'
    const categoryType = data.project?.category_type || 'stage'
    const customStages = data.project?.custom_stages || undefined
    const currentStage = data.project?.current_stage || STAGE_DEFINITIONS[0]?.name || '售前'

    const folderUuid = generateProjectUuid()
    const projectId = createProject(name, categoryType, customStages, folderUuid)

    const projectPath = await createProjectDirectory(projectId, name, folderUuid)

    if (categoryType === 'stage') {
      const subMap = parseSubcategoryConfig(getSetting('custom_subcategories'))
      const stageNames: string[] = Array.isArray(customStages) ? customStages : STAGE_DEFINITIONS.map(s => s.name)
      const stages: StageDef[] = stageNames.map((sName: string) => ({
        name: sName,
        subcategories: subMap[sName] ?? getSubcategories(sName),
      }))
      await createStageFolders(projectPath, stages)
    }

    await fs.mkdir(path.join(projectPath, '.ai'), { recursive: true })
    await fs.mkdir(path.join(projectPath, '.ai', 'issues'), { recursive: true })
    await fs.mkdir(path.join(projectPath, '.ai', 'files'), { recursive: true })
    await fs.mkdir(path.join(projectPath, '.ai', 'progress'), { recursive: true })

    const zipData = await fs.readFile(zipPath)
    const zip = await JSZip.loadAsync(zipData)

    if (data.milestones) {
      await fs.writeFile(path.join(projectPath, '.ai', 'milestones.json'), JSON.stringify(data.milestones, null, 2))
    }
    if (data.metadata) {
      await fs.writeFile(path.join(projectPath, '.ai', 'metadata.json'), JSON.stringify(data.metadata, null, 2))
    }

    const fileEntries = data.files || []
    for (const fileEntry of fileEntries) {
      const zipFile = zip.file(fileEntry.relative_path)
      if (!zipFile) continue

      const fileContent = await zipFile.async('nodebuffer')
      const category = fileEntry.category || '未分类'
      const storedPath = path.join(projectPath, category, fileEntry.filename)

      await fs.mkdir(path.dirname(storedPath), { recursive: true })
      await fs.writeFile(storedPath, fileContent)

      createFile(projectId, {
        filename: fileEntry.filename,
        original_path: fileEntry.relative_path,
        stored_path: path.relative(projectPath, storedPath),
        category: fileEntry.category,
        subcategory: fileEntry.subcategory,
        stage: fileEntry.stage,
        file_type: fileEntry.file_type,
        file_size: fileEntry.file_size,
        content_extracted: fileEntry.content_extracted,
        is_analyzed: false,
        has_signature: false,
        signature_status: fileEntry.signature_status || 'unsigned',
        ai_summary: fileEntry.ai_summary,
        ai_key_info: fileEntry.ai_key_info ? JSON.stringify(fileEntry.ai_key_info) : null,
      })
    }

    const summaryFile = zip.file('project-summary.md')
    if (summaryFile) {
      const summaryContent = await summaryFile.async('text')
      await fs.mkdir(path.join(projectPath, '.ai'), { recursive: true })
      await fs.writeFile(path.join(projectPath, '.ai', 'project-summary.md'), summaryContent)
    }

    return projectId
  }

  static async aiSelectFiles(projectId: number, description: string): Promise<HandoverFileInfo[]> {
    const project = getProject(projectId)
    if (!project) throw new Error('项目不存在')

    const files = listFiles(projectId)
    if (files.length === 0) return []

    const fileList = files.map((f, i) => `[${i}] ${f.filename} (${f.category || '未分类'}/${f.subcategory || '-'}) - ${f.ai_summary || '无摘要'}`).join('\n')

    const prompt = `你是项目文件选择助手。根据用户描述，从以下文件列表中选择最相关的文件。

用户描述：${description}

文件列表：
${fileList}

请返回最相关文件的索引编号（JSON数组格式），例如 [0, 2, 5]。只返回JSON数组，不要其他内容。`

    const aiService = getAIService()
    const response = await aiService.chat([{ role: 'user', content: prompt }])

    let indices: number[] = []
    try {
      const jsonMatch = response.content.match(/\[[\d\s,]*\]/)
      if (jsonMatch) {
        indices = JSON.parse(jsonMatch[0])
      }
    } catch {
      indices = []
    }

    return indices
      .filter(i => i >= 0 && i < files.length)
      .map(i => {
        const f = files[i]
        return {
          filename: f.filename,
          relative_path: `files/${f.category || '未分类'}/${f.filename}`,
          category: f.category,
          subcategory: f.subcategory,
          stage: f.stage,
          file_type: f.file_type,
          file_size: f.file_size,
          content_extracted: f.content_extracted,
          signature_status: f.signature_status,
          ai_summary: f.ai_summary,
          ai_key_info: f.ai_key_info ? JSON.parse(f.ai_key_info) : null,
        }
      })
  }
}
