import { useState } from 'react'
import './donut.css'

const polar = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]

// Arc-UI style donut card: rounded segments with small gaps, total in the middle, legend with value and share.
// ranges: [{ key, label, subtitle, items: [{ label, value, color, note? }] }] — the segmented control switches between them.
export default function DonutBreakdown({ title, ranges, centerLabel = 'Total', className = '' }) {
  const [rk, setRk] = useState(ranges[0].key)
  const [hover, setHover] = useState(null)
  const range = ranges.find((r) => r.key === rk) || ranges[0]
  const items = range.items
  const total = items.reduce((a, i) => a + i.value, 0)
  const S = 220, C = S / 2, R = 92, W = 22, GAP = 0.1
  const arcs = items.map((it, i) => {
    const before = items.slice(0, i).reduce((x, y) => x + y.value, 0)
    const sweep = total ? (it.value / total) * Math.PI * 2 : 0
    const start = -Math.PI / 2 + (total ? (before / total) * Math.PI * 2 : 0)
    const pad = Math.min(GAP / 2, sweep / 4)
    const [x1, y1] = polar(C, C, R, start + pad), [x2, y2] = polar(C, C, R, start + sweep - pad)
    return { it, i, d: `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${sweep - 2 * pad > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)}` }
  })
  const act = hover != null ? items[hover] : null
  return (
    <section className={`dn ${className}`} aria-label={title}>
      <header className="dn-h">
        <div><h3>{title}</h3><p>{range.subtitle}</p></div>
        {ranges.length > 1 && (
          <div className="dn-seg" role="tablist" aria-label={`${title} range`}>
            {ranges.map((r) => <button key={r.key} type="button" role="tab" aria-selected={rk === r.key} className={rk === r.key ? 'on' : ''} onClick={() => { setRk(r.key); setHover(null) }}>{r.label}</button>)}
          </div>
        )}
      </header>
      <div className="dn-chart" style={items.length <= 2 ? { width: 'min(100%, 200px)' } : undefined}>
        <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={`${title}: ${items.map((i) => `${i.label} ${i.value}`).join(', ')}`}>
          <circle cx={C} cy={C} r={R} fill="none" stroke="var(--line)" strokeWidth={W} opacity={total ? 0 : 1} />
          {arcs.map(({ it, i, d }) => (
            <path key={`${it.label}-${i}`} d={d} fill="none" stroke={it.color} strokeWidth={hover === i ? W + 4 : W} strokeLinecap="round" opacity={hover == null || hover === i ? 1 : 0.35} className="dn-arc" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          ))}
        </svg>
        <div className="dn-c"><span>{act ? act.label : (range.centerLabel ?? centerLabel)}</span><b>{act ? act.value.toLocaleString() : (range.center ?? total).toLocaleString()}</b>{!act && range.centerUnit && <small>{range.centerUnit}</small>}</div>
      </div>
      <ul className="dn-l">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className={hover === i ? 'on' : ''} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <i style={{ background: it.color }} aria-hidden="true" />
            <span><b>{it.label}</b>{it.note && <small>{it.note}</small>}</span>
            <em>{it.value.toLocaleString()}</em>
            <strong>{total ? Math.round((it.value / total) * 100) : 0}%</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}
