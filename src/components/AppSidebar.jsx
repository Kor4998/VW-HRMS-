import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { ITEMS, searchScreens } from './sidebarMenus'
import './appsidebar.css'

// search box that finds a specific page or screen
function MenuSearch({ q, setQ, placeholder }) {
  return (
    <label className="as2-search">
      <Search size={16} strokeWidth={1.75} aria-hidden="true" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search pages and screens" type="search" name="menuSearch" autoComplete="off" spellCheck={false} />
      {q && <button type="button" aria-label="Clear search" onClick={() => setQ('')}><X size={14} strokeWidth={1.75} aria-hidden="true" /></button>}
    </label>
  )
}

function Results({ q, go, onDone, NavIcon }) {
  const hits = useMemo(() => searchScreens(q), [q])
  if (!hits.length) return <p className="as2-none">No page or screen matches “{q}”.</p>
  return (
    <ul className="as2-hits" aria-label="Search results">
      {hits.map((h) => (
        <li key={h.key}>
          <button type="button" onClick={() => { go(h.go, h.tab); onDone() }}>
            <NavIcon name={h.item.icon} size={16} />
            <span><b>{h.label}</b><small>{h.trail}</small></span>
          </button>
        </li>
      ))}
    </ul>
  )
}

// same rule as the Default sidebar: an item is current when its page is open (Dashboard when no page is open)
const isHere = (it, page, settingsOpen) => !settingsOpen && (it.go === null ? !page : it.go === page)
const currentScreen = (it, tab) => tab || it.screens[0][0]
const Badge = ({ n }) => (n > 0 ? <em className="nav-badge" aria-label={`${n} pending`}>{n}</em> : null)

// ---------- Hierarchical: the Default menu, built from the Default sidebar's own classes; pages with screens open to list them
export function TreeNav({ page, tab, go, NavIcon, settingsOpen, badges = {} }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState({})
  return (
    <div className="as2 tree">
      <MenuSearch q={q} setQ={setQ} placeholder="Search pages…" />
      {q.trim() ? <Results q={q} go={go} onDone={() => setQ('')} NavIcon={NavIcon} /> : ITEMS.map((it) => {
        const here = isHere(it, page, settingsOpen)
        if (!it.screens) {
          return (
            <a key={it.label} href="#" aria-label={it.label} className={here ? 'nav-item active' : 'nav-item'} onClick={(e) => { e.preventDefault(); go(it.go) }}>
              <NavIcon name={it.icon} size={18} /><span className="nav-label">{it.label}</span><Badge n={badges[it.label]} />
            </a>
          )
        }
        const expanded = open[it.label] ?? here // the page you are on stays open until you close it
        return (
          <div className="nav-group" key={it.label}>
            <button type="button" aria-label={it.label} aria-expanded={expanded} className={`nav-item has-kids${expanded ? ' open' : ''}${here ? ' active' : ''}`}
              onClick={() => { if (!here) { go(it.go, it.screens[0][0]); setOpen((o) => ({ ...o, [it.label]: true })) } else setOpen((o) => ({ ...o, [it.label]: !expanded })) }}>
              <NavIcon name={it.icon} size={18} /><span className="nav-label">{it.label}</span>
              <svg className="nav-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {expanded && (
              <div className="nav-sub">
                {it.screens.map(([k, name]) => {
                  const on = here && currentScreen(it, tab) === k
                  return <a key={k} href="#" className={on ? 'nav-sub-item active' : 'nav-sub-item'} aria-current={on ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go(it.go, k) }}><span>{name}</span></a>
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------- Cascading: the Default menu as an icon rail; clicking an item opens its panel with its screens (hovering only highlights the tile)
export function PanelNav({ page, tab, go, NavIcon, collapsed, settingsOpen, badges = {} }) {
  const [q, setQ] = useState('')
  const current = ITEMS.find((it) => isHere(it, page, settingsOpen)) || ITEMS[0]
  const [shown, setShown] = useState(current.label)
  const it = ITEMS.find((x) => x.label === shown) || current
  const show = (label) => { setShown(label); setQ('') }
  return (
    <div className={`as2 cascading${collapsed ? ' rail-only' : ''}`}>
      <div className="as2-rail" role="tablist" aria-label="Pages" aria-orientation="vertical">
        {ITEMS.map((x) => (
          <button key={x.label} type="button" role="tab" aria-selected={x.label === it.label} aria-label={x.label}
            className={`${x.label === it.label ? 'on' : ''}${isHere(x, page, settingsOpen) ? ' here' : ''}`}
            onClick={() => { show(x.label); go(x.go, x.screens ? (isHere(x, page, settingsOpen) ? tab : x.screens[0][0]) : null) }}>
            <NavIcon name={x.icon} size={20} /><span>{x.short}</span><Badge n={badges[x.label]} />
          </button>
        ))}
      </div>
      {!collapsed && (
        <div className="as2-pane">
          <MenuSearch q={q} setQ={setQ} placeholder="Search…" />
          {q.trim() ? <Results q={q} go={go} onDone={() => setQ('')} NavIcon={NavIcon} /> : (
            <div className="as2-list" aria-label={it.label}>
              <span className="as2-head">{it.label}</span>
              {it.screens ? it.screens.map(([k, name]) => {
                const on = isHere(it, page, settingsOpen) && currentScreen(it, tab) === k
                return <button key={k} type="button" className={`as2-item${on ? ' on' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => go(it.go, k)}>{name}</button>
              }) : (
                <button type="button" className={`as2-item${isHere(it, page, settingsOpen) ? ' on' : ''}`} aria-current={isHere(it, page, settingsOpen) ? 'page' : undefined} onClick={() => go(it.go)}><NavIcon name={it.icon} size={16} />{it.label}</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
