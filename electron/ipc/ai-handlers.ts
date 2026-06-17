import { ipcMain } from 'electron'
import { getAIService } from '../services/ai-service'
import * as fileDb from '../database/files'
import * as projectDb from '../database/projects'
import * as conversationDb from '../database/conversations'
import { getDatabase, saveDatabase } from '../database'
import { resolveProjectPath } from '../utils/project-path'
import { validateRequired, validateType, validateProjectExists, validateFileExists, validateNumberArray } from '../utils/validators'
import { handleIpcError } from '../utils/errors'
import { parseClassifyResponse } from '../utils/ai-response'
import { CLASSIFY_PROMPT_STAGES, CLASSIFY_PROMPT_CONTENT, EXTRACT_KEY_INFO_PROMPT, EXTRACT_MILESTONES_PROMPT } from '../prompts/classify'
import { ANALYZE_SYSTEM_PROMPT } from '../prompts/analyze'
import { CHAT_SYSTEM_PROMPT } from '../prompts/chat'
import { getAllSettings } from '../database/settings'
import fs from 'fs/promises'
import path from 'path'

// 角色差异化Prompt
const ROLE_HINT: Record<string, string> = {
  pm: '你面向项目经理，关注进度、风险、里程碑。',
  developer: '你面向开发工程师，关注技术方案与接口文档。',
  pre_sales: '你面向售前，关注报价、方案、客户需求。',
  customer_success: '你面向客户成功，关注验收、交接、签字完整性。',
}

export function registerAIHandlers() {
  // 进度回传通道 - 用于批量分类时发送进度
  ipcMain.on('ai:classifyProgress', (event, data: { current: number; total: number }) => {
    event.sender.send('ai:classifyProgress', data)
  })

  ipcMain.handle('ai:chat', async (_, projectId: number, message: string, contextFileIds: number[], sessionId: string) => {
    const projectIdValidation = validateRequired(projectId, 'projectId')
    if (!projectIdValidation.valid) {
      return { success: false, error: projectIdValidation.error }
    }
    
    const projectIdTypeValidation = validateType(projectId, 'number', 'projectId')
    if (!projectIdTypeValidation.valid) {
      return { success: false, error: projectIdTypeValidation.error }
    }
    
    const projectExistsValidation = validateProjectExists(projectId)
    if (!projectExistsValidation.valid) {
      return { success: false, error: projectExistsValidation.error }
    }
    
    const messageValidation = validateRequired(message, 'message')
    if (!messageValidation.valid) {
      return { success: false, error: messageValidation.error }
    }
    
    const messageTypeValidation = validateType(message, 'string', 'message')
    if (!messageTypeValidation.valid) {
      return { success: false, error: messageTypeValidation.error }
    }
    
    const contextFileIdsValidation = validateNumberArray(contextFileIds, 'contextFileIds')
    if (!contextFileIdsValidation.valid) {
      return { success: false, error: contextFileIdsValidation.error }
    }
    
    const sessionIdValidation = validateRequired(sessionId, 'sessionId')
    if (!sessionIdValidation.valid) {
      return { success: false, error: sessionIdValidation.error }
    }
    
    const sessionIdTypeValidation = validateType(sessionId, 'string', 'sessionId')
    if (!sessionIdTypeValidation.valid) {
      return { success: false, error: sessionIdTypeValidation.error }
    }

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

      // 获取用户角色设置
      const settings = getAllSettings()
      const role = settings.user_role || 'pm'
      const roleHint = ROLE_HINT[role] || ''

      // 构建消息（注入角色差异化Prompt）
      const messages = [
        { role: 'system' as const, content: `${roleHint}\n${CHAT_SYSTEM_PROMPT}` },
        { role: 'user' as const, content: `项目上下文：\n${contextContents.join('\n\n')}\n\n用户问题：${message}` }
      ]

      const aiService = getAIService()
      const response = await aiService.chat(messages)

      // 保存对话记录到数据库
      const tokenCount = response.usage?.total_tokens || 0
      conversationDb.saveChatMessage(projectId, sessionId, 'user', message, 0)
      conversationDb.saveChatMessage(projectId, sessionId, 'assistant', response.content, tokenCount)

      return { success: true, data: response.content }
    } catch (error) {
      console.error('[AI] 对话失败:', error)
      return handleIpcError(error)
    }
  })

  ipcMain.handle('ai:classify', async (_, fileId: number, categoryType?: 'stage' | 'content') => {
    const fileIdValidation = validateRequired(fileId, 'fileId')
    if (!fileIdValidation.valid) {
      return { success: false, error: fileIdValidation.error }
    }
    
    const fileIdTypeValidation = validateType(fileId, 'number', 'fileId')
    if (!fileIdTypeValidation.valid) {
      return { success: false, error: fileIdTypeValidation.error }
    }
    
    const existsValidation = validateFileExists(fileId)
    if (!existsValidation.valid) {
      return { success: false, error: existsValidation.error }
    }
    
    if (categoryType) {
      if (categoryType !== 'stage' && categoryType !== 'content') {
        return { success: false, error: 'categoryType 必须是 "stage" 或 "content"' }
      }
    }

    try {
      const file = fileDb.getFileById(fileId)

      if (!file) {
        return { success: false, error: '文件不存在' }
      }

      // 读取文件内容
      let content = file.content_extracted
      if (!content) {
        content = await fs.readFile(file.stored_path, 'utf-8').catch(() => '')
      }

      // 根据分类方式选择 prompt（优先使用用户自定义的）
      const settings = getAllSettings()
      const role = settings.user_role || 'pm'
      const roleHint = ROLE_HINT[role] || ''
      let promptTemplate: string
      if (categoryType === 'content') {
        promptTemplate = settings.classify_prompt_content || CLASSIFY_PROMPT_CONTENT
      } else {
        promptTemplate = settings.classify_prompt_stages || CLASSIFY_PROMPT_STAGES
      }
      const classifyPrompt = promptTemplate.replace(/\{content\}/g, content)

      // 调用AI分类（注入角色差异化Prompt）
      const messages = [
        { role: 'system' as const, content: roleHint },
        { role: 'user' as const, content: classifyPrompt }
      ]

      const aiService = getAIService()
      const response = await aiService.chat(messages)

      const { category, subcategory, stage: fileStage, summary, keyInfo } = parseClassifyResponse(response.content)

      // 合并关键信息到项目 metadata
      if (keyInfo) {
        try {
          const project = projectDb.getProject(file.project_id)
          if (project) {
            const existingMetadata = project.metadata ? JSON.parse(project.metadata) : {}
            const mergedMetadata: Record<string, string> = { ...existingMetadata }
            for (const [key, value] of Object.entries(keyInfo)) {
              if (typeof value === 'string' && value.trim()) {
                mergedMetadata[key] = value.trim()
              }
            }
            projectDb.updateProject(file.project_id, { metadata: JSON.stringify(mergedMetadata) })

            // 同步写入 MD 文件
            const projectPath = await resolveProjectPath(file.project_id)
            if (projectPath) {
              const infoPath = path.join(projectPath, '.ai', 'project-info.md')
              const infoMd = `# 项目关键信息

| 字段 | 值 |
|------|-----|
| 项目编号 | ${mergedMetadata.project_code || '-'} |
| 合同号 | ${mergedMetadata.contract_no || '-'} |
| 客户联系人 | ${mergedMetadata.contact_person || '-'} |
| 联系电话 | ${mergedMetadata.contact_phone || '-'} |
| 客户地址 | ${mergedMetadata.customer_address || '-'} |
| 项目名称 | ${mergedMetadata.project_name || '-'} |
`
              await fs.mkdir(path.dirname(infoPath), { recursive: true })
              await fs.writeFile(infoPath, infoMd, 'utf-8')
            }
          }
        } catch (err) {
          console.error('[AI] 关键信息保存失败:', err)
        }
      }

      // 移动文件到对应分类文件夹（与file:upload保持一致）
      const project = projectDb.getProject(file.project_id)
      if (project) {
        const projectPath = await resolveProjectPath(file.project_id)
        if (projectPath) {
          try {
            // 目标目录为「阶段/子分类」两级结构（v3.1）；无子分类时退化为阶段级
            const targetDir = subcategory
              ? path.join(projectPath, category, subcategory)
              : path.join(projectPath, category)
            const resolvedTarget = path.resolve(targetDir)

            // 路径安全校验：确保目标目录在项目目录内
            if (!resolvedTarget.startsWith(path.resolve(projectPath))) {
              console.error('[AI分类] 路径安全校验失败，category/subcategory可能包含路径穿越:', category, subcategory)
              fileDb.updateFile(fileId, { category: '未分类', subcategory: null, content_extracted: content })
              return { success: true, data: { category: '未分类', subcategory: null, stage: null, summary } }
            }

            await fs.mkdir(targetDir, { recursive: true })
            const targetPath = path.join(targetDir, path.basename(file.stored_path))
            await fs.rename(file.stored_path, targetPath)

            // 文件移动成功后，更新数据库（一次性更新 category、subcategory、stored_path、content_extracted 和 AI 分析结果）
            fileDb.updateFile(fileId, {
              category, subcategory, stored_path: targetPath, content_extracted: content,
              stage: fileStage ?? null,
              ai_summary: summary ?? null,
              ai_key_info: keyInfo ? JSON.stringify(keyInfo) : null,
            })
          } catch (err) {
            // 文件移动失败，不更新分类信息，返回错误
            console.error('[AI分类] 文件移动失败:', err)
            return { success: false, error: '文件移动失败，分类未应用', code: 'MOVE_FAILED' }
          }
        } else {
          fileDb.updateFile(fileId, {
            category, subcategory, content_extracted: content,
            stage: fileStage ?? null,
            ai_summary: summary ?? null,
            ai_key_info: keyInfo ? JSON.stringify(keyInfo) : null,
          })
        }
      } else {
        fileDb.updateFile(fileId, {
          category, subcategory, content_extracted: content,
          stage: fileStage ?? null,
          ai_summary: summary ?? null,
          ai_key_info: keyInfo ? JSON.stringify(keyInfo) : null,
        })
      }

      return { success: true, data: { category, subcategory, stage: fileStage, summary } }
    } catch (error) {
      console.error('[AI] 分类失败:', error)
      return handleIpcError(error)
    }
  })

  ipcMain.handle('ai:analyze', async (_, projectId: number) => {
    const projectIdValidation = validateRequired(projectId, 'projectId')
    if (!projectIdValidation.valid) {
      return { success: false, error: projectIdValidation.error }
    }
    
    const projectIdTypeValidation = validateType(projectId, 'number', 'projectId')
    if (!projectIdTypeValidation.valid) {
      return { success: false, error: projectIdTypeValidation.error }
    }
    
    const projectExistsValidation = validateProjectExists(projectId)
    if (!projectExistsValidation.valid) {
      return { success: false, error: projectExistsValidation.error }
    }

    try {
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
      } catch {
        // 文件不存在，忽略
      }

      // 构建文件内容
      const fileContents = unanalyzedFiles.map(f => `[${f.filename}]\n${f.content_extracted || '（无法提取内容）'}`).join('\n\n')

      // 调用AI分析（优先使用用户自定义的）
      const analyzeSettings = (await import('../database/settings')).getAllSettings()
      const analyzeSystemPrompt = analyzeSettings.analyze_prompt || ANALYZE_SYSTEM_PROMPT
      const analyzePrompt = analyzeSystemPrompt.replace('{existingSummary}', existingSummary ? `已有的项目摘要：\n${existingSummary}\n\n` : '')
      const messages = [
        { role: 'system' as const, content: analyzePrompt },
        { role: 'user' as const, content: `项目名称：${project.name}\n当前阶段：${project.current_stage}\n\n需要分析的新文件：\n${fileContents}` }
      ]

      const aiService = getAIService()
      const response = await aiService.chat(messages)

      // 保存MD文件
      await fs.mkdir(path.dirname(summaryPath), { recursive: true })
      await fs.writeFile(summaryPath, response.content, 'utf-8')

      // 提取关键信息
      try {
        const extractPrompt = EXTRACT_KEY_INFO_PROMPT.replace(/\{content\}/g, fileContents)
        const extractMessages = [
          { role: 'user' as const, content: extractPrompt }
        ]
        const extractResponse = await aiService.chat(extractMessages)

        const jsonMatch = extractResponse.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const newInfo = JSON.parse(jsonMatch[0])

          // 合并：新信息覆盖旧信息，空字符串不覆盖
          const existingMetadata = project.metadata ? JSON.parse(project.metadata) : {}
          const mergedMetadata: Record<string, string> = { ...existingMetadata }
          for (const [key, value] of Object.entries(newInfo)) {
            if (typeof value === 'string' && value.trim()) {
              mergedMetadata[key] = value.trim()
            }
          }

          // 保存到数据库
          projectDb.updateProject(projectId, { metadata: JSON.stringify(mergedMetadata) })

          // 保存MD文件
          const infoPath = path.join(projectPath, '.ai', 'project-info.md')
          const infoMd = `# 项目关键信息

| 字段 | 值 |
|------|-----|
| 项目编号 | ${mergedMetadata.project_code || '-'} |
| 合同号 | ${mergedMetadata.contract_no || '-'} |
| 客户联系人 | ${mergedMetadata.contact_person || '-'} |
| 联系电话 | ${mergedMetadata.contact_phone || '-'} |
| 客户地址 | ${mergedMetadata.customer_address || '-'} |
| 项目名称 | ${mergedMetadata.project_name || '-'} |
`
          await fs.writeFile(infoPath, infoMd, 'utf-8')
        }
      } catch (err) {
        console.error('[AI] 关键信息提取失败:', err)
      }

      // 提取里程碑
      try {
        const extractMilestonesPrompt = EXTRACT_MILESTONES_PROMPT.replace(/\{content\}/g, fileContents)
        const extractMilestonesMessages = [
          { role: 'user' as const, content: extractMilestonesPrompt }
        ]
        const extractMilestonesResponse = await aiService.chat(extractMilestonesMessages)

        const jsonMatch = extractMilestonesResponse.content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const newMilestones = JSON.parse(jsonMatch[0])

          // 合并已有里程碑
          const existingMilestones = project.milestones ? JSON.parse(project.milestones) : []
          const mergedMilestones = [...existingMilestones]

          for (const milestone of newMilestones) {
            const exists = mergedMilestones.some(
              (m: { date: string; title: string }) => m.date === milestone.date && m.title === milestone.title
            )
            if (!exists && milestone.date && milestone.title) {
              mergedMilestones.push(milestone)
            }
          }

          // 按日期排序
          mergedMilestones.sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime())

          projectDb.updateProject(projectId, { milestones: JSON.stringify(mergedMilestones) })
        }
      } catch (err) {
        console.error('[AI] 里程碑提取失败:', err)
      }

      // 更新文件的分析状态
      for (const file of unanalyzedFiles) {
        fileDb.updateFile(file.id, { is_analyzed: true })
      }

      return { success: true, data: response.content }
    } catch (error) {
      console.error('[AI] 分析失败:', error)
      return handleIpcError(error)
    }
  })

  ipcMain.handle('ai:get-history', async (_, projectId: number, sessionId?: string) => {
    const projectIdValidation = validateRequired(projectId, 'projectId')
    if (!projectIdValidation.valid) {
      return { success: false, error: projectIdValidation.error }
    }
    
    const projectIdTypeValidation = validateType(projectId, 'number', 'projectId')
    if (!projectIdTypeValidation.valid) {
      return { success: false, error: projectIdTypeValidation.error }
    }
    
    const projectExistsValidation = validateProjectExists(projectId)
    if (!projectExistsValidation.valid) {
      return { success: false, error: projectExistsValidation.error }
    }
    
    if (sessionId) {
      const sessionIdTypeValidation = validateType(sessionId, 'string', 'sessionId')
      if (!sessionIdTypeValidation.valid) {
        return { success: false, error: sessionIdTypeValidation.error }
      }
    }

    try {
      const messages = conversationDb.getChatHistory(projectId, sessionId)
      return { success: true, data: messages }
    } catch (error) {
      console.error('[AI] 获取对话历史失败:', error)
      return handleIpcError(error)
    }
  })

  ipcMain.handle('ai:get-sessions', async (_, projectId: number) => {
    const projectIdValidation = validateRequired(projectId, 'projectId')
    if (!projectIdValidation.valid) {
      return { success: false, error: projectIdValidation.error }
    }
    
    const projectIdTypeValidation = validateType(projectId, 'number', 'projectId')
    if (!projectIdTypeValidation.valid) {
      return { success: false, error: projectIdTypeValidation.error }
    }
    
    const projectExistsValidation = validateProjectExists(projectId)
    if (!projectExistsValidation.valid) {
      return { success: false, error: projectExistsValidation.error }
    }

    try {
      const sessions = conversationDb.getChatSessions(projectId)
      return { success: true, data: sessions }
    } catch (error) {
      console.error('[AI] 获取会话列表失败:', error)
      return handleIpcError(error)
    }
  })

  ipcMain.handle('ai:clear-history', async (_, projectId: number, sessionId?: string) => {
    const projectIdValidation = validateRequired(projectId, 'projectId')
    if (!projectIdValidation.valid) {
      return { success: false, error: projectIdValidation.error }
    }
    
    const projectIdTypeValidation = validateType(projectId, 'number', 'projectId')
    if (!projectIdTypeValidation.valid) {
      return { success: false, error: projectIdTypeValidation.error }
    }
    
    const projectExistsValidation = validateProjectExists(projectId)
    if (!projectExistsValidation.valid) {
      return { success: false, error: projectExistsValidation.error }
    }

    try {
      const db = getDatabase()
      if (sessionId) {
        db.run('DELETE FROM chat_messages WHERE project_id = ? AND session_id = ?', [projectId, sessionId])
      } else {
        db.run('DELETE FROM chat_messages WHERE project_id = ?', [projectId])
      }
      saveDatabase()
      return { success: true }
    } catch (error) {
      console.error('[AI] 清空对话历史失败:', error)
      return handleIpcError(error)
    }
  })
}
