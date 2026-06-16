import { describe, it, expect, vi, beforeEach } from 'vitest'
import { projectService } from '../services/projectService'
import { fileService } from '../services/fileService'
import { aiService } from '../services/aiService'
import { configService } from '../services/configService'

describe('projectService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('create调用window.api.project.create', async () => {
    vi.mocked(window.api.project.create).mockResolvedValue({ success: true, data: 1 })
    const result = await projectService.create('测试项目', 'stage')
    expect(window.api.project.create).toHaveBeenCalledWith('测试项目', 'stage', undefined)
    expect(result.success).toBe(true)
  })

  it('list调用window.api.project.list', async () => {
    vi.mocked(window.api.project.list).mockResolvedValue({ success: true, data: [] })
    const result = await projectService.list()
    expect(window.api.project.list).toHaveBeenCalled()
    expect(result.success).toBe(true)
  })

  it('delete调用window.api.project.delete', async () => {
    vi.mocked(window.api.project.delete).mockResolvedValue({ success: true })
    const result = await projectService.delete(1)
    expect(window.api.project.delete).toHaveBeenCalledWith(1)
    expect(result.success).toBe(true)
  })

  it('update调用window.api.project.update', async () => {
    vi.mocked(window.api.project.update).mockResolvedValue({ success: true })
    const result = await projectService.update(1, { name: '新名称' })
    expect(window.api.project.update).toHaveBeenCalledWith(1, { name: '新名称' })
    expect(result.success).toBe(true)
  })
})

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('upload读取文件ArrayBuffer并调用IPC', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
    const arrayBuffer = new ArrayBuffer(7)
    vi.spyOn(mockFile, 'arrayBuffer').mockResolvedValue(arrayBuffer)
    vi.mocked(window.api.file.upload).mockResolvedValue({ success: true, data: 1 })

    const result = await fileService.upload(1, mockFile)
    expect(window.api.file.upload).toHaveBeenCalledWith(1, {
      name: 'test.txt',
      content: arrayBuffer,
      type: 'text/plain',
    })
    expect(result.success).toBe(true)
  })

  it('list调用window.api.file.list', async () => {
    vi.mocked(window.api.file.list).mockResolvedValue({ success: true, data: [] })
    const result = await fileService.list(1)
    expect(window.api.file.list).toHaveBeenCalledWith(1)
    expect(result.success).toBe(true)
  })

  it('delete调用window.api.file.delete', async () => {
    vi.mocked(window.api.file.delete).mockResolvedValue({ success: true })
    const result = await fileService.delete(1)
    expect(window.api.file.delete).toHaveBeenCalledWith(1)
    expect(result.success).toBe(true)
  })
})

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chat调用window.api.ai.chat', async () => {
    vi.mocked(window.api.ai.chat).mockResolvedValue({ success: true, data: 'AI回复' })
    const result = await aiService.chat(1, '你好', [1, 2], 'session-1')
    expect(window.api.ai.chat).toHaveBeenCalledWith(1, '你好', [1, 2], 'session-1')
    expect(result.success).toBe(true)
  })

  it('classify调用window.api.ai.classify', async () => {
    vi.mocked(window.api.ai.classify).mockResolvedValue({
      success: true,
      data: { category: '需求', stage: null, summary: null },
    })
    const result = await aiService.classify(1, 'stage')
    expect(window.api.ai.classify).toHaveBeenCalledWith(1, 'stage')
    expect(result.success).toBe(true)
  })

  it('classify不传categoryType时仅传fileId', async () => {
    vi.mocked(window.api.ai.classify).mockResolvedValue({
      success: true,
      data: { category: '需求', stage: null, summary: null },
    })
    await aiService.classify(1)
    expect(window.api.ai.classify).toHaveBeenCalledWith(1, undefined)
  })

  it('analyze调用window.api.ai.analyze', async () => {
    vi.mocked(window.api.ai.analyze).mockResolvedValue({ success: true, data: '分析结果' })
    const result = await aiService.analyze(1)
    expect(window.api.ai.analyze).toHaveBeenCalledWith(1)
    expect(result.success).toBe(true)
  })
})

describe('configService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('get调用window.api.settings.get', async () => {
    vi.mocked(window.api.settings.get).mockResolvedValue({ success: true, data: {} })
    const result = await configService.get()
    expect(window.api.settings.get).toHaveBeenCalled()
    expect(result.success).toBe(true)
  })

  it('update调用window.api.settings.update', async () => {
    vi.mocked(window.api.settings.update).mockResolvedValue({ success: true })
    const result = await configService.update({ ai_provider: 'xiaomi' })
    expect(window.api.settings.update).toHaveBeenCalledWith({ ai_provider: 'xiaomi' })
    expect(result.success).toBe(true)
  })
})
