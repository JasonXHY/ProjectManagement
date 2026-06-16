import { describe, it, expect } from 'vitest'
import { buildStageMenuItems, parseStageMenuKey } from '../stage-menu'
import { STAGE_DEFINITIONS } from '../../../../electron/shared/stages'

// G6 — 手动分类下拉菜单（11 阶段 + 子分类）
describe('buildStageMenuItems', () => {
  const items = buildStageMenuItems()

  it('包含全部 10 个分类阶段 + 未分类（共 11 项）', () => {
    expect(items).toHaveLength(STAGE_DEFINITIONS.length + 1)
    const labels = items.map((i) => i.label)
    for (const s of STAGE_DEFINITIONS) {
      expect(labels).toContain(s.name)
    }
    expect(labels).toContain('未分类')
  })

  it('每个阶段含其子分类作为二级菜单', () => {
    const build = items.find((i) => i.label === '构建')
    expect(build?.children?.map((c) => c.label)).toEqual(['开发文档', '接口文档', '配置文档'])
  })

  it('「未分类」无子分类', () => {
    const unclassified = items.find((i) => i.label === '未分类')
    expect(unclassified?.children).toBeUndefined()
  })

  it('子分类菜单 key 编码 stage 与 subcategory', () => {
    const build = items.find((i) => i.label === '构建')
    const dev = build?.children?.find((c) => c.label === '开发文档')
    expect(parseStageMenuKey(dev!.key)).toEqual({ stage: '构建', subcategory: '开发文档' })
  })

  it('阶段本身的 key 仅编码 stage（无子分类）', () => {
    const build = items.find((i) => i.label === '构建')!
    expect(parseStageMenuKey(build.key)).toEqual({ stage: '构建', subcategory: null })
  })

  it('未分类 key 解析为 stage=未分类', () => {
    const unclassified = items.find((i) => i.label === '未分类')!
    expect(parseStageMenuKey(unclassified.key)).toEqual({ stage: '未分类', subcategory: null })
  })
})
