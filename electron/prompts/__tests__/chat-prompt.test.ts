// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { CHAT_SYSTEM_PROMPT } from '../chat'

describe('CHAT_SYSTEM_PROMPT', () => {
  it('指导AI根据问题复杂度调整回答长度', () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/简短|简洁|详细|长度|篇幅/)
  })

  it('要求回答重点突出', () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/重点|核心|关键/)
  })

  it('包含项目管理上下文', () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/项目管理|项目经理/)
  })

  it('限制回答风格', () => {
    expect(CHAT_SYSTEM_PROMPT).toMatch(/回答|回复|响应/)
  })
})
