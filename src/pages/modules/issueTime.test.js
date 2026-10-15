import { describe, expect, it } from 'vitest'
import { fmtDur, parseDur, wlId } from './issueTime'

describe('parseDur', () => {
  it('reads Jira style durations (1w = 5d, 1d = 8h)', () => {
    expect(parseDur('2h 30m')).toBe(150)
    expect(parseDur('1d')).toBe(480)
    expect(parseDur('1w 2d 3h')).toBe(2400 + 960 + 180)
    expect(parseDur('45M')).toBe(45)
  })
  it('returns null for text with no duration', () => {
    expect(parseDur('')).toBeNull()
    expect(parseDur('soon')).toBeNull()
  })
})

describe('fmtDur', () => {
  it('formats minutes back to units', () => {
    expect(fmtDur(0)).toBe('0m')
    expect(fmtDur(90)).toBe('1h 30m')
    expect(fmtDur(480)).toBe('1d')
    expect(fmtDur(2460)).toBe('1w 1h')
  })
  it('round-trips with parseDur', () => { expect(parseDur(fmtDur(1234))).toBe(1234) })
})

describe('wlId', () => {
  it('makes unique ids', () => { expect(wlId()).not.toBe(wlId()) })
})
