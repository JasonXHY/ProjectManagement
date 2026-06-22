import JSZip from 'jszip'
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'
import { getProject } from '../database/projects'
import { listFiles } from '../database/files'
import { resolveProjectPathForProject } from '../utils/project-path'

export interface HandoverExportParams {
  projectId: number
  mode: 'full' | 'selective'
  selectedFiles?: string[]
  handoverNote?: string
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
}
