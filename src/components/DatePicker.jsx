import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import './datepicker.css'

// Untitled UI "Date picker dropdown": trigger button, presets sidebar, two-month range calendar, footer with
// date inputs + Cancel / Apply. Value is { from: Date|null, to: Date|null } (null/null = all time).
const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const same = (a, b) => a && b && a.getTime() === b.getTime()
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const monday = (d) => addD(d, -((d.getDay() + 6) % 7))
const short = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const inp = (d) => (d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '')
const parse = (s) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim())
  if (!m) return null
  const d = new Date(+m[3], +m[2] - 1, +m[1])
  return d.getMonth() === +m[2] - 1 ? d : null
}

export function rangeLabel(v, empty = 'Select dates') {
  if (!v?.from) return empty
  return v.to && !same(v.from, v.to) ? `${short(v.from)} – ${short(v.to)}` : short(v.from)
}

function presets(today) {
  const t = day0(today)
  const ws = monday(t)
  const ms = new Date(t.getFullYear(), t.getMonth(), 1)
  return [
    ['Today', { from: t, to: t }],
    ['Yesterday', { from: addD(t, -1), to: addD(t, -1) }],
    ['This week', { from: ws, to: addD(ws, 6) }],
    ['Last week', { from: addD(ws, -7), to: addD(ws, -1) }],
    ['This month', { from: ms, to: new Date(t.getFullYear(), t.getMonth() + 1, 0) }],
    ['Last month', { from: new Date(t.getFullYear(), t.getMonth() - 1, 1), to: new Date(t.getFullYear(), t.getMonth(), 0) }],
    ['This year', { from: new Date(t.getFullYear(), 0, 1), to: new Date(t.getFullYear(), 11, 31) }],
    ['Last year', { from: new Date(t.getFullYear() - 1, 0, 1), to: new Date(t.getFullYear() - 1, 11, 31) }],
    ['All time', { from: null, to: null }],
  ]
}

function Month({ view, draft, hover, today, onPick, onHover }) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const start = monday(first)
  const cells = Array.from({ length: 42 }, (_, i) => addD(start, i))
  const lo = draft.from && (draft.to || hover) ? (draft.from <= (draft.to || hover) ? draft.from : draft.to || hover) : draft.from
  const hi = draft.from && (draft.to || hover) ? (draft.from <= (draft.to || hover) ? draft.to || hover : draft.from) : draft.from
  return (
    <div className="dp-m">
      <div className="dp-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="dp-grid" onMouseLeave={() => onHover(null)}>
        {cells.map((d) => {
          const out = d.getMonth() !== view.getMonth()
          const isS = same(d, lo); const isE = same(d, hi)
          const inR = lo && hi && d > lo && d < hi
          const cls = ['dp-c', out ? 'out' : '', inR ? 'in' : '', isS && hi && !same(lo, hi) ? 'rs' : '', isE && !same(lo, hi) ? 're' : ''].join(' ')
          return (
            <span key={d.toISOString()} className={cls}>
              <button type="button" className={`dp-d${isS || isE ? ' sel' : ''}${same(d, today) ? ' today' : ''}`} aria-pressed={isS || isE} aria-label={d.toDateString()} onClick={() => onPick(d)} onMouseEnter={() => onHover(d)}>{d.getDate()}</button>
            </span>
          )
        })}
      </div>
    </div>
  )
}

const EMPTY_RANGE = { from: null, to: null }

export default function DatePicker({ value: valueProp, onApply, label, className = '', today: todayProp, align = 'left', single = false }) {
  const value = valueProp ?? EMPTY_RANGE
  const [now] = useState(() => new Date())
  const today = todayProp ?? now
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const [view, setView] = useState(() => new Date((value?.from || today).getFullYear(), (value?.from || today).getMonth(), 1))
  const [hover, setHover] = useState(null)
  const [txt, setTxt] = useState({ from: '', to: '' })
  const [pos, setPos] = useState(null)
  const btn = useRef(null)
  const pop = useRef(null)
  const P = useMemo(() => presets(today), [today])

  const openIt = () => {
    const r = btn.current.getBoundingClientRect()
    const w = single ? 360 : Math.min(680, window.innerWidth - 16)
    const left = align === 'right' ? r.right - w : r.left
    setPos({ top: r.bottom + 8, left: Math.max(8, Math.min(left, window.innerWidth - w - 8)) })
    setDraft(value); setHover(null)
    const base = value?.from || today
    setView(new Date(base.getFullYear(), base.getMonth(), 1))
    setTxt({ from: inp(value?.from), to: inp(value?.to) })
    setOpen(true)
  }
  useEffect(() => {
    if (!open) return undefined
    const down = (e) => { if (!pop.current?.contains(e.target) && !btn.current?.contains(e.target)) setOpen(false) }
    const key = (e) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus() } }
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [open])

  const set = (r) => { setDraft(r); setTxt({ from: inp(r.from), to: inp(r.to) }); if (r.from) setView(new Date(r.from.getFullYear(), r.from.getMonth(), 1)) }
  const pick = (d) => {
    if (single) { onApply?.({ from: d, to: d }); setOpen(false); return } // one date: choosing a day is the whole job
    if (!draft.from || (draft.from && draft.to)) set({ from: d, to: null })
    else if (d < draft.from) set({ from: d, to: draft.from })
    else set({ from: draft.from, to: d })
  }
  const blur = (k) => { const p = parse(txt[k]); if (p) set({ ...draft, [k]: p }); else setTxt({ from: inp(draft.from), to: inp(draft.to) }) }
  const apply = () => { onApply?.({ from: draft.from, to: draft.to || draft.from }); setOpen(false) }
  const next = new Date(view.getFullYear(), view.getMonth() + 1, 1)
  const title = (d) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <>
      <button ref={btn} type="button" className={`mp-btn dp-trig ${className}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => (open ? setOpen(false) : openIt())}>
        <CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />{label ?? rangeLabel(value)}
      </button>
      {open && (
        <div ref={pop} className={`dp${single ? ' single' : ''}`} role="dialog" aria-label="Choose dates" style={{ top: pos.top, left: pos.left }}>
          <div className="dp-body">
            {!single && (<ul className="dp-presets" aria-label="Presets">
              {P.map(([l, r]) => <li key={l}><button type="button" className={same(r.from, draft.from) && same(r.to, draft.to) && (r.from || !draft.from) ? 'on' : ''} onClick={() => set(r)}>{l}</button></li>)}
            </ul>)}
            <div className="dp-cals">
              <div className="dp-cal">
                <div className="dp-nav"><button type="button" aria-label="Previous month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}><ChevronLeft size={18} strokeWidth={1.75} /></button><b>{title(view)}</b>{single ? <button type="button" aria-label="Next month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}><ChevronRight size={18} strokeWidth={1.75} /></button> : <span />}</div>
                <Month view={view} draft={draft} hover={hover} today={today} onPick={pick} onHover={setHover} />
              </div>
              {!single && (
              <div className="dp-cal dp-second">
                <div className="dp-nav"><span /><b>{title(next)}</b><button type="button" aria-label="Next month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}><ChevronRight size={18} strokeWidth={1.75} /></button></div>
                <Month view={next} draft={draft} hover={hover} today={today} onPick={pick} onHover={setHover} />
              </div>
              )}
            </div>
          </div>
          {!single && (
          <div className="dp-foot">
            <input value={txt.from} placeholder="DD / MM / YYYY" aria-label="Start date" onChange={(e) => setTxt({ ...txt, from: e.target.value })} onBlur={() => blur('from')} />
            <i aria-hidden="true">–</i>
            <input value={txt.to} placeholder="DD / MM / YYYY" aria-label="End date" onChange={(e) => setTxt({ ...txt, to: e.target.value })} onBlur={() => blur('to')} />
            <button type="button" className="mp-btn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="mp-btn primary" onClick={apply}>Apply</button>
          </div>
          )}
        </div>
      )}
    </>
  )
}
