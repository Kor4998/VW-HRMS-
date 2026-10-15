import { useEffect, useRef, useState } from 'react'
import { Check, FolderKanban, Pencil, Star, Ticket, Users } from 'lucide-react'
import { toast } from './toast'
import './appswitcher.css'

const APPS = [
  { id: 'portal', name: 'Employee Portal', icon: Users, tone: 'green', current: true },
  { id: 'support', name: 'Support', icon: Ticket, tone: 'blue' },
  { id: 'projects', name: 'Projects', icon: FolderKanban, tone: 'violet' },
]

// 3x3 dots button that opens an app launcher (replaces the separate launcher page).
export default function AppSwitcher({ current = 'portal', onSelect }) {
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(false)
  const [fav, setFav] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hrms-fav-apps')) || ['portal', 'projects'] } catch { return ['portal', 'projects'] }
  })
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const key = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open])

  const toggleFav = (id) => setFav((f) => {
    const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]
    try { localStorage.setItem('hrms-fav-apps', JSON.stringify(n)) } catch { /* storage unavailable */ }
    return n
  })
  const launch = (a) => {
    if (edit) { toggleFav(a.id); return }
    setOpen(false)
    if (a.id !== current) {
      if (['portal', 'support', 'projects'].includes(a.id)) onSelect?.(a.id)
      else toast({ title: `Opening ${a.name}`, text: 'This app opens in its own workspace.', tone: 'info', duration: 2500 })
    }
  }
  const apps = APPS.map((a) => ({ ...a, current: a.id === current }))
  const favs = apps.filter((a) => fav.includes(a.id))
  const rest = apps.filter((a) => !fav.includes(a.id))

  const Tile = (a) => {
    const Ico = a.icon
    return (
      <button key={a.id} type="button" role="menuitem" className={`as-tile${a.current ? ' cur' : ''}`} onClick={() => launch(a)} aria-label={edit ? `${fav.includes(a.id) ? 'Remove' : 'Add'} ${a.name} ${fav.includes(a.id) ? 'from' : 'to'} favourites` : a.name}>
        <span className={`as-ic ${a.tone}`}><Ico size={22} strokeWidth={1.75} aria-hidden="true" /></span>
        <b>{a.name}</b>
        {edit && <i className={fav.includes(a.id) ? 'as-star on' : 'as-star'}><Star size={12} strokeWidth={2} fill={fav.includes(a.id) ? 'currentColor' : 'none'} /></i>}
        {!edit && a.current && <em><Check size={10} strokeWidth={3} /></em>}
      </button>
    )
  }

  return (
    <div className="as" ref={ref}>
      <button type="button" className={open ? 'as-btn open' : 'as-btn'} aria-label="Apps" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">{[3, 9, 15].flatMap((y) => [3, 9, 15].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.7" fill="currentColor" />))}</svg>
      </button>
      {open && (
        <div className="as-pop" role="menu" aria-label="Apps">
          <div className="as-sec">
            <div className="as-head"><h3>{edit ? 'Pick your favourites' : 'Your favourites'}</h3>
              <button type="button" className={edit ? 'as-edit on' : 'as-edit'} aria-label={edit ? 'Done editing' : 'Edit favourites'} aria-pressed={edit} onClick={() => setEdit((e) => !e)}>{edit ? <Check size={16} strokeWidth={2} /> : <Pencil size={16} strokeWidth={1.75} />}</button>
            </div>
            {favs.length ? <div className="as-grid">{favs.map(Tile)}</div> : <p className="as-empty">No favourites yet. Press the pencil to pick some.</p>}
          </div>
          {rest.length > 0 && <div className="as-more"><div className="as-grid">{rest.map(Tile)}</div></div>}
        </div>
      )}
    </div>
  )
}
