// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { CLASSIFY_PROMPT_STAGES } from '../classify'
import { STAGE_DEFINITIONS } from '../../shared/stages'

// G3 — 分类 Prompt 含子分类 + 待签/已签 + 会议纪要规则
describe('CLASSIFY_PROMPT_STAGES', () => {
  it('包含所有阶段名', () => {
    for (const s of STAGE_DEFINITIONS) {
      expect(CLASSIFY_PROMPT_STAGES).toContain(s.name)
    }
  })

  it('包含每个阶段的子分类', () => {
    for (const s of STAGE_DEFINITIONS) {
      for (const sub of s.subcategories) {
        expect(CLASSIFY_PROMPT_STAGES).toContain(sub)
      }
    }
  })

  it('区分验收待签/已签', () => {
    expect(CLASSIFY_PROMPT_STAGES).toContain('验收材料待签')
    expect(CLASSIFY_PROMPT_STAGES).toContain('验收签字件已签')
  })

  it('包含会议纪要按内容判断归属阶段的规则', () => {
    expect(CLASSIFY_PROMPT_STAGES).toContain('会议纪要')
    expect(CLASSIFY_PROMPT_STAGES).toMatch(/会议纪要.*内容关键词|内容关键词.*阶段/s)
  })

  it('要求返回 subcategory 字段', () => {
    expect(CLASSIFY_PROMPT_STAGES).toContain('"subcategory"')
  })

  it('保留 {content} 占位符', () => {
    expect(CLASSIFY_PROMPT_STAGES).toContain('{content}')
  })
})
