// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { mergeStructuredData } from '../structured-merge'

describe('mergeStructuredData', () => {
  const emptyMetadata = {}

  it('adds new requirements to empty metadata', () => {
    const newData = {
      requirements: [{ name: '需求A', detail: '描述A', status: 'pending' }],
      key_issues: [],
      opportunities: [],
    }
    const result = mergeStructuredData(emptyMetadata, newData)
    expect(result.requirements).toHaveLength(1)
    expect(result.requirements[0].name).toBe('需求A')
  })

  it('appends requirements by fuzzy name match', () => {
    const existing = {
      requirements: [{ name: '用户登录功能', status: 'progress', source: '需求文档.md' }],
    }
    const newData = {
      requirements: [{ name: '用户登录功能', detail: '增加验证码', status: 'pending', source: '会议纪要.md' }],
    }
    const result = mergeStructuredData(existing, newData)
    expect(result.requirements).toHaveLength(1)
    expect(result.requirements[0].source).toBe('需求文档.md')
  })

  it('adds new requirement when name does not match', () => {
    const existing = {
      requirements: [{ name: '需求A', status: 'progress' }],
    }
    const newData = {
      requirements: [{ name: '需求B', status: 'pending' }],
    }
    const result = mergeStructuredData(existing, newData)
    expect(result.requirements).toHaveLength(2)
  })

  it('deduplicates key_issues by exact text match', () => {
    const existing = {
      key_issues: [{ text: '数据库连接超时', priority: 'high', status: 'open' }],
    }
    const newData = {
      key_issues: [{ text: '数据库连接超时', priority: 'high', status: 'open' }],
    }
    const result = mergeStructuredData(existing, newData)
    expect(result.key_issues).toHaveLength(1)
  })

  it('adds new key_issues when text differs', () => {
    const existing = {
      key_issues: [{ text: '问题A', priority: 'high' }],
    }
    const newData = {
      key_issues: [{ text: '问题B', priority: 'medium' }],
    }
    const result = mergeStructuredData(existing, newData)
    expect(result.key_issues).toHaveLength(2)
  })

  it('deduplicates opportunities by fuzzy name match', () => {
    const existing = {
      opportunities: [{ name: '二期建设', status: 'planned' }],
    }
    const newData = {
      opportunities: [{ name: '二期建设', description: '客户追加需求', status: 'planned' }],
    }
    const result = mergeStructuredData(existing, newData)
    expect(result.opportunities).toHaveLength(1)
    expect(result.opportunities[0].description).toBe('客户追加需求')
  })

  it('preserves existing metadata fields', () => {
    const existing = {
      project_code: 'PRJ-001',
      customer_name: '测试客户',
    }
    const newData = {
      requirements: [{ name: '需求A', status: 'pending' }],
    }
    const result = mergeStructuredData(existing, newData)
    expect(result.project_code).toBe('PRJ-001')
    expect(result.customer_name).toBe('测试客户')
    expect(result.requirements).toHaveLength(1)
  })

  it('handles empty arrays gracefully', () => {
    const existing = {
      requirements: [{ name: '需求A', status: 'progress' }],
    }
    const newData = {
      requirements: [],
      key_issues: [],
      opportunities: [],
    }
    const result = mergeStructuredData(existing, newData)
    expect(result.requirements).toHaveLength(1)
  })
})
