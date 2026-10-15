// Time-based one-time passwords (RFC 6238) like Google Authenticator: HMAC-SHA1, 30-second steps, 6 digits.
// Pure JavaScript (no Web Crypto) so it also works in tests and over plain http.
export const STEP = 30
export const DEMO_SECRET = 'JBSWY3DPEHPK3PXP' // base32 setup key shown on the sign-in page (demo only)

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
export function base32Decode(str) {
  const clean = String(str).toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const c of clean) bits += B32.indexOf(c).toString(2).padStart(5, '0')
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Uint8Array.from(bytes)
}

function sha1(bytes) {
  const rol = (n, s) => (n << s) | (n >>> (32 - s))
  const ml = bytes.length * 8
  const padded = [...bytes, 0x80]
  while (padded.length % 64 !== 56) padded.push(0)
  const hi = Math.floor(ml / 0x100000000), lo = ml >>> 0
  padded.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255)
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0
  for (let i = 0; i < padded.length; i += 64) {
    const w = new Array(80)
    for (let j = 0; j < 16; j++) w[j] = (padded[i + j * 4] << 24) | (padded[i + j * 4 + 1] << 16) | (padded[i + j * 4 + 2] << 8) | padded[i + j * 4 + 3]
    for (let j = 16; j < 80; j++) w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1)
    let a = h0, b = h1, c = h2, d = h3, e = h4
    for (let j = 0; j < 80; j++) {
      let f, k
      if (j < 20) { f = (b & c) | (~b & d); k = 0x5a827999 } else if (j < 40) { f = b ^ c ^ d; k = 0x6ed9eba1 } else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc } else { f = b ^ c ^ d; k = 0xca62c1d6 }
      const t = (rol(a, 5) + f + e + k + w[j]) >>> 0
      e = d; d = c; c = rol(b, 30) >>> 0; b = a; a = t
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0
  }
  const out = []
  for (const h of [h0, h1, h2, h3, h4]) out.push((h >>> 24) & 255, (h >>> 16) & 255, (h >>> 8) & 255, h & 255)
  return out
}

function hmacSha1(key, msg) {
  let k = [...key]
  if (k.length > 64) k = sha1(k)
  while (k.length < 64) k.push(0)
  const inner = sha1([...k.map((b) => b ^ 0x36), ...msg])
  return sha1([...k.map((b) => b ^ 0x5c), ...inner])
}

// the code for one 30-second window; digits is 6 for authenticator apps
export function totp(secret, atMs = Date.now(), digits = 6) {
  const counter = Math.floor(atMs / 1000 / STEP)
  const msg = []
  for (let i = 7, c = counter; i >= 0; i--, c = Math.floor(c / 256)) msg[i] = c % 256
  const h = hmacSha1(base32Decode(secret), msg)
  const off = h[19] & 0xf
  const bin = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3]
  return String(bin % 10 ** digits).padStart(digits, '0')
}

// accepts the current code and one window either side (phone and server clocks are never exactly equal)
export const verifyTotp = (secret, code, atMs = Date.now()) => [-1, 0, 1].some((d) => totp(secret, atMs + d * STEP * 1000) === String(code))
export const secondsLeft = (atMs = Date.now()) => STEP - (Math.floor(atMs / 1000) % STEP)
export const groupKey = (s) => String(s).replace(/(.{4})/g, '$1 ').trim()
