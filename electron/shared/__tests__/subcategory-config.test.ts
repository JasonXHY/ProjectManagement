// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  getDefaultSubcategoryMap,
  parseSubcategoryConfig,
  serializeSubcategoryConfig,
  addSubcategory,
  removeSubcategory,
  isDefaultSubcategory,
} from '../subcategory-config'
import { STAGE_DEFINITIONS } from '../stages'

// G4 — 子分类配置管理（纯逻辑）
describe('getDefaultSubcategoryMap', () => {
  it('返回每个默认阶段及其默认子分类', () => {
    const map = getDefaultSubcategoryMap()
    expect(Object.keys(map)).toEqual(STAGE_DEFINITIONS.map((s) => s.name))
    expect(map['售前']).toEqual(['销售方案', '报价单', '合同原件', '客户沟通', '成本评估', 'POC材料'])
  })
})

describe('parseSubcategoryConfig', () => {
  it('null 时返回默认 map', () => {
    expect(parseSubcategoryConfig(null)).toEqual(getDefaultSubcategoryMap())
  })

  it('非法 JSON 时回退默认 map', () => {
    expect(parseSubcategoryConfig('not-json')).toEqual(getDefaultSubcategoryMap())
  })

  it('合并存储值覆盖对应阶段', () => {
    const stored = JSON.stringify({ 售前: ['销售方案', '报价单', '合同原件', '客户沟通', '成本评估', 'POC材料', '自定义子类'] })
    const map = parseSubcategoryConfig(stored)
    expect(map['售前']).toContain('自定义子类')
    // 其它阶段保持默认
    expect(map['构建']).toEqual(['开发文档', '接口文档', '配置文档'])
  })
})

describe('serializeSubcategoryConfig', () => {
  it('与 parse 往返一致', () => {
    const map = getDefaultSubcategoryMap()
    map['构建'].push('性能测试')
    const round = parseSubcategoryConfig(serializeSubcategoryConfig(map))
    expect(round['构建']).toContain('性能测试')
  })
})

describe('addSubcategory', () => {
  it('向阶段追加新子分类', () => {
    const next = addSubcategory(getDefaultSubcategoryMap(), '构建', '性能测试')
    expect(next['构建']).toContain('性能测试')
  })

  it('重复子分类不重复添加', () => {
    const next = addSubcategory(getDefaultSubcategoryMap(), '构建', '开发文档')
    expect(next['构建'].filter((s) => s === '开发文档')).toHaveLength(1)
  })

  it('不修改原 map（不可变）', () => {
    const base = getDefaultSubcategoryMap()
    addSubcategory(base, '构建', '性能测试')
    expect(base['构建']).not.toContain('性能测试')
  })
})

describe('removeSubcategory', () => {
  it('删除自定义子分类', () => {
    const withCustom = addSubcategory(getDefaultSubcategoryMap(), '构建', '性能测试')
    const next = removeSubcategory(withCustom, '构建', '性能测试')
    expect(next['构建']).not.toContain('性能测试')
  })

  it('不可删除默认子分类（保持不变）', () => {
    const next = removeSubcategory(getDefaultSubcategoryMap(), '构建', '开发文档')
    expect(next['构建']).toContain('开发文档')
  })
})

describe('isDefaultSubcategory', () => {
  it('默认子分类返回 true', () => {
    expect(isDefaultSubcategory('构建', '开发文档')).toBe(true)
    expect(isDefaultSubcategory('验收', '验收材料待签')).toBe(true)
  })

  it('自定义子分类返回 false', () => {
    expect(isDefaultSubcategory('构建', '性能测试')).toBe(false)
  })
})
