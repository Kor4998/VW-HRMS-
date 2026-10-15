// Small shared pieces for the module pages (Untitled UI styled via Modules.css).
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox, Plus } from 'lucide-react'

export function PageHead({ title, desc, children }) {
  return (
    <header className="mp-head">
      <div><h1>{title}</h1>{desc && <p>{desc}</p>}</div>
      {children && <div className="mp-head-a">{children}</div>}
    </header>
  )
}

export function Section({ title, aside, children, className = '' }) {
  return (
    <section className={`mp-sec ${className}`}>
      {(title || aside) && <div className="mp-sec-h"><h2>{title}</h2>{aside}</div>}
      {children}
    </section>
  )
}

export function Tabs({ items, value, onChange, label }) {
  return (
    <div className="mp-tabs" role="tablist" aria-label={label}>
      {items.map(([key, text, count]) => (
        <button key={key} type="button" role="tab" aria-selected={value === key} className={value === key ? 'on' : ''} onClick={() => onChange(key)}>
          {text}{count != null && <em>{count}</em>}
        </button>
      ))}
    </div>
  )
}

// Untitled UI tag: white pill, 1px border, 12px medium text, optional coloured dot.
export function Tag({ tone, children }) {
  return <span className="mp-tag">{tone && <i className={`d-${tone}`} aria-hidden="true" />}{children}</span>
}

export function Empty({ icon: Ico = Inbox, title, text, children }) {
  return (
    <div className="mp-empty">
      <span className="mp-empty-ic"><Ico size={22} strokeWidth={1.5} aria-hidden="true" /></span>
      <b>{title}</b>
      {text && <p>{text}</p>}
      {children}
    </div>
  )
}

export function Donut({ value, total, color, size = 132, stroke = 14, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(1, value / total) : 1
  return (
    <div className="mp-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="mp-donut-c">{children}</div>
    </div>
  )
}

export function Bars({ data, max, unit = '' }) {
  const m = max ?? Math.max(1, ...data.map((d) => d[1]))
  return (
    <div className="mp-bars" role="img" aria-label="Bar chart">
      {data.map(([label, v]) => (
        <div key={label} className="mp-bar" title={`${label}: ${v}${unit}`}>
          <i style={{ height: `${Math.max(v > 0 ? 6 : 2, (v / m) * 100)}%` }} className={v === 0 ? 'zero' : ''} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

// Untitled UI pagination bar: "Page [1] of N | Rows per page [10]" on the left, numbered buttons on the right.
export function Pager({ total, page, setPage, perPage, setPerPage, options = [5, 10, 20] }) {
  const pages = Math.max(1, Math.ceil(total / perPage))
  if (total <= Math.min(...options)) return null // a single short page needs no pager
  const go = (n) => setPage(Math.min(pages - 1, Math.max(0, n)))
  const show = pages <= 7
    ? Array.from({ length: pages }, (_, i) => i)
    : [...new Set([0, 1, 2, pages - 3, pages - 2, pages - 1, page - 1, page, page + 1].filter((n) => n >= 0 && n < pages))].sort((x, y) => x - y)
  const nums = show.flatMap((n, i) => (i && n - show[i - 1] > 1 ? ['gap' + n, n] : [n]))
  return (
    <div className="mp-pg">
      <div className="mp-pg-l">
        <span>Page</span>
        <input type="number" min={1} max={pages} value={page + 1} aria-label="Page number" onChange={(e) => go((parseInt(e.target.value, 10) || 1) - 1)} />
        <span>of {pages}</span>
        <i aria-hidden="true" />
        <span>Rows per page</span>
        <label className="mp-sel sm">
          <select value={perPage} aria-label="Rows per page" onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0) }}>{options.map((o) => <option key={o}>{o}</option>)}</select>
          <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
        </label>
      </div>
      <nav className="mp-pg-r" aria-label="Pagination">
        <button type="button" aria-label="First page" disabled={page === 0} onClick={() => go(0)}><ChevronsLeft size={16} strokeWidth={1.75} /></button>
        <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => go(page - 1)}><ChevronLeft size={16} strokeWidth={1.75} /></button>
        {nums.map((n) => (typeof n === 'string'
          ? <span key={n} className="gap" aria-hidden="true">…</span>
          : <button key={n} type="button" className={n === page ? 'num on' : 'num'} aria-current={n === page ? 'page' : undefined} onClick={() => go(n)}>{n + 1}</button>))}
        <button type="button" aria-label="Next page" disabled={page >= pages - 1} onClick={() => go(page + 1)}><ChevronRight size={16} strokeWidth={1.75} /></button>
        <button type="button" aria-label="Last page" disabled={page >= pages - 1} onClick={() => go(pages - 1)}><ChevronsRight size={16} strokeWidth={1.75} /></button>
      </nav>
    </div>
  )
}

// Quick-action cards (Untitled UI file-explorer pattern): icon tile, label, "+" in the corner.
export function ActionCards({ items }) {
  return (
    <div className="mp-actions4" role="group" aria-label="Quick actions">
      {items.map(({ icon: Ico, label, onClick }) => (
        <button key={label} type="button" className="mp-act" onClick={onClick}>
          <span className="mp-act-ic"><Ico size={20} strokeWidth={1.75} aria-hidden="true" /></span>
          <b>{label}</b>
          <Plus size={16} strokeWidth={1.75} className="mp-act-plus" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

// Small popover menu anchored to a button (kebab / filters). items: [{ label, icon, run, danger, checked }]
export function PopMenu({ trigger, items, align = 'right', label = 'Menu' }) {
  const [pos, setPos] = useState(null)
  const btn = useRef(null)
  useEffect(() => {
    if (!pos) return undefined
    const close = () => setPos(null)
    const key = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close); window.removeEventListener('keydown', key) }
  }, [pos])
  const toggle = () => {
    if (pos) { setPos(null); return }
    const r = btn.current.getBoundingClientRect()
    setPos({ top: r.bottom + 6, left: align === 'right' ? Math.max(8, r.right - 220) : r.left })
  }
  return (
    <>
      <button ref={btn} type="button" className="mp-pm-btn" aria-label={label} aria-haspopup="menu" aria-expanded={!!pos} onClick={toggle}>{trigger}</button>
      {pos && (
        <div className="mp-pm dash-pop" role="menu" style={{ top: pos.top, left: pos.left }} onMouseDown={(e) => e.stopPropagation()}>
          {items.map((it) => {
            const Ico = it.icon
            return (
              <button key={it.label} type="button" role="menuitem" className={it.danger ? 'danger' : ''} onClick={() => { setPos(null); it.run?.() }}>
                {Ico && <Ico size={16} strokeWidth={1.75} aria-hidden="true" />}<span>{it.label}</span>{it.checked && <Check size={16} strokeWidth={2} />}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

// Untitled UI "Table card": card with header (title + count badge + supporting text), toolbar, table, pagination footer.
export function TableCard({ title, count, unit = 'records', desc, toolbar, children, footer }) {
  return (
    <section className="tc">
      <header className="tc-h"><div><h3>{title}{count != null && <em>{count} {count === 1 ? unit.replace(/s$/, '') : unit}</em>}</h3>{desc && <p>{desc}</p>}</div></header>
      {toolbar && <div className="tc-bar">{toolbar}</div>}
      <div className="tc-body">{children}</div>
      {footer && <div className="tc-f">{footer}</div>}
    </section>
  )
}
