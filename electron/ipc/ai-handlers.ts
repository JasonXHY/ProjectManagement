import { ipcMain } from 'electron'
import { getAIService } from '../services/ai-service'
import * as fileDb from '../database/files'
import * as projectDb from '../database/projects'
import * as conversationDb from '../database/conversations'
import { getDatabase, saveDatabase } from '../database'
import { resolveProjectPath } from '../utils/project-path'
import fs from 'fs/promises'
import path from 'path'

// --- AI 分类 Prompt 模板 ---

export const CLASSIFY_PROMPT_STAGES = `你是一个专业的文档分类专家。请根据以下文档内容，判断它属于哪个阶段：

阶段：
- 首页：项目总览、导航页面
- 售前：销售资料、客户沟通、报价单
- 启动：项目启动会、章程、团队组建
- 需求：需求文档、用户故事、用例
- 方案：技术方案、架构设计、选型
- 构建：开发文档、代码规范、接口定义
- 测试：测试用例、测试报告、缺陷
- 上线：部署文档、发布说明、运维
- 验收：验收标准、验收报告、签字
- 转客户成功：交接文档、培训资料、FAQ
- 关闭：项目总结、复盘、归档

文档内容：
{content}

请严格返回以下JSON格式，不要包含任何其他文字：
{
  "category": "阶段名称",
  "confidence": 0.95,
  "summary": "文档内容摘要（50字以内）"
}`

export const CLASSIFY_PROMPT_CONTENT = `你是一个专业的文档分类专家。请根据以下文档内容，判断它属于哪个类别（如：文档、代码、图片、表格、方案、报告、规范、工具等）：

文档内容：
{content}

请严格返回以下JSON格式，不要包含任何其他文字：
{
  "category": "类别名称",
  "confidence": 0.95,
  "summary": "文档内容摘要（50字以内）"
}`

export function registerAIHandlers() {
  ipcMain.handle('ai:chat', async (_, projectId: number, message: string, contextFileIds: number[]) => {
    try {
      // 获取上下文文件内容
      const contextContents: string[] = []

      // 添加项目MD摘要
      const projectPath = await resolveProjectPath(projectId)
      if (!projectPath) {
        return { success: false, error: '项目文件夹不存在' }
      }
      const summaryPath = path.join(projectPath, '.ai', 'project-summary.md')
      try {
        const summary = await fs.readFile(summaryPath, 'utf-8')
        contextContents.push(`[项目摘要]\n${summary}`)
      } catch {
        // 文件不存在，忽略
      }

      // 添加用户选择的文件
      for (const fileId of contextFileIds) {
        const file = fileDb.getFileById(fileId)
        if (file?.content_extracted) {
          contextContents.push(`[${file.filename}]\n${file.content_extracted}`)
        }
      }

      // 构建消息
      const messages = [
        { role: 'system' as const, content: '你是一个专业的项目管理助手。请根据提供的项目文件和上下文，帮助用户管理项目。' },
        { role: 'user' as const, content: `项目上下文：\n${contextContents.join('\n\n')}\n\n用户问题：${message}` }
      ]

      const aiService = getAIService()
      const response = await aiService.chat(messages)

      // 保存对话记录到数据库
      const tokenCount = response.usage?.total_tokens || 0
      conversationDb.saveChatMessage(projectId, 'user', message, 0)
      conversationDb.saveChatMessage(projectId, 'assistant', response.content, tokenCount)

      return { success: true, data: response.content }
    } catch (error) {
      console.error('[AI] 对话失败:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('ai:classify', async (_, fileId: number, categoryType?: 'stage' | 'content') => {
    const file = fileDb.getFileById(fileId)

    if (!file) {
      return { success: false, error: '文件不存在' }
    }

    // 读取文件内容
    let content = file.content_extracted
    if (!content) {
      content = await fs.readFile(file.stored_path, 'utf-8').catch(() => '')
    }

    // 根据分类方式选择 prompt
    const promptTemplate = categoryType === 'content' ? CLASSIFY_PROMPT_CONTENT : CLASSIFY_PROMPT_STAGES
    const classifyPrompt = promptTemplate.replace(/\{content\}/g, content.substring(0, 2000))

    // 调用AI分类
    const messages = [
      { role: 'user' as const, content: classifyPrompt }
    ]

    const aiService = getAIService()
    const response = await aiService.chat(messages)

    // 解析AI返回的JSON
    let category: string
    let summary: string | null = null
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        category = parsed.category || '未分类'
        summary = parsed.summary || null
      } else {
        category = response.content.trim() || '未分类'
      }
    } catch {
      category = response.content.trim() || '未分类'
    }

    // 更新文件分类和内容摘要
    fileDb.updateFile(fileId, { category, content_extracted: content })

    return { success: true, data: { category, summary } }
  })

  ipcMain.handle('ai:analyze', async (_, projectId: number) => {
    const project = projectDb.getProject(projectId)
    if (!project) {
      return { success: false, error: '项目不存在' }
    }

    // 获取未分析的文件
    const unanalyzedFiles = fileDb.getUnanalyzedFiles(projectId)

    // 读取已有的MD摘要
    const projectPath = await resolveProjectPath(projectId)
    if (!projectPath) {
      return { success: false, error: '项目文件夹不存在' }
    }
    const summaryPath = path.join(projectPath, '.ai', 'project-summary.md')
    let existingSummary = ''
    try {
      existingSummary = await fs.readFile(summaryPath, 'utf-8')
    } catch {}

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

    const aiService = getAIService()
    const response = await aiService.chat(messages)

    // 保存MD文件
    await fs.writeFile(summaryPath, response.content, 'utf-8')

    // 更新文件的分析状态
    for (const file of unanalyzedFiles) {
      fileDb.updateFile(file.id, { is_analyzed: true })
    }

    return { success: true, data: response.content }
  })

  ipcMain.handle('ai:get-history', async (_, projectId: number) => {
    try {
      const messages = conversationDb.getChatHistory(projectId)
      return { success: true, data: messages }
    } catch (error) {
      console.error('[AI] 获取对话历史失败:', error)
      return { success: false, error: '获取对话历史失败' }
    }
  })

  ipcMain.handle('ai:clear-history', async (_, projectId: number) => {
    try {
      const db = getDatabase()
      db.run('DELETE FROM chat_messages WHERE project_id = ?', [projectId])
      saveDatabase()
      return { success: true }
    } catch (error) {
      console.error('[AI] 清空对话历史失败:', error)
      return { success: false, error: String(error) }
    }
  })
}
