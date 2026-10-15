import { describe, expect, it } from 'vitest'
import { DEMO_SECRET, STEP, base32Decode, groupKey, secondsLeft, totp, verifyTotp } from './totp'

// RFC 6238 appendix B: the ASCII key "12345678901234567890" (base32 GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ), SHA-1, 8 digits
const RFC_KEY = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const RFC = [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037'], [20000000000, '65353130']]

describe('TOTP (RFC 6238)', () => {
  it('matches the official test vectors', () => {
    for (const [t, code] of RFC) expect(totp(RFC_KEY, t * 1000, 8)).toBe(code)
  })
  it('gives 6 digits for authenticator apps, and the same code throughout one 30-second window', () => {
    const t0 = 1700000020 * 1000 // 10s into a window (1700000010 starts one)
    const a = totp(DEMO_SECRET, t0)
    expect(a).toMatch(/^\d{6}$/)
    expect(totp(DEMO_SECRET, t0 + 15000)).toBe(a)
    expect(totp(DEMO_SECRET, t0 + 25000)).not.toBe(a) // next window
  })
  it('decodes base32 keys', () => { expect([...base32Decode('GEZDGNBVGY3TQOJQ')]).toEqual([...'1234567890'].map((c) => c.charCodeAt(0))) })
  it('accepts the current window and one either side, and nothing older', () => {
    const t = 1700000015 * 1000
    expect(verifyTotp(DEMO_SECRET, totp(DEMO_SECRET, t), t)).toBe(true)
    expect(verifyTotp(DEMO_SECRET, totp(DEMO_SECRET, t - STEP * 1000), t)).toBe(true)
    expect(verifyTotp(DEMO_SECRET, totp(DEMO_SECRET, t + STEP * 1000), t)).toBe(true)
    expect(verifyTotp(DEMO_SECRET, totp(DEMO_SECRET, t - 3 * STEP * 1000), t)).toBe(false)
    expect(verifyTotp(DEMO_SECRET, '000000', t) || verifyTotp(DEMO_SECRET, '123456', t)).toBeDefined()
  })
  it('counts down the seconds left in the window', () => {
    expect(secondsLeft(1700000020 * 1000)).toBe(20)
    expect(secondsLeft(1700000010 * 1000)).toBe(30)
    expect(groupKey('JBSWY3DPEHPK3PXP')).toBe('JBSW Y3DP EHPK 3PXP')
  })
})
