import { useState } from 'react'
import './arccharts.css'

// Arc-UI style bar chart: soft grid, rounded bars, hover tooltip, the busiest bar highlighted.
export function ArcBars({ data, unit = '', color = 'var(--orange-solid)', height = 150 }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map((d) => d[1]))
  const top = Math.max(1, Math.ceil(max / 2) * 2)
  const peak = data.findIndex((d) => d[1] === max)
  const act = hover ?? null
  return (
    <div className="ab" role="img" aria-label={`Bar chart: ${data.map((d) => `${d[0]} ${d[1]}`).join(', ')}`} style={{ '--h': `${height}px`, '--c': color }}>
      <div className="ab-y" aria-hidden="true">{[top, top / 2, 0].map((v) => <span key={v}>{v}</span>)}</div>
      <div className="ab-plot">
        <div className="ab-grid" aria-hidden="true"><i /><i /><i /></div>
        <div className="ab-cols">
          {data.map(([label, v], i) => (
            <div key={label} className={`ab-col${act === i ? ' on' : ''}${act == null && i === peak ? ' peak' : ''}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {(act === i || (act == null && i === peak && v > 0)) && <em className="ab-tip">{v}{unit}</em>}
              <b style={{ height: `${Math.max(v > 0 ? 6 : 3, (v / top) * 100)}%` }} className={v === 0 ? 'zero' : ''} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Arc-UI style gauge: thick rounded ring with the value in the middle. total = 0 means unlimited (full ring).
export function ArcRing({ value, total, color, title, caption = 'available', size = 132, stroke = 14 }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(1, value / total) : 1
  const gap = Math.min(0.06, c * 0.0004)
  return (
    <div className="ar" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${title} ${caption}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {pct > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${Math.max(0.1, c * pct - gap)} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />}
      </svg>
      <div className="ar-c"><strong>{title}</strong><small>{caption}</small></div>
    </div>
  )
}
