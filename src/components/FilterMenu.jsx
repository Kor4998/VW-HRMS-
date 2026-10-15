import { useEffect, useRef, useState } from 'react'
import { ListFilter, Search } from 'lucide-react'
import './filtermenu.css'

// Untitled UI "Filters" dropdown: trigger, search, checkbox list with counts, Reset / Select all footer.
// value = array of selected values (empty = no filter). options = [{ value, label, count? }].
export default function FilterMenu({ label = 'Filters', options, value, onChange, icon = true, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [pos, setPos] = useState(null)
  const btn = useRef(null)
  const pop = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const down = (e) => { if (!pop.current?.contains(e.target) && !btn.current?.contains(e.target)) setOpen(false) }
    const key = (e) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus() } }
    const close = () => setOpen(false)
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key)
    window.addEventListener('resize', close); window.addEventListener('scroll', close, true)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true) }
  }, [open])

  const toggleOpen = () => {
    if (open) { setOpen(false); return }
    const r = btn.current.getBoundingClientRect()
    const w = 280
    setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(align === 'right' ? r.right - w : r.left, window.innerWidth - w - 8)) })
    setQ(''); setOpen(true)
  }
  const shown = options.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()))
  const flip = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  return (
    <>
      <button ref={btn} type="button" className="mp-btn fm-trig" aria-haspopup="listbox" aria-expanded={open} onClick={toggleOpen}>
        {icon && <ListFilter size={16} strokeWidth={1.75} aria-hidden="true" />}{label}{value.length > 0 && <em className="fm-n">{value.length}</em>}
      </button>
      {open && (
        <div ref={pop} className="fm" role="dialog" aria-label={label} style={{ top: pos.top, left: pos.left }}>
          <label className="fm-s"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label={`Search ${label}`} /></label>
          <ul role="listbox" aria-multiselectable="true">
            {shown.map((o) => (
              <li key={o.value}>
                <label><input type="checkbox" checked={value.includes(o.value)} onChange={() => flip(o.value)} /><b>{o.label}</b>{o.count != null && <small>{o.count} {o.count === 1 ? 'item' : 'items'}</small>}</label>
              </li>
            ))}
            {shown.length === 0 && <li className="fm-none">No matches</li>}
          </ul>
          <div className="fm-f"><button type="button" onClick={() => onChange([])}>Reset</button><button type="button" onClick={() => onChange(options.map((o) => o.value))}>Select all</button></div>
        </div>
      )}
    </>
  )
}
