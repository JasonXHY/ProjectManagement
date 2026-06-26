import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleClassify } from '../classify'

vi.mock('../../../database/files', () => ({
  getFileById: vi.fn(),
  updateFile: vi.fn(),
}))

vi.mock('../../../database/projects', () => ({
  getProject: vi.fn(),
  updateProject: vi.fn(),
}))

vi.mock('../../../services/ai-service', () => ({
  getAIService: vi.fn(() => ({
    chat: vi.fn(),
    hasProviders: vi.fn(() => true),
  })),
}))

vi.mock('../../../utils/ai-response', () => ({
  parseClassifyResponse: vi.fn(),
}))

vi.mock('../../../database/settings', () => ({
  getAllSettings: vi.fn(() => ({
    user_role: 'pm',
    classify_prompt_stages: 'Test prompt {content}',
  })),
}))

vi.mock('../../../prompts/classify', () => ({
  CLASSIFY_PROMPT_STAGES: 'Default stages prompt {content}',
  CLASSIFY_PROMPT_CONTENT: 'Default content prompt {content}',
  EXTRACT_KEY_INFO_PROMPT: '',
  EXTRACT_MILESTONES_PROMPT: '',
}))

vi.mock('../../../prompts/extract-structured', () => ({
  EXTRACT_STRUCTURED_PROMPT: 'Extract {category} from {content}',
}))

vi.mock('../../../utils/structured-merge', () => ({
  mergeStructuredData: vi.fn((existing: Record<string, unknown>, newData: Record<string, unknown>) => ({ ...existing, ...newData })),
}))

vi.mock('../../../utils/project-path', () => ({
  resolveProjectPath: vi.fn(),
  resolveProjectPathForProject: vi.fn(),
}))

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn().mockResolvedValue('file content'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('handleClassify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return error when file not found', async () => {
    const { getFileById } = await import('../../../database/files')
    vi.mocked(getFileById).mockReturnValue(null)

    const result = await handleClassify(999)

    expect(result.success).toBe(false)
    expect(result.error).toBe('文件不存在')
  })

  it('should classify file with AI and return results', async () => {
    const mockFile = {
      id: 1,
      filename: 'test.pdf',
      project_id: 1,
      stored_path: '/path/to/file.pdf',
      content_extracted: 'Test content',
    }
    const mockResult = {
      category: '需求',
      subcategory: '需求规格',
      stage: '需求',
      summary: 'Test summary',
      keyInfo: { project_name: 'Test Project' },
    }

    const { getFileById } = await import('../../../database/files')
    const { getAIService } = await import('../../../services/ai-service')
    const { parseClassifyResponse } = await import('../../../utils/ai-response')
    const { getProject } = await import('../../../database/projects')
    const { resolveProjectPathForProject } = await import('../../../utils/project-path')

    vi.mocked(getFileById).mockReturnValue(mockFile as any)
    vi.mocked(getProject).mockReturnValue({ id: 1, metadata: '{}' } as any)
    vi.mocked(resolveProjectPathForProject).mockResolvedValue('/projects/1')
    vi.mocked(getAIService).mockReturnValue({
      chat: vi.fn().mockResolvedValue({ content: 'AI response' }),
      hasProviders: vi.fn(() => true),
    } as any)
    vi.mocked(parseClassifyResponse).mockReturnValue(mockResult as any)

    const result = await handleClassify(1)

    expect(result.success).toBe(true)
    expect(result.data?.category).toBe('需求')
  })

  it('should use filename hints when AI result differs', async () => {
    const mockFile = {
      id: 2,
      filename: '蓝图文件.pdf',
      project_id: 1,
      stored_path: '/path/to/蓝图文件.pdf',
      content_extracted: 'Blueprint content',
    }
    const mockResult = {
      category: '其他',
      subcategory: null,
      stage: null,
      summary: 'Test',
      keyInfo: null,
    }

    const { getFileById } = await import('../../../database/files')
    const { getAIService } = await import('../../../services/ai-service')
    const { parseClassifyResponse } = await import('../../../utils/ai-response')
    const { getProject } = await import('../../../database/projects')
    const { resolveProjectPathForProject } = await import('../../../utils/project-path')

    vi.mocked(getFileById).mockReturnValue(mockFile as any)
    vi.mocked(getProject).mockReturnValue({ id: 1, metadata: '{}' } as any)
    vi.mocked(resolveProjectPathForProject).mockResolvedValue('/projects/1')
    vi.mocked(getAIService).mockReturnValue({
      chat: vi.fn().mockResolvedValue({ content: 'AI response' }),
      hasProviders: vi.fn(() => true),
    } as any)
    vi.mocked(parseClassifyResponse).mockReturnValue(mockResult as any)

    const result = await handleClassify(2)

    expect(result.success).toBe(true)
    expect(result.data?.category).toBe('方案')
    expect(result.data?.subcategory).toBe('蓝图')
  })
})
