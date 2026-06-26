import { describe, it, expect } from 'vitest'
import { formatAmount, formatPercent } from '../format'

describe('formatAmount', () => {
  it('returns dash for null/undefined', () => {
    expect(formatAmount(null)).toBe('-')
    expect(formatAmount(undefined)).toBe('-')
  })

  it('formats amounts with Intl.NumberFormat', () => {
    expect(formatAmount(10000)).toBe('¥10,000.00')
    expect(formatAmount(500000)).toBe('¥500,000.00')
    expect(formatAmount(1000000)).toBe('¥1,000,000.00')
  })

  it('formats amounts < 10000', () => {
    expect(formatAmount(5000)).toBe('¥5,000.00')
    expect(formatAmount(1234)).toBe('¥1,234.00')
  })
})

describe('formatPercent', () => {
  it('formats decimal to percentage', () => {
    expect(formatPercent(0.4)).toBe('40.00%')
    expect(formatPercent(0.1234)).toBe('12.34%')
    expect(formatPercent(0)).toBe('0.00%')
  })
})
