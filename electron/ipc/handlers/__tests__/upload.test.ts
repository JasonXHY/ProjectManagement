import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleUpload } from '../upload'

vi.mock('../../../database/files', () => ({
  createFile: vi.fn(),
  updateFile: vi.fn(),
}))

vi.mock('../../../database/projects', () => ({
  getProject: vi.fn(),
}))

vi.mock('../../../services/file-extractor', () => ({
  FileExtractor: {
    extract: vi.fn(),
  },
}))

vi.mock('../../../services/ai-service', () => ({
  getAIService: vi.fn(() => ({
    chat: vi.fn().mockResolvedValue({ content: '' }),
    hasProviders: vi.fn(() => true),
  })),
}))

vi.mock('../../../database/settings', () => ({
  getSetting: vi.fn(),
}))

vi.mock('../../../services/signature-detector', () => ({
  SignatureDetector: {
    detectSignature: vi.fn().mockResolvedValue(false),
    extractTextFromImage: vi.fn().mockResolvedValue(null),
  },
}))

vi.mock('../../../utils/project-path', () => ({
  resolveProjectPath: vi.fn(),
  resolveProjectPathForProject: vi.fn(),
}))

vi.mock('../../../prompts/classify', () => ({
  CLASSIFY_PROMPT_STAGES: 'Default stages prompt {content}',
}))

vi.mock('../../../shared/stages', () => ({
  checkStageProgression: vi.fn(),
  FILE_CLASSIFICATION_STAGES: ['售前', '启动', '需求', '方案', '构建', '测试', '上线', '验收', '转客户成功', '关闭'],
  DEFAULT_STAGES: ['售前', '进行中', '关闭'],
}))

vi.mock('../../../utils/ai-response', () => ({
  parseClassifyResponse: vi.fn(),
}))

vi.mock('../../../prompts/extract-structured', () => ({
  EXTRACT_STRUCTURED_PROMPT: 'Extract {category} from {content}',
}))

vi.mock('../../../utils/structured-merge', () => ({
  mergeStructuredData: vi.fn(),
}))

vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ size: 1024 }),
    mkdir: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    access: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('handleUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject files over 50MB', async () => {
    const largeContent = new ArrayBuffer(51 * 1024 * 1024)
    const fileData = {
      name: 'large-file.pdf',
      content: largeContent,
      type: 'application/pdf',
    }

    const result = await handleUpload(1, fileData)

    expect(result.success).toBe(false)
    expect(result.error).toContain('50MB')
  })

  it('should upload file successfully', async () => {
    const { createFile } = await import('../../../database/files')
    const { getProject } = await import('../../../database/projects')
    const { FileExtractor } = await import('../../../services/file-extractor')
    const { resolveProjectPathForProject } = await import('../../../utils/project-path')

    vi.mocked(createFile).mockReturnValue(1)
    vi.mocked(getProject).mockReturnValue({ id: 1 } as any)
    vi.mocked(FileExtractor.extract).mockResolvedValue('Extracted content')
    vi.mocked(resolveProjectPathForProject).mockResolvedValue('/projects/1')

    const smallContent = new ArrayBuffer(1024)
    const fileData = {
      name: 'test.pdf',
      content: smallContent,
      type: 'application/pdf',
    }

    const result = await handleUpload(1, fileData)

    expect(result.success).toBe(true)
    expect(result.data).toBe(1)
  })
})
