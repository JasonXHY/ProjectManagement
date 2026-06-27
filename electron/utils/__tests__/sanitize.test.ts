import { describe, it, expect } from 'vitest'
import { sanitizeCategory, sanitizeStage } from '../sanitize'

describe('sanitizeCategory', () => {
  it('returns 未分类 for empty string', () => {
    expect(sanitizeCategory('')).toBe('未分类')
  })

  it('returns valid category as-is', () => {
    expect(sanitizeCategory('售前')).toBe('售前')
    expect(sanitizeCategory('需求')).toBe('需求')
    expect(sanitizeCategory('验收')).toBe('验收')
  })

  it('returns 未分类 for unknown category', () => {
    expect(sanitizeCategory('未知阶段')).toBe('未知阶段')
  })

  it('strips illegal path characters', () => {
    expect(sanitizeCategory('方案<测试>')).toBe('方案测试')
    expect(sanitizeCategory('需求"文档"')).toBe('需求文档')
    expect(sanitizeCategory('test|file')).toBe('testfile')
  })

  it('truncates to 50 chars', () => {
    const long = 'a'.repeat(60)
    expect(sanitizeCategory(long).length).toBe(50)
  })

  it('returns 未分类 for whitespace-only', () => {
    expect(sanitizeCategory('   ')).toBe('未分类')
  })
})

describe('sanitizeStage', () => {
  it('returns null for null', () => {
    expect(sanitizeStage(null)).toBeNull()
  })

  it('returns valid project stage', () => {
    expect(sanitizeStage('售前')).toBe('售前')
    expect(sanitizeStage('进行中')).toBe('进行中')
    expect(sanitizeStage('关闭')).toBe('关闭')
  })

  it('returns valid file classification stage', () => {
    expect(sanitizeStage('需求')).toBe('需求')
    expect(sanitizeStage('上线')).toBe('上线')
  })

  it('returns null for invalid stage', () => {
    expect(sanitizeStage('非法阶段')).toBeNull()
  })
})
