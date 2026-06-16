import { describe, it, expect } from 'vitest'
import {
  STAGE_DEFINITIONS,
  FILE_CLASSIFICATION_STAGES,
  DEFAULT_STAGES,
  getSubcategories,
  type StageDef,
} from '../../electron/shared/stages'

// G1 — 子分类数据模型（依据业务需求 v3.1 §1.1）
describe('STAGE_DEFINITIONS（子分类数据模型）', () => {
  it('恰好定义 10 个文件分类阶段', () => {
    expect(STAGE_DEFINITIONS).toHaveLength(10)
  })

  it('阶段顺序与 §1.1 一致', () => {
    expect(STAGE_DEFINITIONS.map((s) => s.name)).toEqual([
      '售前', '启动', '需求', '方案', '构建', '测试', '上线', '验收', '转客户成功', '关闭',
    ])
  })

  it('每个阶段的子分类数量在 2–7 之间（§1.1 关闭=2，上线=7）', () => {
    STAGE_DEFINITIONS.forEach((s: StageDef) => {
      expect(s.subcategories.length).toBeGreaterThanOrEqual(2)
      expect(s.subcategories.length).toBeLessThanOrEqual(7)
    })
  })

  it('每个阶段的子分类无重复', () => {
    STAGE_DEFINITIONS.forEach((s) => {
      expect(new Set(s.subcategories).size).toBe(s.subcategories.length)
    })
  })

  it('子分类内容严格对照 §1.1 表格', () => {
    const map = Object.fromEntries(STAGE_DEFINITIONS.map((s) => [s.name, s.subcategories]))
    expect(map['售前']).toEqual(['销售方案', '报价单', '合同原件', '客户沟通', '成本评估', 'POC材料'])
    expect(map['启动']).toEqual(['项目章程', '团队组建', '启动会议'])
    expect(map['需求']).toEqual(['需求文档', '会议纪要', '需求变更', '客户材料', '项目计划'])
    expect(map['方案']).toEqual(['开发规格说明书', '蓝图', '方案汇报材料', '会议纪要'])
    expect(map['构建']).toEqual(['开发文档', '接口文档', '配置文档'])
    expect(map['测试']).toEqual(['测试用例', '测试报告', '测试数据', '会议纪要'])
    expect(map['上线']).toEqual(['上线切换方案', '部署文档', '操作手册', '签字材料', '初始化材料', '问题清单', '会议纪要'])
    expect(map['验收']).toEqual(['验收材料待签', '验收签字件已签', '验收报告', '项目总结'])
    expect(map['转客户成功']).toEqual(['交接文档', '培训资料', 'FAQ'])
    expect(map['关闭']).toEqual(['项目归档', '复盘总结'])
  })

  it('验收阶段区分待签与已签状态', () => {
    const acceptance = STAGE_DEFINITIONS.find((s) => s.name === '验收')
    expect(acceptance?.subcategories).toContain('验收材料待签')
    expect(acceptance?.subcategories).toContain('验收签字件已签')
  })
})

describe('FILE_CLASSIFICATION_STAGES（向后兼容的扁平数组）', () => {
  it('仍为 10 个阶段名的字符串数组（派生自 STAGE_DEFINITIONS）', () => {
    expect(FILE_CLASSIFICATION_STAGES).toEqual([
      '售前', '启动', '需求', '方案', '构建', '测试', '上线', '验收', '转客户成功', '关闭',
    ])
  })

  it('与 STAGE_DEFINITIONS 的名称保持一致（单一数据源）', () => {
    expect(FILE_CLASSIFICATION_STAGES).toEqual(STAGE_DEFINITIONS.map((s) => s.name))
  })
})

describe('DEFAULT_STAGES（项目阶段，不受影响）', () => {
  it('仍为 3 个项目阶段', () => {
    expect(DEFAULT_STAGES).toEqual(['售前', '进行中', '关闭'])
  })
})

describe('getSubcategories(stageName)', () => {
  it('返回指定阶段的子分类', () => {
    expect(getSubcategories('构建')).toEqual(['开发文档', '接口文档', '配置文档'])
  })

  it('未知阶段返回空数组', () => {
    expect(getSubcategories('不存在的阶段')).toEqual([])
  })
})
