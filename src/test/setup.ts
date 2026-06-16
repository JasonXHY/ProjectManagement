import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'

// 清理每个测试后的mock
afterEach(() => {
  vi.clearAllMocks()
})

// Mock window.api（Electron IPC）
Object.defineProperty(window, 'api', {
  value: {
    project: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    file: {
      upload: vi.fn(),
      list: vi.fn(),
      listByCategory: vi.fn(),
      delete: vi.fn(),
      updateCategory: vi.fn(),
      getSummary: vi.fn(),
      openFolder: vi.fn(),
      open: vi.fn(),
    },
    ai: {
      chat: vi.fn(),
      classify: vi.fn(),
      analyze: vi.fn(),
      getHistory: vi.fn(),
      getSessions: vi.fn(),
      clearHistory: vi.fn(),
      onClassifyProgress: vi.fn(),
      removeClassifyProgressListener: vi.fn(),
    },
    settings: {
      get: vi.fn(),
      update: vi.fn(),
      getModelList: vi.fn(),
      getPrompts: vi.fn(),
      browseFolder: vi.fn(),
    },
  },
})

// Mock message（AntD）
vi.mock('antd', async () => {
  const antd = await vi.importActual('antd')
  return {
    ...antd,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
    notification: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})
