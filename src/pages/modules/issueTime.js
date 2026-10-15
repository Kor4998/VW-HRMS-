// "1w 2d 3h 30m" <-> minutes. 1w = 5d, 1d = 8h (Jira's working-time defaults).
const UNIT = { w: 2400, d: 480, h: 60, m: 1 }

export function parseDur(text) {
  let total = 0
  let hit = false
  String(text || '').replace(/(\d+(?:\.\d+)?)\s*([wdhm])/gi, (_, n, u) => { total += parseFloat(n) * UNIT[u.toLowerCase()]; hit = true; return '' })
  return hit ? Math.round(total) : null
}

export function fmtDur(min) {
  if (!min) return '0m'
  let m = Math.round(min)
  const out = []
  for (const [u, v] of [['w', 2400], ['d', 480], ['h', 60], ['m', 1]]) {
    const n = Math.floor(m / v)
    if (n) { out.push(`${n}${u}`); m -= n * v }
  }
  return out.join(' ')
}

let n = 0
export const wlId = () => `w${Date.now().toString(36)}${(n++).toString(36)}`
