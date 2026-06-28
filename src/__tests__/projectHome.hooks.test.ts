import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { Project } from '../types'

vi.mock('../services/fileService', () => ({
  fileService: {
    upload: vi.fn(),
    list: vi.fn(),
    listByCategory: vi.fn(),
    delete: vi.fn(),
    updateCategory: vi.fn(),
    getSummary: vi.fn(),
    openFolder: vi.fn(),
  },
}))

vi.mock('../services/aiService', () => ({
  aiService: {
    chat: vi.fn(),
    classify: vi.fn(),
    analyze: vi.fn(),
    getHistory: vi.fn(),
    getSessions: vi.fn(),
    clearHistory: vi.fn(),
  },
}))

vi.mock('../services/projectService', () => ({
  projectService: {
    create: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { useProjectHome } from '../components/ProjectHome/projectHome.hooks'
import { fileService } from '../services/fileService'
import { aiService } from '../services/aiService'

const mockProject: Project = {
  id: 1,
  name: '测试项目',
  current_stage: '售前',
  category_type: 'stage',
  custom_stages: null,
  folder_uuid: null,
  created_at: '2026-06-16 10:00:00',
  updated_at: '2026-06-16 10:00:00',
  milestones: null,
  metadata: null,
}

describe('useProjectHome', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fileService.listByCategory).mockResolvedValue({ success: true, data: [] })
    vi.mocked(fileService.list).mockResolvedValue({ success: true, data: [] })
    vi.mocked(window.api.file.getSummary).mockResolvedValue({ success: true, data: '' })
  })

  it('初始化时加载文件列表', async () => {
    renderHook(() => useProjectHome(mockProject))
    await waitFor(() => {
      expect(fileService.list).toHaveBeenCalled()
    })
  })

  it('handleUpload成功后重新加载文件', async () => {
    vi.mocked(fileService.upload).mockResolvedValue({ success: true, data: 1 })
    const { result } = renderHook(() => useProjectHome(mockProject))

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    await act(async () => {
      await result.current.handleUpload(file)
    })

    expect(fileService.upload).toHaveBeenCalledWith(1, file)
  })

  it('handleUpload失败时显示错误', async () => {
    vi.mocked(fileService.upload).mockResolvedValue({ success: false, error: '上传失败' })
    const { result } = renderHook(() => useProjectHome(mockProject))

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    await act(async () => {
      await result.current.handleUpload(file)
    })

    const { message } = await import('antd')
    expect(message.error).toHaveBeenCalled()
  })

  it('handleDelete成功后重新加载文件', async () => {
    vi.mocked(fileService.delete).mockResolvedValue({ success: true })
    const { result } = renderHook(() => useProjectHome(mockProject))

    await act(async () => {
      await result.current.handleDelete(1)
    })

    expect(fileService.delete).toHaveBeenCalledWith(1)
  })

  it('handleClassify成功后显示分类结果', async () => {
    vi.mocked(aiService.classify).mockResolvedValue({
      success: true,
      data: { category: '需求', subcategory: null, stage: null, summary: null },
    })
    const { result } = renderHook(() => useProjectHome(mockProject))

    await act(async () => {
      await result.current.handleClassify(1)
    })

    expect(aiService.classify).toHaveBeenCalledWith(1, 'stage')
    const { message } = await import('antd')
    expect(message.success).toHaveBeenCalledWith('分类结果：需求')
  })

  it('handleClassify传递category_type给AI', async () => {
    vi.mocked(aiService.classify).mockResolvedValue({
      success: true,
      data: { category: '文档', subcategory: null, stage: null, summary: null },
    })
    const contentProject = { ...mockProject, category_type: 'content' as const }
    const { result } = renderHook(() => useProjectHome(contentProject))

    await act(async () => {
      await result.current.handleClassify(1)
    })

    expect(aiService.classify).toHaveBeenCalledWith(1, 'content')
  })

  it('handleClassify检测阶段推进时触发Modal', async () => {
    vi.mocked(aiService.classify).mockResolvedValue({
      success: true,
      data: { category: '进行中', subcategory: null, stage: '进行中', summary: null },
    })
    const { result } = renderHook(() => useProjectHome(mockProject))

    await act(async () => {
      await result.current.handleClassify(1)
    })

    expect(result.current.progressionModal.open).toBe(true)
    expect(result.current.progressionModal.targetStage).toBe('进行中')
  })

  it('setSelectedCategory切换选中阶段', async () => {
    const { result } = renderHook(() => useProjectHome(mockProject))

    act(() => {
      result.current.setSelectedCategory('需求')
    })

    expect(result.current.selectedCategory).toBe('需求')
  })

  it('handleViewSummary设置摘要可见', async () => {
    vi.mocked(window.api.file.getSummary).mockResolvedValue({
      success: true,
      data: '项目摘要内容',
    })
    const { result } = renderHook(() => useProjectHome(mockProject))

    await act(async () => {
      await result.current.handleViewSummary()
    })

    expect(result.current.summaryVisible).toBe(true)
    expect(result.current.summaryContent).toBe('项目摘要内容')
  })

  it('allFiles始终包含全部文件用于侧边栏计数', async () => {
    const allFilesList = [
      { id: 1, filename: 'a.txt', category: '需求', project_id: 1 } as any,
      { id: 2, filename: 'b.txt', category: '测试', project_id: 1 } as any,
      { id: 3, filename: 'c.txt', category: '需求', project_id: 1 } as any,
    ]
    const demandFiles = [allFilesList[0], allFilesList[2]]

    vi.mocked(fileService.list).mockResolvedValue({ success: true, data: allFilesList })
    vi.mocked(fileService.listByCategory).mockResolvedValue({ success: true, data: demandFiles })

    const { result } = renderHook(() => useProjectHome(mockProject))

    await waitFor(() => {
      expect(result.current.allFiles.length).toBeGreaterThan(0)
    })

    expect(result.current.allFiles).toHaveLength(3)
    expect(result.current.files).toHaveLength(3)

    await act(async () => {
      result.current.setSelectedCategory('需求')
    })

    await waitFor(() => {
      expect(result.current.files).toHaveLength(2)
    })

    expect(result.current.allFiles).toHaveLength(3)
  })

  it('handleGenerateSummary调用aiService.analyze', async () => {
    const { aiService } = await import('../services/aiService')
    vi.mocked(aiService.analyze).mockResolvedValue({ success: true })

    const { result } = renderHook(() => useProjectHome(mockProject))

    await act(async () => {
      await result.current.handleGenerateSummary()
    })

    expect(aiService.analyze).toHaveBeenCalledWith(mockProject.id)
  })

  it('handleBatchClassify对未分类文件执行分类', async () => {
    const { aiService } = await import('../services/aiService')
    const { fileService } = await import('../services/fileService')

    // Mock files with no category - must be set BEFORE renderHook
    vi.mocked(fileService.list).mockResolvedValue({
      success: true,
      data: [
        { id: 1, filename: 'a.pdf', category: null, project_id: 1, subcategory: null, stage: null, stored_path: '/a.pdf', original_path: null, file_type: null, file_size: null, content_extracted: null, ai_summary: null, ai_key_info: null, is_analyzed: false, has_signature: false, signature_status: 'unsigned', created_at: '' },
        { id: 2, filename: 'b.pdf', category: null, project_id: 1, subcategory: null, stage: null, stored_path: '/b.pdf', original_path: null, file_type: null, file_size: null, content_extracted: null, ai_summary: null, ai_key_info: null, is_analyzed: false, has_signature: false, signature_status: 'unsigned', created_at: '' },
      ],
    })
    vi.mocked(aiService.classify).mockResolvedValue({ success: true, data: { category: '需求', stage: null } })

    const { result } = renderHook(() => useProjectHome(mockProject))

    await waitFor(() => {
      expect(result.current.allFiles).toHaveLength(2)
    })

    await act(async () => {
      await result.current.handleBatchClassify()
    })

    expect(aiService.classify).toHaveBeenCalled()
  })
})
