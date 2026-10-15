import { useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Trash2, X } from 'lucide-react'
import { fmtDur, parseDur, wlId } from './issueTime'
import { toast } from '@/components/toast'

const H0 = 8, H1 = 20, HOUR = 64, SNAP = 15
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TONES = ['blue', 'teal', 'violet', 'amber', 'pink', 'green']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const mondayOf = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
const clock = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}${mm ? `:${String(mm).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}` }
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const snap = (m) => Math.round(m / SNAP) * SNAP
const sumMin = (list) => list.reduce((a, w) => a + (w.min || 0), 0)

// Every worklog on a work item is a block on this timeline, so time logged inside a ticket shows up here and the other way round.
// A worklog saved without a start time is placed from 9:00 in the order it was logged, until it is moved.
function derive(issues, who, me) {
  const out = []
  const cursor = {}
  for (const x of issues) {
    ;(x.worklog || []).forEach((w, i) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(w.date || '')) return
      if (who === 'me' && w.who !== me) return
      let start = w.start
      if (start == null) { const k = `${w.who}|${w.date}`; start = cursor[k] ?? 9 * 60; cursor[k] = start + Math.max(SNAP, w.min || 0) }
      const min = Math.max(SNAP, w.min || 0)
      out.push({ id: w.id || `${x.id}:${i}`, issueId: x.id, title: x.title, who: w.who, day: w.date, start, end: start + min, min, text: w.text || '', own: w.who === me })
    })
  }
  return out
}

// overlapping blocks share the column side by side; blocks that overlap nothing keep the full width
function lanes(list) {
  const sorted = [...list].sort((a, b) => a.start - b.start || a.end - b.end)
  const out = []
  let group = []
  let ends = []
  let groupEnd = -1
  const flush = () => { for (const g of group) out.push({ ...g.e, lane: g.l, lanes: Math.max(1, ends.length) }); group = []; ends = [] }
  for (const e of sorted) {
    if (group.length && e.start >= groupEnd) { flush(); groupEnd = -1 }
    let l = ends.findIndex((end) => end <= e.start)
    if (l === -1) { l = ends.length; ends.push(0) }
    ends[l] = e.end
    group.push({ e, l })
    groupEnd = Math.max(groupEnd, e.end)
  }
  flush()
  return out
}

export default function WeekTimeline({ issues, setIssues, me }) {
  const [cursor, setCursor] = useState(() => new Date())
  const [view, setView] = useState('week')
  const [who, setWho] = useState('me')
  const [drag, setDrag] = useState(null) // { day, a, b }
  const [form, setForm] = useState(null) // { id?, issueId, day, start, end, text }
  const grid = useRef(null)
  const [op, setOp] = useState(null) // { type: 'move' | 'resize', id, issueId, y0, s0, e0, moved }
  const days = useMemo(() => {
    if (view === 'day') return [new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())]
    const m = mondayOf(cursor)
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(m); d.setDate(m.getDate() + i); return d })
  }, [cursor, view])
  const todayIso = iso(new Date())
  const work = useMemo(() => issues.filter((x) => x.type !== 'epic'), [issues])
  const entries = useMemo(() => derive(issues, who, me), [issues, who, me])
  const issueTone = (id) => TONES[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]

  // ---- writing back to the work item
  const mutate = (issueId, fn) => setIssues?.((l) => l.map((x) => {
    if (x.id !== issueId) return x
    const worklog = fn(x.worklog || [])
    return { ...x, worklog, logged: sumMin(worklog) }
  }))
  const idOf = (x, w, i) => w.id || `${x.id}:${i}`
  const patchLog = (issueId, id, ch) => setIssues?.((l) => l.map((x) => {
    if (x.id !== issueId) return x
    const worklog = (x.worklog || []).map((w, i) => (idOf(x, w, i) === id ? { ...w, ...ch, id: w.id || id } : w))
    return { ...x, worklog, logged: sumMin(worklog) }
  }))

  const minuteAt = (e, col) => {
    const r = col.getBoundingClientRect()
    return Math.max(H0 * 60, Math.min(H1 * 60, snap(H0 * 60 + ((e.clientY - r.top) / HOUR) * 60)))
  }
  const down = (e, day) => {
    if (e.button !== 0 || e.target.closest('.wt-ev')) return
    const col = e.currentTarget; const m = minuteAt(e, col)
    col.setPointerCapture?.(e.pointerId)
    setDrag({ day, a: m, b: m + 60, moved: false })
  }
  const move = (e) => { if (!drag) return; const m = minuteAt(e, e.currentTarget); setDrag((d) => ({ ...d, b: m, moved: d.moved || Math.abs(m - d.a) >= SNAP })) }
  const up = () => {
    if (!drag) return
    let s = Math.min(drag.a, drag.b), t = Math.max(drag.a, drag.b)
    if (!drag.moved) { s = drag.a; t = Math.min(H1 * 60, s + 60) } // a click makes a one-hour block
    if (t - s < SNAP) t = s + SNAP
    setForm({ day: drag.day, start: s, end: t, issueId: work[0]?.id || '', text: '' })
    setDrag(null)
  }
  const save = () => {
    if (!form.issueId) return
    const min = form.end - form.start
    if (form.id) {
      patchLog(form.issueId, form.id, { date: form.day, start: form.start, min, text: form.text.trim() })
      toast({ title: 'Time block updated', text: `${fmtDur(min)} on ${form.issueId}`, duration: 2200 })
    } else {
      mutate(form.issueId, (wl) => [{ id: wlId(), who: me, min, date: form.day, start: form.start, text: form.text.trim() }, ...wl])
      toast({ title: 'Work logged', text: `${fmtDur(min)} on ${form.issueId}`, duration: 2200 })
    }
    setForm(null)
  }
  const remove = () => {
    const issueId = form.issueId
    const at = (issues.find((x) => x.id === issueId)?.worklog || []).findIndex((w, i) => (w.id || `${issueId}:${i}`) === form.id)
    const gone = (issues.find((x) => x.id === issueId)?.worklog || [])[at]
    mutate(issueId, (wl) => wl.filter((w, i) => (w.id || `${issueId}:${i}`) !== form.id))
    setForm(null)
    toast({ title: 'Time block removed', text: `${fmtDur(gone?.min || 0)} taken off ${issueId}.`, duration: 8000, action: gone ? { label: 'Undo', run: () => mutate(issueId, (wl) => [...wl.slice(0, at), gone, ...wl.slice(at)]) } : undefined })
  }
  const startOp = (e, type, ev) => { e.stopPropagation(); e.currentTarget.setPointerCapture?.(e.pointerId); setOp({ type, id: ev.id, issueId: ev.issueId, y0: e.clientY, s0: ev.start, e0: ev.end, moved: false }) }
  const moveOp = (e) => {
    if (!op) return
    if (!op.moved && Math.abs(e.clientY - op.y0) < 4) return
    const dm = snap(((e.clientY - op.y0) / HOUR) * 60)
    if (op.type === 'resize') {
      const end = Math.max(op.s0 + SNAP, Math.min(H1 * 60, op.e0 + dm))
      patchLog(op.issueId, op.id, { start: op.s0, min: end - op.s0 })
    } else {
      const len = op.e0 - op.s0
      const st = Math.max(H0 * 60, Math.min(H1 * 60 - len, op.s0 + dm))
      patchLog(op.issueId, op.id, { start: st, min: len })
    }
    if (!op.moved) setOp((o) => ({ ...o, moved: true }))
  }
  const endOp = (ev) => { if (op && !op.moved) setForm({ id: ev.id, issueId: ev.issueId, day: ev.day, start: ev.start, end: ev.end, text: ev.text }); setOp(null) }

  const step = (n) => setCursor((c) => { const x = new Date(c); x.setDate(c.getDate() + n * (view === 'week' ? 7 : 1)); return x })
  const visible = entries.filter((e) => days.some((d) => iso(d) === e.day))
  const total = visible.reduce((a, e) => a + e.min, 0)
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const showNow = days.some((d) => iso(d) === todayIso) && nowMin >= H0 * 60 && nowMin <= H1 * 60
  const first = days[0], last = days[days.length - 1]
  const range = view === 'day'
    ? first.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    : `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <section className="wt" aria-label="Weekly timeline">
      <header className="wt-h">
        <div><h3>{view === 'day' ? 'Daily timeline' : 'Weekly timeline'}</h3><p>Drag across the grid to log time. <b>{fmtDur(total)}</b> logged {view === 'day' ? 'this day' : 'this week'}.</p></div>
        <div className="tl-tools">
          <label className="wt-who"><span className="sr-only">Show time logged by</span>
            <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Show time logged by">
              <option value="me">Only me</option>
              <option value="all">Everyone</option>
            </select>
          </label>
          <div className="su-seg" role="group" aria-label="Timeline range">{[['day', 'Day'], ['week', 'Week']].map(([k, l]) => <button key={k} type="button" aria-pressed={view === k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>)}</div>
          <div className="tm-nav">
            <button type="button" aria-label={`Previous ${view}`} onClick={() => step(-1)}><ChevronLeft size={16} strokeWidth={1.75} /></button>
            <b>{range}</b>
            <button type="button" aria-label={`Next ${view}`} onClick={() => step(1)}><ChevronRight size={16} strokeWidth={1.75} /></button>
          </div>
          <button type="button" className="mp-btn" onClick={() => setCursor(new Date())}>Today</button>
        </div>
      </header>
      <div className="wt-scroll">
        <div className="wt-grid" style={{ '--cols': days.length }}>
          <div className="wt-head"><span />{days.map((d) => <span key={iso(d)} className={iso(d) === todayIso ? 'now' : ''}>{DAYS[(d.getDay() + 6) % 7]} <b>{d.getDate()}</b></span>)}</div>
          <div className="wt-body" ref={grid} style={{ height: (H1 - H0) * HOUR }}>
            <div className="wt-hours">
              {Array.from({ length: H1 - H0 + 1 }, (_, i) => <span key={i} style={{ top: i * HOUR }}>{i + H0 === 12 ? '12 PM' : clock((i + H0) * 60)}</span>)}
              {showNow && <em className="wt-nowb" style={{ top: ((nowMin - H0 * 60) / 60) * HOUR }}>{hhmm(nowMin)}</em>}
            </div>
            {days.map((d) => {
              const k = iso(d)
              return (
                <div key={k} className={`wt-col${[0, 6].includes(d.getDay()) ? ' we' : ''}${k === todayIso ? ' today' : ''}`} onPointerDown={(e) => down(e, k)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)} role="presentation">
                  {lanes(entries.filter((e) => e.day === k)).map((e) => {
                    const h = Math.max(22, ((e.end - e.start) / 60) * HOUR - 2)
                    return (
                      <div key={e.id} role={e.own ? 'button' : undefined} tabIndex={e.own ? 0 : undefined} aria-label={`${e.text || e.title}, ${clock(e.start)} to ${clock(e.end)}, ${e.issueId}${e.own ? '' : `, ${e.who}`}`}
                        className={`wt-ev ${issueTone(e.issueId)}${h < 46 ? ' short' : ''}${e.own ? '' : ' other'}${op?.id === e.id && op.moved ? ' moving' : ''}`}
                        style={{ top: ((e.start - H0 * 60) / 60) * HOUR + 1, height: h, left: `calc(3px + (100% - 6px) * ${e.lane / e.lanes})`, width: `calc((100% - 6px) / ${e.lanes} - 2px)` }}
                        onPointerDown={e.own ? (ev) => startOp(ev, 'move', e) : undefined} onPointerMove={e.own ? moveOp : undefined} onPointerUp={e.own ? () => endOp(e) : undefined}
                        onKeyDown={e.own ? (ev) => { if (ev.key === 'Enter') setForm({ id: e.id, issueId: e.issueId, day: e.day, start: e.start, end: e.end, text: e.text }) } : undefined}>
                        <span className="wt-t">{e.lanes > 1 ? clock(e.start) : `${clock(e.start)} – ${clock(e.end)}`}</span>
                        <b>{e.text || e.title}</b>
                        <small>{e.issueId}{e.own ? '' : ` · ${e.who.split(' ')[0]}`}</small>
                        {e.own && <i className="wt-rs" aria-hidden="true" onPointerDown={(ev) => startOp(ev, 'resize', e)} onPointerMove={moveOp} onPointerUp={() => endOp(e)} />}
                      </div>
                    )
                  })}
                  {drag && drag.day === k && <div className="wt-sel" style={{ top: ((Math.min(drag.a, drag.b) - H0 * 60) / 60) * HOUR, height: Math.max(8, (Math.abs(drag.b - drag.a) / 60) * HOUR) }}><span>{clock(Math.min(drag.a, drag.b))} – {clock(Math.max(drag.a, drag.b))}</span></div>}
                  {k === todayIso && showNow && <i className="wt-now" style={{ top: ((nowMin - H0 * 60) / 60) * HOUR }} />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {form && (
        <div className="ov-scrim md-scrim" onMouseDown={() => setForm(null)}>
          <div className="md wt-pop" role="dialog" aria-modal="true" aria-label="Log time" style={{ width: 460 }} onMouseDown={(e) => e.stopPropagation()}>
            <header><h2>{form.id ? 'Edit time block' : 'Log time'}</h2><button type="button" className="ov-x" aria-label="Close" onClick={() => setForm(null)}><X size={20} strokeWidth={1.75} /></button></header>
            <div className="md-b">
              <p className="wt-when"><Clock size={16} strokeWidth={1.75} aria-hidden="true" />{new Date(`${form.day}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · {clock(form.start)} – {clock(form.end)}<b>{fmtDur(form.end - form.start)}</b></p>
              <label className="wt-f"><span>Work item</span><select value={form.issueId} onChange={(e) => setForm({ ...form, issueId: e.target.value })} disabled={!!form.id}>{work.map((x) => <option key={x.id} value={x.id}>{x.id} · {x.title}</option>)}</select></label>
              <label className="wt-f"><span>What did you work on?</span><textarea autoFocus rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Describe the work you did in this time (optional)" /></label>
              <div className="wt-f"><span>Time spent</span>
                <div className="wt-spent">
                  <input key={`${form.start}-${form.end}`} defaultValue={fmtDur(form.end - form.start)} placeholder="e.g. 1h 30m" aria-label="Time spent" onBlur={(e) => { const m = parseDur(e.target.value); if (m) setForm((f) => ({ ...f, end: Math.min(H1 * 60, f.start + m) })) }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} />
                  {[30, 60, 120, 240].map((m) => <button key={m} type="button" className={form.end - form.start === m ? 'on' : ''} onClick={() => setForm({ ...form, end: Math.min(H1 * 60, form.start + m) })}>{fmtDur(m)}</button>)}
                </div>
                <small className="wt-hint">Use 15m, 2h or 1h 30m. The end time moves to match.</small>
              </div>
              <div className="wt-f two">
                <label><span>Start</span><select value={form.start} onChange={(e) => setForm({ ...form, start: +e.target.value, end: Math.max(+e.target.value + SNAP, form.end) })}>{Array.from({ length: ((H1 - H0) * 60) / SNAP }, (_, i) => H0 * 60 + i * SNAP).map((m) => <option key={m} value={m}>{clock(m)}</option>)}</select></label>
                <label><span>End</span><select value={form.end} onChange={(e) => setForm({ ...form, end: +e.target.value })}>{Array.from({ length: ((H1 - H0) * 60) / SNAP }, (_, i) => H0 * 60 + (i + 1) * SNAP).filter((m) => m > form.start).map((m) => <option key={m} value={m}>{clock(m)}</option>)}</select></label>
              </div>
            </div>
            <footer>{form.id && <button type="button" className="wt-del" onClick={remove}><Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />Delete</button>}<span style={{ flex: 1 }} /><button type="button" className="ci-ghost" onClick={() => setForm(null)}>Cancel</button><button type="button" className="ci-btn" onClick={save} disabled={!form.issueId}>{form.id ? 'Save changes' : 'Log time'}</button></footer>
          </div>
        </div>
      )}
    </section>
  )
}
