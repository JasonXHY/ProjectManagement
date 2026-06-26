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

  // T1 — 扩展AI提取字段
  it('要求返回 customer_name 字段', () => {
    expect(CLASSIFY_PROMPT_STAGES).toContain('customer_name')
  })

  it('要求返回 contract_amount 字段', () => {
    expect(CLASSIFY_PROMPT_STAGES).toContain('contract_amount')
  })

  it('要求返回 contract_items 字段', () => {
    expect(CLASSIFY_PROMPT_STAGES).toContain('contract_items')
  })

  it('JSON返回格式包含新字段的占位', () => {
    const jsonSection = CLASSIFY_PROMPT_STAGES.substring(
      CLASSIFY_PROMPT_STAGES.indexOf('{', CLASSIFY_PROMPT_STAGES.indexOf('JSON'))
    )
    expect(jsonSection).toContain('"customer_name"')
    expect(jsonSection).toContain('"contract_amount"')
    expect(jsonSection).toContain('"contract_items"')
  })

  // T6 — 签字验收文件分类增强
  it('包含文件用途vs内容判断规则', () => {
    expect(CLASSIFY_PROMPT_STAGES).toMatch(/用途|文件名|签字|验收/)
  })

  it('包含验收文件识别规则', () => {
    expect(CLASSIFY_PROMPT_STAGES).toMatch(/验收.*签字|签字.*验收/)
  })

  it('包含文件名启发式提示', () => {
    expect(CLASSIFY_PROMPT_STAGES).toMatch(/文件名.*验收|文件名.*签字/)
  })
})
