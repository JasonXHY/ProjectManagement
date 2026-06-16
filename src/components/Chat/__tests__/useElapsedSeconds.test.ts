import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useElapsedSeconds } from '../useElapsedSeconds'

// G8 — 等待秒数计时
describe('useElapsedSeconds', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('active=false 时为 0', () => {
    const { result } = renderHook(() => useElapsedSeconds(false))
    expect(result.current).toBe(0)
  })

  it('active 期间每秒递增', () => {
    const { result } = renderHook(() => useElapsedSeconds(true))
    expect(result.current).toBe(0)
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current).toBe(1)
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current).toBe(3)
  })

  it('active 变为 false 时归零', () => {
    const { result, rerender } = renderHook(({ a }) => useElapsedSeconds(a), {
      initialProps: { a: true },
    })
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current).toBe(2)
    rerender({ a: false })
    expect(result.current).toBe(0)
  })

  it('再次激活从 0 重新计时', () => {
    const { result, rerender } = renderHook(({ a }) => useElapsedSeconds(a), {
      initialProps: { a: false },
    })
    rerender({ a: true })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current).toBe(1)
  })
})
