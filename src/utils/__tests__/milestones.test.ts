import { describe, it, expect } from 'vitest'
import { parseMilestones } from '../milestones'

describe('parseMilestones', () => {
  it('returns empty array for null', () => {
    expect(parseMilestones(null)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseMilestones('')).toEqual([])
  })

  it('parses valid milestones JSON', () => {
    const milestones = [
      { date: '2026-06-01', title: '合同签署', type: 'milestone' }
    ]
    expect(parseMilestones(JSON.stringify(milestones))).toEqual(milestones)
  })

  it('returns empty array for invalid JSON', () => {
    expect(parseMilestones('invalid')).toEqual([])
  })

  it('returns empty array for non-array JSON', () => {
    expect(parseMilestones('{"key": "value"}')).toEqual([])
  })
})
