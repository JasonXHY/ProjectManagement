import { ipcMain, app } from 'electron'
import { aiService } from '../services/ai-service'
import * as fileDb from '../database/files'
import * as projectDb from '../database/projects'
import { getDatabase } from '../database'
import fs from 'fs/promises'
import path from 'path'

export function registerAIHandlers() {
  ipcMain.handle('ai:chat', async (_, projectId: number, message: string, contextFileIds: number[]) => {
    // 获取上下文文件内容
    const contextContents: string[] = []

    // 添加项目MD摘要
    const projectPath = path.join(app.getPath('userData'), 'projects', String(projectId))
    const summaryPath = path.join(projectPath, '.ai', 'project-summary.md')
    try {
      const summary = await fs.readFile(summaryPath, 'utf-8')
      contextContents.push(`[项目摘要]\n${summary}`)
    } catch {
      // 文件不存在，忽略
    }

    // 添加用户选择的文件
    for (const fileId of contextFileIds) {
      const db = getDatabase()
      const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId) as any
      if (file?.content_extracted) {
        contextContents.push(`[${file.filename}]\n${file.content_extracted}`)
      }
    }

    // 构建消息
    const messages = [
      { role: 'system' as const, content: '你是一个专业的项目管理助手。请根据提供的项目文件和上下文，帮助用户管理项目。' },
      { role: 'user' as const, content: `项目上下文：\n${contextContents.join('\n\n')}\n\n用户问题：${message}` }
    ]

    const response = await aiService.chat(messages)
    return { success: true, data: response.content }
  })

  ipcMain.handle('ai:classify', async (_, fileId: number) => {
    const db = getDatabase()
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(fileId) as any

    if (!file) {
      return { success: false, error: '文件不存在' }
    }

    // 读取文件内容
    let content = file.content_extracted
    if (!content) {
      content = await fs.readFile(file.stored_path, 'utf-8').catch(() => '')
    }

    // 调用AI分类
    const messages = [
      { role: 'system' as const, content: '你是一个文件分类助手。请根据文件内容判断其属于哪个类别。只返回类别名称，不要其他内容。' },
      { role: 'user' as const, content: `文件名：${file.filename}\n文件内容：\n${content.substring(0, 2000)}` }
    ]

    const response = await aiService.chat(messages)
    const category = response.content.trim()

    // 更新文件分类
    fileDb.updateFile(fileId, { category, content_extracted: content })

    return { success: true, data: category }
  })

  ipcMain.handle('ai:analyze', async (_, projectId: number) => {
    const project = projectDb.getProject(projectId)
    if (!project) {
      return { success: false, error: '项目不存在' }
    }

    // 获取未分析的文件
    const unanalyzedFiles = fileDb.getUnanalyzedFiles(projectId)

    // 读取已有的MD摘要
    const projectPath = path.join(app.getPath('userData'), 'projects', String(projectId))
    const summaryPath = path.join(projectPath, '.ai', 'project-summary.md')
    let existingSummary = ''
    try {
      existingSummary = await fs.readFile(summaryPath, 'utf-8')
    } catch {
      // 文件不存在，忽略
    }

    // 构建文件内容
    const fileContents = unanalyzedFiles.map(f => `[${f.filename}]\n${f.content_extracted || '（无法提取内容）'}`).join('\n\n')

    // 调用AI分析
    const messages = [
      { role: 'system' as const, content: `你是一个项目分析助手。请根据提供的文件内容，生成或更新项目摘要。

${existingSummary ? `已有的项目摘要：\n${existingSummary}\n\n` : ''}

请生成包含以下内容的Markdown格式摘要：
1. 项目概述（名称、创建时间、当前阶段、文件数量）
2. 文件清单（表格形式）
3. 当前进展
4. 关键问题
5. 建议和风险` },
      { role: 'user' as const, content: `项目名称：${project.name}\n当前阶段：${project.current_stage}\n\n需要分析的新文件：\n${fileContents}` }
    ]

    const response = await aiService.chat(messages)

    // 保存MD文件
    await fs.writeFile(summaryPath, response.content, 'utf-8')

    // 更新文件的分析状态
    for (const file of unanalyzedFiles) {
      fileDb.updateFile(file.id, { is_analyzed: true })
    }

    return { success: true, data: response.content }
  })
}
