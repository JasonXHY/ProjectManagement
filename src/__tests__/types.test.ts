import { describe, it, expect } from 'vitest'
import {
  checkStageProgression,
  STAGE_PROGRESSION_RULES,
  DEFAULT_STAGES,
  PROJECT_STATUS,
} from '../types'

describe('checkStageProgression', () => {
  it('售前项目检测到"进行中"文件应触发推进', () => {
    const result = checkStageProgression('售前', '进行中')
    expect(result).toEqual({
      shouldProgress: true,
      targetStage: '进行中',
      detectedType: '进行中',
    })
  })

  it('进行中项目检测到"关闭"文件应触发推进（需匹配子分类）', () => {
    const result = checkStageProgression('进行中', '关闭', '验收报告')
    expect(result).toEqual({
      shouldProgress: true,
      targetStage: '关闭',
      detectedType: '关闭',
    })
  })

  it('进行中项目检测到"关闭"文件但子分类不匹配不触发推进', () => {
    expect(checkStageProgression('进行中', '关闭', '操作手册')).toBeNull()
  })

  it('售前项目检测到"关闭"文件不应触发推进（跳级）', () => {
    const result = checkStageProgression('售前', '关闭')
    expect(result).toBeNull()
  })

  it('关闭项目检测到任何文件不应触发推进', () => {
    expect(checkStageProgression('关闭', '进行中')).toBeNull()
    expect(checkStageProgression('关闭', '售前')).toBeNull()
  })

  it('进行中项目检测到"售前"文件不应触发推进（回退）', () => {
    const result = checkStageProgression('进行中', '售前')
    expect(result).toBeNull()
  })

  it('空fileStage应返回null', () => {
    expect(checkStageProgression('售前', '')).toBeNull()
    expect(checkStageProgression('售前', null as unknown as string)).toBeNull()
  })

  it('未知阶段不应触发推进', () => {
    expect(checkStageProgression('售前', '未知阶段')).toBeNull()
    expect(checkStageProgression('进行中', '需求')).toBeNull()
  })
})

describe('DEFAULT_STAGES', () => {
  it('包含3个默认阶段', () => {
    expect(DEFAULT_STAGES).toHaveLength(3)
    expect(DEFAULT_STAGES).toEqual(['售前', '进行中', '关闭'])
  })
})

describe('PROJECT_STATUS', () => {
  it('包含3个项目状态', () => {
    expect(PROJECT_STATUS).toHaveLength(3)
  })

  it('每个状态有value/label/color/bg', () => {
    PROJECT_STATUS.forEach((status) => {
      expect(status).toHaveProperty('value')
      expect(status).toHaveProperty('label')
      expect(status).toHaveProperty('color')
      expect(status).toHaveProperty('bg')
    })
  })
})

describe('STAGE_PROGRESSION_RULES', () => {
  it('定义了售前→进行中和进行中→关闭两条规则', () => {
    const rules = Object.values(STAGE_PROGRESSION_RULES)
    expect(rules).toHaveLength(2)
    expect(rules[0]).toMatchObject({ from: '售前', to: '进行中' })
    expect(rules[1]).toMatchObject({ from: '进行中', to: '关闭' })
  })
})
