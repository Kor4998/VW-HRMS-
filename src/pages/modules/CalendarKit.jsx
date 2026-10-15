import { useState } from 'react'
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8 AM .. 8 PM
const HOUR_H = 64
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const mondayOf = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const hourLabel = (h) => `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`
const fmtShort = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// lane layout so overlapping timed events sit side by side
function lanes(list) {
  const sorted = [...list].sort((a, b) => a.start - b.start)
  const ends = []
  const out = sorted.map((e) => {
    let lane = ends.findIndex((end) => end <= e.start)
    if (lane < 0) { lane = ends.length; ends.push(0) }
    ends[lane] = e.end
    return { e, lane }
  })
  const total = Math.max(1, ends.length)
  return out.map((o) => ({ ...o, total }))
}

/* Untitled UI calendar: header (date badge, title, range, nav, view select, action) + month / week grid.
   eventsFor(date) -> [{ id, label, time?, start?, end?, allDay?, tone, dot? }] */
export default function CalendarKit({ today, eventsFor, isOff, initialView = 'week', leftExtra, action }) {
  const [view, setView] = useState(initialView)
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()))

  const [nowD] = useState(() => new Date())
  const nowH = Math.min(HOURS[HOURS.length - 1], Math.max(HOURS[0], nowD.getHours() + nowD.getMinutes() / 60))
  const nowLabel = nowD.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
  const weekStart = mondayOf(cursor)
  const step = (n) => setCursor((c) => (view === 'month' ? new Date(c.getFullYear(), c.getMonth() + n, 1) : addDays(c, n * 7)))
  const range = view === 'month' ? `${fmtShort(monthStart)} – ${fmtShort(monthEnd)}` : `${fmtShort(weekStart)} – ${fmtShort(addDays(weekStart, 6))}`

  // month grid: whole weeks covering the month
  const gridStart = mondayOf(monthStart)
  const weeks = Math.ceil(((monthEnd - gridStart) / 864e5 + 1) / 7)
  const monthDays = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i))
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="ck">
      <div className="ck-head">
        <div className="ck-badge" aria-hidden="true"><small>{MONTHS[today.getMonth()].slice(0, 3).toUpperCase()}</small><b>{today.getDate()}</b></div>
        <div className="ck-title"><h3>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h3><p>{range}</p></div>
        <div className="ck-ctl">
          {leftExtra}
          <div className="ck-nav" role="group" aria-label="Navigate">
            <button type="button" aria-label={`Previous ${view}`} onClick={() => step(-1)}><ChevronLeft size={16} strokeWidth={1.75} /></button>
            <button type="button" onClick={() => setCursor(new Date(today))}>Today</button>
            <button type="button" aria-label={`Next ${view}`} onClick={() => step(1)}><ChevronRight size={16} strokeWidth={1.75} /></button>
          </div>
          <div className="ck-seg" role="group" aria-label="Calendar view">
            <button type="button" aria-label="Month view" title="Month view" aria-pressed={view === 'month'} className={view === 'month' ? 'on' : ''} onClick={() => setView('month')}><CalendarDays size={16} strokeWidth={1.75} /></button>
            <button type="button" aria-label="Week view" title="Week view" aria-pressed={view === 'week'} className={view === 'week' ? 'on' : ''} onClick={() => setView('week')}><CalendarRange size={16} strokeWidth={1.75} /></button>
          </div>
          {action && <button type="button" className="mp-btn primary" onClick={action.run}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />{action.label}</button>}
        </div>
      </div>

      {view === 'month' && (
        <div className="ck-month">
          <div className="ck-cols">{DAYS.map((d) => <b key={d}>{d}</b>)}</div>
          <div className="ck-mgrid" style={{ gridTemplateRows: `repeat(${weeks}, minmax(112px, 1fr))` }}>
            {monthDays.map((d) => {
              const other = d.getMonth() !== cursor.getMonth()
              const evs = eventsFor(d, 'month')
              const now = sameDay(d, today)
              const allDay = evs.filter((e) => e.allDay)
              const timed = evs.find((e) => !e.allDay)
              const holiday = allDay.find((e) => e.tone === 'amber' || e.tone === 'violet')
              const off = allDay.find((e) => e.tone === 'grey')
              return (
                <div key={d.toISOString()} className={`ck-cell kk${other ? ' other' : ''}${isOff?.(d) ? ' off' : ''}${now ? ' today' : ''}`}>
                  <span className={now ? 'ck-n now' : 'ck-n'}>{d.getDate()}</span>
                  {holiday && <span className="kk-hol" title={holiday.label}>HOLIDAY</span>}
                  {!other && (
                    <div className="kk-foot">
                      {timed && <span className="kk-time">{timed.time}{timed.sub && <b>{timed.sub} worked</b>}</span>}
                      {off && !holiday && <em className="kk-woff">W-OFF</em>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="ck-week">
          <div className="ck-wh">
            <span />
            {weekDays.map((d) => (
              <b key={d.toISOString()}>{DAYS[(d.getDay() + 6) % 7]} {sameDay(d, today) ? <em>{d.getDate()}</em> : <strong>{d.getDate()}</strong>}</b>
            ))}
          </div>
          {weekDays.some((d) => eventsFor(d, view).some((e) => e.allDay)) && <div className="ck-allday">
            <span>All day</span>
            {weekDays.map((d) => (
              <div key={d.toISOString()}>{eventsFor(d, view).filter((e) => e.allDay).map((e) => <div key={e.id} className={`ck-ev ${e.tone}`}><b>{e.label}</b></div>)}</div>
            ))}
          </div>}
          <div className="ck-wbody" style={{ '--hh': `${HOUR_H}px` }}>
            <div className="ck-hours">{HOURS.map((h) => <span key={h} style={{ height: HOUR_H }}>{hourLabel(h)}</span>)}{weekDays.some((d) => sameDay(d, today)) && <em className="ck-nowl" style={{ top: (nowH - HOURS[0]) * HOUR_H }}>{nowLabel}</em>}</div>
            {weekDays.map((d) => {
              const all = eventsFor(d, view).filter((e) => !e.allDay && e.start != null)
              const timed = all.filter((e) => !e.overlay)
              const overlays = all.filter((e) => e.overlay)
              return (
                <div key={d.toISOString()} className={`ck-day${isOff?.(d) ? ' off' : ''}${sameDay(d, today) ? ' today' : ''}`} style={{ height: HOURS.length * HOUR_H }}>
                  {lanes(timed).map(({ e, lane, total }) => (
                    <div
                      key={e.id} className={`ck-ev block ${e.tone}`} title={`${e.label} · ${e.time || ''}`}
                      style={{ top: (e.start - HOURS[0]) * HOUR_H + 2, height: Math.max(26, (e.end - e.start) * HOUR_H - 4), left: `calc(${(lane / total) * 100}% + 3px)`, width: `calc(${100 / total}% - 6px)` }}
                    >
                      <b>{e.label}</b>{e.time && <span>{e.time}</span>}
                    </div>
                  ))}
                  {overlays.map((e) => (
                    <div key={e.id} className={`ck-ev block overlay ${e.tone}`} title={`${e.label} · ${e.time || ''}`} style={{ top: (e.start - HOURS[0]) * HOUR_H + 2, height: Math.max(26, (e.end - e.start) * HOUR_H - 4) }}>
                      <b>{e.label}</b>{e.time && <span>{e.time}</span>}
                    </div>
                  ))}
                  {sameDay(d, today) && <i className="ck-now" style={{ top: Math.max(0, (nowH - HOURS[0]) * HOUR_H) }} aria-label="Current time" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
