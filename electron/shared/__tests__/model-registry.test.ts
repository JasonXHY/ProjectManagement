// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { getProviderList, getProviderById, MODEL_REGISTRY, PROVIDER_ORDER } from '../model-registry'

// G9 — 补全 AI 供应商（零一万物）
describe('AI 供应商注册表', () => {
  it('包含零一万物 (lingyiwanwu)', () => {
    const yi = getProviderById('lingyiwanwu')
    expect(yi).toBeDefined()
    expect(yi?.name).toContain('零一万物')
  })

  it('零一万物含非空模型列表与有效 baseUrl', () => {
    const yi = getProviderById('lingyiwanwu')!
    expect(yi.models.length).toBeGreaterThan(0)
    expect(yi.baseUrl).toMatch(/^https:\/\//)
  })

  it('零一万物出现在供应商列表（PROVIDER_ORDER）', () => {
    expect(PROVIDER_ORDER).toContain('lingyiwanwu')
    expect(getProviderList().some((p) => p.id === 'lingyiwanwu')).toBe(true)
  })

  it('命名供应商总数 ≥ 11（满足"11+厂商"）', () => {
    expect(Object.keys(MODEL_REGISTRY).length).toBeGreaterThanOrEqual(11)
  })
})
