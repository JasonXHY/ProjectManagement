import { describe, it, expect } from 'vitest'
import { moveItem } from '../stage-order'

// G7 — 阶段排序（纯逻辑）
describe('moveItem', () => {
  it('上移：与前一项交换', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 'up')).toEqual(['b', 'a', 'c'])
  })

  it('下移：与后一项交换', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 'down')).toEqual(['a', 'c', 'b'])
  })

  it('首项上移不变', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 'up')).toEqual(['a', 'b', 'c'])
  })

  it('末项下移不变', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 'down')).toEqual(['a', 'b', 'c'])
  })

  it('越界索引返回原数组副本', () => {
    expect(moveItem(['a', 'b'], 5, 'up')).toEqual(['a', 'b'])
  })

  it('不修改原数组（不可变）', () => {
    const base = ['a', 'b', 'c']
    moveItem(base, 1, 'up')
    expect(base).toEqual(['a', 'b', 'c'])
  })
})
