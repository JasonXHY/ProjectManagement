import { describe, it, expect } from 'vitest'
import { parseClassifyResponse } from '../../electron/utils/ai-response'

describe('parseClassifyResponse', () => {
  it('应该解析有效的JSON响应', () => {
    const content = '{"category": "需求", "stage": "需求", "summary": "这是一个需求文档"}'
    const result = parseClassifyResponse(content)
    expect(result.category).toBe('需求')
    expect(result.stage).toBe('需求')
    expect(result.summary).toBe('这是一个需求文档')
  })

  it('应该处理JSON嵌套在文本中的情况', () => {
    const content = '根据分析，该文件属于：{"category": "方案", "stage": "方案"}类别'
    const result = parseClassifyResponse(content)
    expect(result.category).toBe('方案')
    expect(result.stage).toBe('方案')
  })

  it('应该在JSON解析失败时返回纯文本作为category', () => {
    const content = '这是一个非JSON格式的响应'
    const result = parseClassifyResponse(content)
    expect(result.category).toBe('这是一个非JSON格式的响应')
    expect(result.stage).toBeNull()
  })

  it('应该处理空内容', () => {
    const result = parseClassifyResponse('')
    expect(result.category).toBe('未分类')
    expect(result.stage).toBeNull()
  })

  it('应该处理只有category字段的JSON', () => {
    const content = '{"category": "测试"}'
    const result = parseClassifyResponse(content)
    expect(result.category).toBe('测试')
    expect(result.stage).toBeNull()
    expect(result.summary).toBeNull()
  })

  it('应该提取key_info字段', () => {
    const content = '{"category": "构建", "key_info": {"version": "1.0", "author": "张三"}}'
    const result = parseClassifyResponse(content)
    expect(result.category).toBe('构建')
    expect(result.keyInfo).toEqual({ version: '1.0', author: '张三' })
  })

  // G3 — 子分类解析
  it('应该解析 subcategory 字段', () => {
    const content = '{"category": "售前", "subcategory": "报价单", "stage": "售前"}'
    const result = parseClassifyResponse(content)
    expect(result.category).toBe('售前')
    expect(result.subcategory).toBe('报价单')
  })

  it('应该解析验收阶段的待签/已签子分类', () => {
    const content = '{"category": "验收", "subcategory": "验收材料待签"}'
    const result = parseClassifyResponse(content)
    expect(result.subcategory).toBe('验收材料待签')
  })

  it('无 subcategory 字段时应回退为 null（向后兼容）', () => {
    const content = '{"category": "需求", "stage": "需求"}'
    const result = parseClassifyResponse(content)
    expect(result.subcategory).toBeNull()
  })

  it('纯文本响应时 subcategory 为 null', () => {
    const result = parseClassifyResponse('这是一个非JSON格式的响应')
    expect(result.subcategory).toBeNull()
  })
})
