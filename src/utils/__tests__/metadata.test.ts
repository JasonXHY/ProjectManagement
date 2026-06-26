import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseMetadata } from '../metadata'

describe('parseMetadata', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty object for null', () => {
    expect(parseMetadata(null)).toEqual({})
  })

  it('returns empty object for empty string', () => {
    expect(parseMetadata('')).toEqual({})
  })

  it('parses valid JSON', () => {
    const meta = { project_code: 'PRJ-001', contract_amount: 100000 }
    expect(parseMetadata(JSON.stringify(meta))).toEqual(meta)
  })

  it('returns empty object for invalid JSON and logs warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(parseMetadata('not valid json')).toEqual({})
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[parseMetadata]'),
      expect.any(String)
    )
  })
})
