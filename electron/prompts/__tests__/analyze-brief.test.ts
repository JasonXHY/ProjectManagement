// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { ANALYZE_SYSTEM_PROMPT } from '../analyze'

describe('ANALYZE_SYSTEM_PROMPT', () => {
  it('要求同时输出简略版本', () => {
    expect(ANALYZE_SYSTEM_PROMPT).toContain('---BRIEF---')
  })

  it('简略版本限制200字', () => {
    expect(ANALYZE_SYSTEM_PROMPT).toContain('200字')
  })
})
