import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'

// 清理每个测试后的mock
afterEach(() => {
  vi.clearAllMocks()
})

// Mock window.api（Electron IPC）— 仅在浏览器(jsdom)环境注入；Node 环境(集成测试)跳过
if (typeof window !== 'undefined') {
// jsdom 未实现 scrollIntoView，自动滚动到底部需要它
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {}
}

// jsdom 未实现 ResizeObserver，AntD TextArea/ResizeObserver 需要它
if (!('ResizeObserver' in window)) {
  ;(window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// jsdom 未实现 matchMedia，AntD 响应式 hook 需要它
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as unknown as MediaQueryList
}

Object.defineProperty(window, 'api', {
  value: {
    project: {
      create: vi.fn(),
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      onStageProgressionNeeded: vi.fn(),
      removeStageProgressionListener: vi.fn(),
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
    handover: {
      export: vi.fn(),
      import: vi.fn(),
      preview: vi.fn(),
      aiSelect: vi.fn(),
    },
  },
})
}

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
