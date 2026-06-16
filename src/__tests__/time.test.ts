import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatTime, formatSessionTime, formatTimeRelative } from '../utils/time'

describe('formatTime', () => {
  it('格式化时间字符串为HH:MM', () => {
    expect(formatTime('2026-06-16 14:30:00')).toMatch(/\d{2}:\d{2}/)
  })

  it('空字符串返回空', () => {
    expect(formatTime('')).toBe('')
  })

  it('null返回空', () => {
    expect(formatTime(null as unknown as string)).toBe('')
  })
})

describe('formatSessionTime', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('今天的会话显示时间', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-16T12:00:00Z'))
    const result = formatSessionTime('2026-06-16 10:30:00')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('昨天的会话显示"昨天"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-16T12:00:00Z'))
    const result = formatSessionTime('2026-06-15 10:30:00')
    expect(result).toBe('昨天')
  })

  it('空字符串返回空', () => {
    expect(formatSessionTime('')).toBe('')
  })
})

describe('formatTimeRelative', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('1小时内显示"刚刚"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-16T12:00:00Z'))
    const result = formatTimeRelative('2026-06-16 11:45:00')
    expect(result).toBe('刚刚')
  })

  it('2小时前显示"2小时前"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-16T12:00:00Z'))
    const result = formatTimeRelative('2026-06-16 10:00:00')
    expect(result).toBe('2小时前')
  })

  it('3天前显示"3天前"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-16T12:00:00Z'))
    const result = formatTimeRelative('2026-06-13 10:00:00')
    expect(result).toBe('3天前')
  })

  it('空字符串返回N/A', () => {
    expect(formatTimeRelative('')).toBe('N/A')
  })
})
