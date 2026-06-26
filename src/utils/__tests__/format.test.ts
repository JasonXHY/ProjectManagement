import { describe, it, expect } from 'vitest'
import { formatAmount, formatPercent } from '../format'

describe('formatAmount', () => {
  it('formats amounts >= 10000 as wan', () => {
    expect(formatAmount(10000)).toBe('¥1.00万')
    expect(formatAmount(500000)).toBe('¥50.00万')
    expect(formatAmount(1000000)).toBe('¥100.00万')
  })

  it('formats amounts < 10000 with locale', () => {
    expect(formatAmount(5000)).toBe('¥5,000')
    expect(formatAmount(1234)).toBe('¥1,234')
  })
})

describe('formatPercent', () => {
  it('formats decimal to percentage', () => {
    expect(formatPercent(0.4)).toBe('40.00%')
    expect(formatPercent(0.1234)).toBe('12.34%')
    expect(formatPercent(0)).toBe('0.00%')
  })
})
