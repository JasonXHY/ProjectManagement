import { describe, it, expect } from 'vitest'
import { getStageStyle, STAGE_STYLE, PROJECT_STAGE_STYLE } from '../components/ProjectHome/projectHome.styles'

describe('阶段样式', () => {
  describe('getStageStyle', () => {
    it('应该返回已知阶段的样式', () => {
      const style = getStageStyle('售前')
      expect(style).toEqual({ color: '#92400E', bg: '#FEF3C7' })
    })

    it('应该返回默认样式给未知阶段', () => {
      const style = getStageStyle('未知阶段')
      expect(style).toEqual({ color: '#6B7280', bg: '#F9FAFB' })
    })

    it('应该处理空字符串', () => {
      const style = getStageStyle('')
      expect(style).toEqual({ color: '#6B7280', bg: '#F9FAFB' })
    })
  })

  describe('STAGE_STYLE', () => {
    it('应该包含所有11个分类阶段', () => {
      const expectedStages = ['所有文件', '售前', '启动', '需求', '方案', '构建', '测试', '上线', '验收', '转客户成功', '关闭', '未分类']
      expectedStages.forEach(stage => {
        expect(STAGE_STYLE[stage]).toBeDefined()
        expect(STAGE_STYLE[stage].color).toBeDefined()
        expect(STAGE_STYLE[stage].bg).toBeDefined()
      })
    })
  })

  describe('PROJECT_STAGE_STYLE', () => {
    it('应该包含3个项目阶段', () => {
      expect(PROJECT_STAGE_STYLE['售前']).toBeDefined()
      expect(PROJECT_STAGE_STYLE['进行中']).toBeDefined()
      expect(PROJECT_STAGE_STYLE['关闭']).toBeDefined()
    })
  })
})
