import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Download, TrendingDown, TrendingUp } from 'lucide-react'
import { toast } from '@/components/toast'

// Arc "metrics dashboard" block, applied to attendance: KPI cards toggle their line on one shared chart
// (last 7 / 30 / 90 days) styled like the shadcn interactive area chart, and ranked lists. Mock data is generated deterministically.
// minutes as "1h 13m" (or "45m" under an hour)
const hm = (v) => { const m = Math.round(v); return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m` }
const KPIS = [
  { key: 'hours', label: 'Hours worked', color: '#2563EB', ph: 0, fq: 0.55, unit: 'h', base: 8.4, amp: 1.3, fmt: (v) => `${v.toFixed(1)}h`, agg: 'avg', delta: [3.2, 'up'], good: true },
  { key: 'ontime', label: 'On-time arrival', color: '#14B8A6', ph: 2.1, fq: 0.42, unit: '%', base: 88, amp: 9, fmt: (v) => `${Math.round(v)}%`, agg: 'avg', delta: [1.5, 'up'], good: true },
  { key: 'breaks', label: 'Break time', color: '#8B5CF6', ph: 4.2, fq: 0.7, unit: 'm', base: 74, amp: 16, fmt: hm, agg: 'avg', delta: [4.1, 'down'], good: true },
  { key: 'late', label: 'Late marks', color: '#94A3B8', ph: 1, fq: 0.9, unit: '', base: 0.7, amp: 0.9, fmt: (v) => `${Math.round(v)}`, agg: 'sum', delta: [0.5, 'down'], good: true },
]
const RANGES = [7, 30, 90]
const LISTS = {
  where: [['Office', 19], ['Work from home', 4], ['On duty', 1]],
  leave: [['Paid leave', 16], ['Unpaid leave', 12.5], ['Comp off', 0]],
}

function series(kpi, n, shift) {
  return Array.from({ length: n }, (_, i) => {
    const w = Math.sin((i + shift) * kpi.fq + kpi.ph) * 0.5 + Math.sin((i + shift) * 0.4 + kpi.ph * 0.7) * 0.5
    return Math.max(0, kpi.base + w * kpi.amp)
  })
}

// smooth line through the points without overshooting (monotone cubic, like d3 curveMonotoneX)
function smooth(pts) {
  const n = pts.length
  if (n < 3) return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const dx = [], m = []
  for (let i = 0; i < n - 1; i++) { dx.push(pts[i + 1][0] - pts[i][0]); m.push((pts[i + 1][1] - pts[i][1]) / dx[i]) }
  const t = [m[0]]
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2)
  t.push(m[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b
    if (h > 9) { const k = 3 / Math.sqrt(h); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i] }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const w = dx[i] / 3
    d += ` C${(pts[i][0] + w).toFixed(1)},${(pts[i][1] + t[i] * w).toFixed(1)} ${(pts[i + 1][0] - w).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * w).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`
  }
  return d
}

function Chart({ kpis, n }) {
  // every metric has its own unit, so each area is scaled to its own range: the chart shows the shape of each trend, the tooltip the real values
  const data = useMemo(() => kpis.map((k) => {
    const cur = series(k, n, 0)
    const mean = cur.reduce((x, v) => x + v, 0) / cur.length || 1
    return { k, cur, idx: cur.map((v) => (v / mean) * 100) } // every metric indexed to its own period average = 100
  }), [kpis, n])
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState(null)
  const ref = useRef(null)
  const wrap = useRef(null)
  const [W, setW] = useState(720)
  useEffect(() => {
    const el = wrap.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // the chart is as tall as the window allows (so the page fits one screen), drawn at its real pixel size
  const [H, setH] = useState(() => Math.min(260, Math.max(190, window.innerHeight - 690)))
  useEffect(() => {
    const f = () => setH(Math.min(260, Math.max(190, window.innerHeight - 690)))
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  const L = 40, B = 28, T = 12, R = 4
  const all = data.flatMap((d) => d.idx)
  const lo = Math.max(0, Math.floor(Math.min(...all) / 50) * 50)
  const hi = Math.max(lo + 100, Math.ceil(Math.max(...all) / 50) * 50)
  const ticks4 = Array.from({ length: (hi - lo) / 50 + 1 }, (_, i) => lo + i * 50)
  const x = (i) => L + (i * (W - L - R)) / (n - 1)
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1))
  const pts = (d) => d.idx.map((v, i) => [x(i), y(v)])
  const base = H - B
  const grid = ticks4.map((t) => y(t))
  const date = (i) => { const d = new Date(2026, 9, 12 - (n - 1 - i)); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  const nTicks = W < 520 ? 3 : n <= 7 ? 7 : 6
  const ticks = Array.from({ length: nTicks }, (_, i) => Math.round((i * (n - 1)) / (nTicks - 1)))
  const idx = (e) => { const r = ref.current.getBoundingClientRect(); return Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width * W - L) / ((W - L - R) / (n - 1))))) }
  const key = (e) => {
    const h = hover ?? n - 1
    if (e.key === 'ArrowLeft') { e.preventDefault(); setHover(Math.max(0, h - 1)) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setHover(Math.min(n - 1, h + 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setHover(0) } else if (e.key === 'End') { e.preventDefault(); setHover(n - 1) }
  }
  const tipLeft = hover != null && x(hover) > W * 0.65
  return (
    <div className="in-chart" ref={wrap}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" tabIndex={0} aria-label={`${data.map((d) => d.k.label).join(', ')}, last ${n} days. Use arrow keys to inspect a day.`} onMouseMove={(e) => setHover(idx(e))} onMouseLeave={() => setHover(null)} onKeyDown={key} onBlur={() => setHover(null)}>
        <defs>
          {data.map((d) => (
            <linearGradient key={d.k.key} id={`${uid}-${d.k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={d.k.color} stopOpacity="0.16" />
              <stop offset="100%" stopColor={d.k.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {grid.map((gy, i) => <g key={i}><line x1={L} x2={W - R} y1={gy} y2={gy} className="gl" /><text x={L - 8} y={gy + 4} textAnchor="end" className="ax">{Math.round(ticks4[i])}</text></g>)}
        {data.map((d) => { const p = pts(d); return <path key={`${d.k.key}-a`} d={`${smooth(p)} L${p[p.length - 1][0].toFixed(1)},${base} L${p[0][0].toFixed(1)},${base} Z`} fill={`url(#${uid}-${d.k.key})`} stroke="none" /> })}
        {data.map((d) => <path key={d.k.key} d={smooth(pts(d))} className="ln cu" style={{ stroke: d.k.color }} />)}
        {ticks.map((i, j) => <text key={i} x={x(i)} y={H - 8} textAnchor={j === 0 ? 'start' : j === ticks.length - 1 ? 'end' : 'middle'} className="ax">{date(i)}</text>)}
        {hover != null && <g><line x1={x(hover)} x2={x(hover)} y1={T} y2={base} className="cr" />{data.map((d) => <circle key={d.k.key} cx={x(hover)} cy={y(d.idx[hover])} r="4.5" className="pt" style={{ fill: d.k.color }} />)}</g>}
      </svg>
      {hover != null && (
        <div className={`in-tip${tipLeft ? ' left' : ''}`} style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{new Date(2026, 9, 12 - (n - 1 - hover)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</b>
          {data.map((d) => <span key={d.k.key}><i style={{ background: d.k.color }} />{d.k.label}<strong>{d.k.fmt(d.cur[hover])}</strong></span>)}
        </div>
      )}
    </div>
  )
}

function Bars({ title, data, total }) {
  const max = Math.max(...data.map((d) => d[1]), 1)
  return (
    <section className="in-list">
      <h3>{title}</h3>
      <ul>{data.map(([k, v]) => (
        <li key={k}><span>{k}</span><div><i style={{ width: `${(v / max) * 100}%` }} /></div><b>{v}</b></li>
      ))}</ul>
      <small>{total}</small>
    </section>
  )
}

export default function Insights() {
  const [shown, setShown] = useState(() => KPIS.map((k) => k.key))
  const [range, setRange] = useState(30)
  const visible = useMemo(() => KPIS.filter((k) => shown.includes(k.key)), [shown])
  const toggle = (key) => setShown((cur) => (cur.includes(key) ? (cur.length > 1 ? cur.filter((x) => x !== key) : cur) : [...cur, key]))
  const vals = (k) => { const s = series(k, range, 0); const sum = s.reduce((a, b) => a + b, 0); const nz = s.filter((v) => v > 0).length || 1; return k.agg === 'sum' ? sum : sum / nz }

  return (
    <div className="in">
      <div className="in-head">
        <div><h2>Attendance insights</h2><p>Venkatesh Korlapati · Last {range} days</p></div>
        <div className="in-ctl">
          <button type="button" className="mp-btn" onClick={() => toast({ title: 'Report exported', text: `attendance-insights-${range}d.csv is ready.` })}><Download size={16} strokeWidth={1.75} aria-hidden="true" />Export</button>
        </div>
      </div>

      <div className="in-kpis" role="group" aria-label="Metrics shown on the chart">
        {KPIS.map((k) => {
          const Arrow = k.delta[1] === 'up' ? TrendingUp : TrendingDown
          const on = shown.includes(k.key)
          return (
            <button key={k.key} type="button" aria-pressed={on} className={on ? 'on' : ''} style={{ '--kc': k.color }} onClick={() => toggle(k.key)}>
              <span><i className="kd" aria-hidden="true" />{k.label}</span>
              <b>{k.fmt(vals(k))}</b>
              <em className={k.good ? 'good' : 'bad'}><Arrow size={14} strokeWidth={1.75} aria-hidden="true" />{k.delta[0]}{k.unit === '%' ? ' pts' : '%'}</em>
            </button>
          )
        })}
      </div>

      <div className="in-body">
      <section className="in-card">
        <div className="in-card-h"><div><h3>Attendance trends</h3><p>Showing {visible.length === 1 ? visible[0].label.toLowerCase() : `${visible.length} metrics`} for the last {range} days · indexed to each metric’s average = 100</p></div>
          <label className="in-range"><span className="sr-only">Time range</span>
            <select value={range} onChange={(e) => setRange(+e.target.value)} aria-label="Time range">{RANGES.map((r) => <option key={r} value={r}>Last {r} days</option>)}</select>
          </label>
        </div>
        <div className="in-card-b">
          <Chart kpis={visible} n={range} />
          <ul className="in-leg">{KPIS.map((k) => { const on = shown.includes(k.key); return <li key={k.key}><button type="button" aria-pressed={on} className={on ? 'on' : ''} onClick={() => toggle(k.key)}><i style={{ background: on ? k.color : 'var(--line-strong)' }} />{k.label}</button></li> })}</ul>
        </div>
      </section>
      <div className="in-side">
        <Bars title="Where you worked" data={LISTS.where} total={`${LISTS.where.reduce((a, b) => a + b[1], 0)} days in total`} />
        <Bars title="Leave taken" data={LISTS.leave} total="28.5 days this year" />
      </div>
      </div>
    </div>
  )
}
