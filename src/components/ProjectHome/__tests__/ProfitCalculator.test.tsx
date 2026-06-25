import { describe, it, expect } from 'vitest'
import { calculateProfit, INTERNAL_UNIT_PRICES } from '../ProfitCalculator'

describe('ProfitCalculator', () => {
  it('calculates basic profit metrics', () => {
    const result = calculateProfit({
      contractAmount: 1000000,
      internalDays: 34,
      externalDays: 680,
      internalUnitPrice: 1510,
      externalUnitPrice: 1000,
      internalTravel: 23000,
      externalTravel: 0,
    })

    expect(result.internalPersonDayCost).toBe(51340)
    expect(result.internalTotalCost).toBe(74340)
    expect(result.externalPersonDayCost).toBe(680000)
    expect(result.externalTotalCost).toBe(680000)
    expect(result.totalCost).toBe(754340)
  })

  it('calculates workload ratios', () => {
    const result = calculateProfit({
      contractAmount: 1000000,
      internalDays: 100,
      externalDays: 100,
      internalUnitPrice: 1500,
      externalUnitPrice: 1200,
      internalTravel: 0,
      externalTravel: 0,
    })

    expect(result.internalWorkloadRatio).toBe(0.5)
    expect(result.externalWorkloadRatio).toBe(0.5)
  })

  it('calculates allocated contract amounts', () => {
    const result = calculateProfit({
      contractAmount: 1000000,
      internalDays: 100,
      externalDays: 100,
      internalUnitPrice: 1500,
      externalUnitPrice: 1200,
      internalTravel: 0,
      externalTravel: 0,
    })

    expect(result.internalAllocatedContract).toBe(500000)
    expect(result.externalAllocatedContract).toBe(500000)
  })

  it('calculates profit rates', () => {
    const result = calculateProfit({
      contractAmount: 1000000,
      internalDays: 100,
      externalDays: 100,
      internalUnitPrice: 1500,
      externalUnitPrice: 1200,
      internalTravel: 0,
      externalTravel: 0,
    })

    expect(result.internalProfitRate).toBeCloseTo(0.7, 2)
    expect(result.externalProfitRate).toBeCloseTo(0.76, 2)
    expect(result.overallProfitRate).toBeCloseTo(0.73, 2)
  })

  it('calculates profit amounts', () => {
    const result = calculateProfit({
      contractAmount: 1000000,
      internalDays: 100,
      externalDays: 100,
      internalUnitPrice: 1500,
      externalUnitPrice: 1200,
      internalTravel: 0,
      externalTravel: 0,
    })

    expect(result.internalProfit).toBe(350000)
    expect(result.externalProfit).toBe(380000)
    expect(result.overallProfit).toBe(730000)
  })

  it('checks red line thresholds', () => {
    const result = calculateProfit({
      contractAmount: 1000000,
      internalDays: 34,
      externalDays: 680,
      internalUnitPrice: 1510,
      externalUnitPrice: 1000,
      internalTravel: 23000,
      externalTravel: 0,
    })

    expect(result.internalProfitRate).toBeLessThan(0)
    expect(result.externalProfitRate).toBeLessThan(0.4)
    expect(result.isInternalRedLine).toBe(true)
    expect(result.isExternalRedLine).toBe(true)
  })

  it('returns correct unit prices', () => {
    expect(INTERNAL_UNIT_PRICES['实施顾问']['C2-1']).toBe(1560)
    expect(INTERNAL_UNIT_PRICES['开发工程师']['C3-1']).toBe(2550)
    expect(INTERNAL_UNIT_PRICES['运维工程师']['服务1-1']).toBe(1060)
  })
})
