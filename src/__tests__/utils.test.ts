import { describe, it, expect } from 'vitest'

describe('工具函数', () => {
  describe('文件大小格式化', () => {
    it('应该正确格式化字节', () => {
      const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      }

      expect(formatFileSize(500)).toBe('500 B')
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    })
  })
})
