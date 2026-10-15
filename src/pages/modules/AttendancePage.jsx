import { useEffect, useMemo, useRef, useState } from 'react'
import HistoryBody, { HistoryStats } from './HistoryCard'
import { toast } from '@/components/toast'
import {
  Building2, CalendarDays, CalendarX2, ChevronDown, CircleAlert, CircleCheck, CircleX, Clock, Coffee,
  Download, Home, LogIn, LogOut, Play, Search, Square, TrendingUp, Utensils, PartyPopper, Table2, X,
} from 'lucide-react'
import { Empty, PageHead, Pager, Tabs, Tag } from './ModuleKit'
import DatePicker from '@/components/DatePicker'
import { Requests } from './RequestsPanel'
import Insights from './Insights'

const TABS = [['history', 'Attendance history'], ['insights', 'Insights'], ['reg', 'Regularization'], ['wfh', 'Work from home']]
const pad = (n) => String(n).padStart(2, '0')
const hms = (sec) => `${pad(Math.floor(sec / 3600))}:${pad(Math.floor((sec % 3600) / 60))}:${pad(sec % 60)}`

/* ---------------- sample data (October 2026) ---------------- */
const HISTORY = (() => {
  const known = [
    ['10-10-2026', '10:16 AM', '--', '0h:00m', '0h:00m', '0h:00m', 'Missing checkout'], ['09-10-2026', '09:17 AM', '07:56 PM', '0h:00m', '0h:00m', '10h:38m', 'Present'],
    ['08-10-2026', '09:25 AM', '08:22 PM', '0h:00m', '0h:00m', '10h:56m', 'Present'], ['07-10-2026', '09:18 AM', '06:53 PM', '0h:00m', '0h:00m', '9h:34m', 'Present'],
    ['06-10-2026', '09:28 AM', '07:39 PM', '0h:00m', '0h:00m', '10h:10m', 'Present'], ['05-10-2026', '09:37 AM', '08:04 PM', '0h:00m', '0h:00m', '10h:27m', 'Present'],
    ['04-10-2026', '--', '--', '0h:00m', '0h:00m', '--', 'Week off'], ['03-10-2026', '--', '--', '0h:00m', '0h:00m', '--', 'Week off'], ['02-10-2026', '--', '--', '0h:00m', '0h:00m', '--', 'Holiday'],
    ['01-10-2026', '09:41 AM', '07:24 PM', '0h:00m', '0h:00m', '9h:42m', 'Present'], ['30-09-2026', '09:12 AM', '07:35 PM', '0h:00m', '0h:00m', '10h:23m', 'Present'],
    ['29-09-2026', '09:17 AM', '07:24 PM', '0h:00m', '0h:00m', '10h:06m', 'Present'], ['28-09-2026', '09:26 AM', '07:27 PM', '0h:00m', '0h:00m', '10h:01m', 'Present'],
    ['27-09-2026', '--', '--', '0h:00m', '0h:00m', '--', 'Week off'], ['26-09-2026', '11:03 AM', '06:00 PM', '0h:33m', '0h:28m', '6h:57m', 'Present'],
    ['25-09-2026', '09:08 AM', '08:20 PM', '0h:00m', '0h:00m', '11h:11m', 'Present'], ['24-09-2026', '09:11 AM', '07:47 PM', '0h:00m', '0h:00m', '10h:36m', 'Present'],
    ['23-09-2026', '09:28 AM', '07:37 PM', '0h:00m', '0h:00m', '10h:08m', 'Present'],
  ]
  const rows = [...known]
  // 22 Sep back to 11 Sep: weekends off, other days a plausible present row
  for (let d = 22; d >= 11; d--) {
    const wd = new Date(2026, 8, d).getDay()
    const date = `${pad(d)}-09-2026`
    if (wd === 0 || wd === 6) rows.push([date, '--', '--', '0h:00m', '0h:00m', '--', 'Week off'])
    else rows.push([date, `09:${pad(10 + ((d * 7) % 30))} AM`, `0${6 + (d % 3)}:${pad((d * 11) % 60)} PM`, '0h:00m', '0h:00m', `${9 + (d % 3)}h:${pad((d * 13) % 60)}m`, 'Present'])
  }
  return rows.map((r, i) => [i + 1, ...r])
})()

/* ---------------- Time punch ---------------- */
function Tile({ tone, icon: Ico, title, sub, state, children }) {
  return (
    <div className={`at-tile ${tone}`}>
      <div className="at-tile-h">
        <span className="ic"><Ico size={20} strokeWidth={1.75} aria-hidden="true" /></span>
        <div><b>{title}</b><small>{sub}</small></div>
        {state && <Tag tone={state[1]}>{state[0]}</Tag>}
      </div>
      {children}
    </div>
  )
}

export function TimePunch({ time24 }) {
  const [now, setNow] = useState(() => new Date())
  const [inAt] = useState('10:16 AM')
  const [outAt, setOutAt] = useState(null)
  const [onBreak, setOnBreak] = useState(false)
  const [breakKind, setBreakKind] = useState('Lunch break')
  const [work, setWork] = useState(334) // 00:05:34
  const [brk, setBrk] = useState(0)
  const [events, setEvents] = useState([{ id: 1, label: 'Clock in', tag: 'B-in', at: '10:16 AM', note: "Today's activity" }])
  const done = !!outAt

  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date())
      if (done) return
      if (onBreak) setBrk((x) => x + 1)
      else setWork((x) => x + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [onBreak, done])

  const fmt = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: !time24 })
  const big = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !time24 })
  const add = (label, tag, note) => setEvents((e) => [...e, { id: Date.now(), label, tag, at: fmt(new Date()), note }])
  const clockOut = () => { setOutAt(fmt(new Date())); setOnBreak(false); add('Clock out', 'Manual', 'Workday ended'); toast({ title: 'Clocked out', text: 'Have a good evening. Your hours for today are recorded.' }) }
  const takeBreak = () => { setOnBreak(true); add(`${breakKind} started`, 'Manual', 'Break') }
  const endBreak = () => { setOnBreak(false); add('Break ended', 'Manual', 'Back to work') }
  const status = done ? ['Done', 'Offline'] : onBreak ? ['On break', 'Break'] : ['Working', 'Working']

  return (
    <div className="at-punch">
      <div className="mp-card at-left">
        <div className="at-grid">
          <Tile tone="green" icon={LogIn} title="Clock in" sub="Start your workday" state={['Done', 'ok']}>
            <div className="at-time">{inAt}</div>
            <button type="button" className="at-btn ghost" disabled><Play size={14} strokeWidth={1.75} aria-hidden="true" />Clock in</button>
          </Tile>
          <Tile tone="red" icon={LogOut} title="Clock out" sub="End your workday" state={done ? ['Done', 'ok'] : ['Pending', 'warn']}>
            <div className="at-time">{outAt || '--:--'}</div>
            <button type="button" className="at-btn danger" disabled={done} onClick={clockOut}><Square size={14} strokeWidth={1.75} aria-hidden="true" />Clock out</button>
          </Tile>
          <Tile tone="amber" icon={Coffee} title="Take break" sub="Step away, recharge" state={onBreak ? ['On break', 'warn'] : ['On work', 'ok']}>
            <label className="at-sel"><Utensils size={14} strokeWidth={1.75} aria-hidden="true" />
              <select value={breakKind} onChange={(e) => setBreakKind(e.target.value)} disabled={onBreak || done} aria-label="Break type">{['Lunch break', 'Tea break', 'Personal break'].map((b) => <option key={b}>{b}</option>)}</select>
              <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" /></label>
            <div className="at-row"><button type="button" className="at-btn warn" disabled={onBreak || done} onClick={takeBreak}><Play size={14} strokeWidth={1.75} aria-hidden="true" />Take break</button><button type="button" className="at-btn ghost" disabled={!onBreak} onClick={endBreak}>Cancel</button></div>
          </Tile>
          <Tile tone="blue" icon={Clock} title="End break" sub="Back to work" state={onBreak ? ['On break', 'warn'] : ['Not on break', undefined]}>
            <div className="at-time dim">{onBreak ? hms(brk) : '--:--'}</div>
            <button type="button" className="at-btn primary" disabled={!onBreak} onClick={endBreak}><Play size={14} strokeWidth={1.75} aria-hidden="true" />End break</button>
          </Tile>
        </div>
        <div className="at-shift"><CalendarDays size={18} strokeWidth={1.75} aria-hidden="true" /><b>Shift</b><div><b>General shift</b><small>9:30 AM – 6:30 PM</small></div></div>
      </div>

      <div className="mp-card at-sum">
        <div className="at-sum-h"><span className="ic"><TrendingUp size={18} strokeWidth={1.75} aria-hidden="true" /></span><div><b>Monthly summary</b><small>October 2026</small></div><Tag>Oct 2026</Tag></div>
        <div className="at-sum-g">
          {[['Present', 7, 'green', CircleCheck, 70], ['Leave', 0, 'red', CircleX, 0], ['Late', 0, 'amber', CircleAlert, 0], ['Half day', 0, 'blue', Clock, 0], ['Holidays', 2, 'violet', PartyPopper, 20], ['Week offs', 9, 'teal', CalendarX2, 90]].map(([l, v, tone, Ico, pct]) => (
            <div key={l} className={`at-sum-c ${tone}`}><span className="ic"><Ico size={18} strokeWidth={1.75} aria-hidden="true" /></span><div><b>{v}</b><small>{l}</small></div><i style={{ '--w': `${pct}%` }} /></div>
          ))}
        </div>
        <div className="at-total"><Clock size={16} strokeWidth={1.75} aria-hidden="true" /><span>Total hours worked – this month</span><b>46.4h <small>(1.5h avg)</small></b></div>
      </div>

      <div className="at-right">
        <div className="mp-card">
          <div className="at-act-h"><span className="ic"><CalendarDays size={18} strokeWidth={1.75} aria-hidden="true" /></span><div><b>Today&apos;s activity</b><small>Saturday, October 10, 2026</small></div><Tag tone="ok">Present</Tag></div>
          <div className="at-clock"><b>{big}</b><div><Tag tone={status[1] === 'Working' ? 'ok' : 'warn'}>{status[0]}</Tag><Tag><Building2 size={12} strokeWidth={1.75} aria-hidden="true" />Office</Tag></div></div>
          <div className="at-two">
            <div className="at-mini"><span className="mp-lbl">Work time</span><b>{hms(work)}</b></div>
            <div className="at-mini amber"><span className="mp-lbl">Break time</span><b>{hms(brk)}</b></div>
          </div>
        </div>
        <div className="mp-card">
          <div className="at-act-h"><span className="ic"><Clock size={18} strokeWidth={1.75} aria-hidden="true" /></span><div><b>Activity timeline</b></div>
            <div className="at-legend"><span><i>B</i>Biometric</span><span><i>M</i>Manual</span><span><i>R</i>Regularized</span></div></div>
          <ul className="at-events">
            {events.map((e) => (
              <li key={e.id}><i aria-hidden="true" /><span className="ic"><LogIn size={16} strokeWidth={1.75} aria-hidden="true" /></span><div><b>{e.label} <em>{e.tag}</em></b><small>{e.note}</small></div><div className="r"><b>{e.at}</b><small>TIME</small></div></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Attendance history (Keka-style: visual timeline, effective / break / gross, arrival, log) ---------------- */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const toMin = (t) => { const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t || ''); return m ? ((Number(m[1]) % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(m[2]) : null }
const hm = (min) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`

const LOGDAYS = HISTORY.map((r) => {
  const [dd, mm, yy] = r[1].split('-').map(Number)
  const date = new Date(yy, mm - 1, dd)
  const inM = toMin(r[2]); const outM = toMin(r[3])
  const kind = r[7] === 'Week off' ? 'woff' : r[7] === 'Holiday' ? 'hol' : r[7] === 'Absent' ? 'pen' : 'work'
  const late = inM != null ? inM - (9 * 60 + 30) : 0
  return { date, label: `${DOW[date.getDay()]}, ${String(dd).padStart(2, '0')} ${MON[mm - 1]}`, kind, inM, outM, gross: r[6], status: r[7], late, month: mm - 1 }
})

function Visual({ d }) {
  // 24h strip: faint hour ticks, filled bar between check-in and check-out, clock-in/out markers
  const from = d.inM ?? 0
  const to = d.outM ?? d.inM ?? 0
  const pct = (m) => `${(m / 1440) * 100}%`
  return (
    <div className="lg-vis" role="img" aria-label={d.outM ? `Worked from ${d.inM ? Math.floor(from / 60) : 0}:00` : 'No complete punch'}>
      {Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: pct(i * 60) }} />)}
      {d.inM != null && <b className={d.outM ? '' : 'open'} style={{ left: pct(from), width: d.outM ? `calc(${pct(to - from)})` : '10px' }} />}
    </div>
  )
}

function History() {
  const [mode, setMode] = useState('calendar')
  const [range, setRange] = useState('30')
  const [dates, setDates] = useState({ from: null, to: null })
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(20)
  const rows = useMemo(() => LOGDAYS.filter((d) => (range === '30' || d.month === Number(range)) && (!dates.from || (d.date >= dates.from && d.date <= dates.to)) && (!q || `${d.label} ${d.status}`.toLowerCase().includes(q.toLowerCase()))), [range, q, dates])
  const view = rows.slice(page * perPage, page * perPage + perPage)
  const tabs = [['30', '30 days'], ['9', 'Oct'], ['8', 'Sep'], ['7', 'Aug']].filter(([k]) => k === '30' || LOGDAYS.some((d) => d.month === Number(k)))

  const toggle = (
    <div className="su-seg" role="group" aria-label="History view">
      <button type="button" aria-label="Calendar view" title="Calendar view" aria-pressed={mode === 'calendar'} className={mode === 'calendar' ? 'on' : ''} onClick={() => setMode('calendar')}><CalendarDays size={16} strokeWidth={1.75} /></button>
      <button type="button" aria-label="Detailed log" title="Detailed log" aria-pressed={mode === 'log'} className={mode === 'log' ? 'on' : ''} onClick={() => setMode('log')}><Table2 size={16} strokeWidth={1.75} /></button>
    </div>
  )
  return (
    <section className="tc ah">
      <header className="tc-h ah-h">
        <div><h3>Attendance history</h3><p>{mode === 'calendar' ? 'Your last 30 days at a glance.' : 'Every day with your check-in, check-out and hours. Weekends and holidays are shaded.'}</p></div>
        <div className="ah-a">{toggle}<button type="button" className="mp-btn"><Download size={16} strokeWidth={1.75} aria-hidden="true" />Export</button></div>
      </header>
      {mode === 'calendar' ? <HistoryBody /> : (
        <>
          <div className="tc-bar">
        <>
          <label className="mp-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Search" aria-label="Search attendance" /></label>
          <div className="su-seg" role="group" aria-label="Period">{tabs.map(([k, l]) => <button key={k} type="button" aria-pressed={range === k} className={range === k ? 'on' : ''} onClick={() => { setRange(k); setPage(0) }}>{l}</button>)}</div>
          <DatePicker value={dates} onApply={(v) => { setDates(v); setPage(0) }} />
                  </>
          </div>
          <div className="tc-body">
      {rows.length === 0 ? (
        <Empty icon={Search} title="No days found" text="Your search or dates did not match any attendance record. Widen the dates or clear the search.">
          <div className="mp-empty-a"><button type="button" className="mp-btn" onClick={() => { setQ(''); setDates({ from: null, to: null }); setRange('30') }}>Clear filters</button></div>
        </Empty>
      ) : (
      <div className="lg-wrap" style={{ minHeight: Math.min(perPage, rows.length) * 53 + 42 }}>
        <div className="lg-row lg-head" role="row"><span>Date</span><span>Attendance visual</span><span>Effective hours</span><span>Break taken</span><span>Gross hours</span><span>Arrival</span><span>Log</span></div>
        {view.map((d) => {
          if (d.kind === 'woff' || d.kind === 'hol') {
            return (
              <div key={d.label + d.month} className={`lg-row band ${d.kind}`} role="row">
                <span className="lg-date">{d.label}<em className={d.kind === 'woff' ? 'tg' : 'tg hol'}>{d.kind === 'woff' ? 'W-OFF' : 'HOLIDAY'}</em></span>
                <span className="lg-msg">{d.kind === 'woff' ? 'Full day weekly-off' : 'Company holiday'}</span>
              </div>
            )
          }
          const worked = d.gross && d.gross !== '--'
          const arrival = d.inM == null ? null : d.late > 5 ? `${hm(d.late).replace(/ /g, '')} late` : 'On time'
          return (
            <div key={d.label + d.month} className="lg-row" role="row">
              <span className="lg-date">{d.label}</span>
              <span><Visual d={d} /></span>
              <span className="lg-eff">{worked ? <><i className="dot" />{d.gross.replace(':', ' ')}</> : <><i className="dot off" />0h 00m</>}</span>
              <span>0h 00m</span>
              <span>{worked ? d.gross.replace(':', ' ') : '0h 00m'}</span>
              <span className={arrival === 'On time' ? 'ok' : 'late'}>{arrival ? <><CircleCheck size={14} strokeWidth={1.75} aria-hidden="true" />{arrival}</> : '—'}</span>
              <span className="lg-log">{d.status === 'Missing checkout' ? <Tag tone="warn">Missing out</Tag> : worked ? <CircleCheck size={18} strokeWidth={1.75} className="ok" aria-label="Logged" /> : <Tag tone="err">Penalty</Tag>}</span>
            </div>
          )
        })}
      </div>
      )}
          </div>
          <div className="tc-f">{rows.length > 0 ? <Pager total={rows.length} page={page} setPage={setPage} perPage={perPage} setPerPage={setPerPage} options={[10, 20, 50]} /> : null}</div>
        </>
      )}
    </section>
  )
}

/* ---------------- request tabs ---------------- */
function useRequests(label) {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const add = (r) => setRows((x) => [{ id: Date.now(), requested: '10 Oct 2026', ...r, status: 'Pending' }, ...x])
  return { rows, open, setOpen, add, label }
}

function FormCard({ title, fields, onSubmit, onClose }) {
  const [v, setV] = useState(() => Object.fromEntries(fields.map((f) => [f.key, f.options ? f.options[0] : ''])))
  return (
    <form className="mp-card sh-form" onSubmit={(e) => { e.preventDefault(); onSubmit(v) }}>
      <div className="sh-form-h"><b>{title}</b><button type="button" aria-label="Close" onClick={onClose}><X size={16} strokeWidth={1.75} /></button></div>
      {fields.map((f) => (
        <label key={f.key} className={f.wide ? 'wide' : ''}><span>{f.label}</span>
          {f.options
            ? <select value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })}>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
            : <input type={f.type || 'text'} value={v[f.key]} placeholder={f.placeholder} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
        </label>
      ))}
      <div className="sh-form-f"><button type="button" className="mp-btn" onClick={onClose}>Cancel</button><button type="submit" className="mp-btn primary">Submit request</button></div>
    </form>
  )
}

function Regularization() {
  const r = useRequests('reg')
  const count = (s) => r.rows.filter((x) => x.status === s).length
  return (
    <Requests
      title="Regularization" rows={r.rows} createLabel="Create request" onCreate={() => r.setOpen((o) => !o)}
      stats={[{ label: 'Total', value: r.rows.length, icon: CalendarDays, tone: 'blue' }, { label: 'Pending', value: count('Pending'), icon: Clock, tone: 'amber' }, { label: 'Approved', value: 0, icon: CircleCheck, tone: 'green' }, { label: 'Rejected', value: 0, icon: CircleX, tone: 'red' }]}
      statuses={['Pending', 'Approved', 'Rejected']} types={['All regularization types', 'Missed punch', 'Late arrival', 'Early departure']}
      columns={['Requested on', 'Date', 'Type', 'Requested time', 'Reason', 'Status']}
      emptyTitle="No regularization found" emptyText="There are no regularization requests available at the moment. Try adjusting your search criteria, modifying filters, or check back later."
    >
      {r.open && (
        <FormCard title="New regularization request" onClose={() => r.setOpen(false)}
          fields={[{ key: 'date', label: 'Attendance date', options: ['10 Oct 2026', '09 Oct 2026', '08 Oct 2026', '07 Oct 2026'] }, { key: 'type', label: 'Type', options: ['Missed punch', 'Late arrival', 'Early departure'] }, { key: 'time', label: 'Requested time', type: 'time' }, { key: 'reason', label: 'Reason', wide: true, placeholder: 'Why do you need this change?' }]}
          onSubmit={(v) => { r.add({ mine: v.date, with: v.type, theirs: v.time || '—', reason: v.reason || '—' }); r.setOpen(false); toast({ title: 'Regularization request sent', text: 'Your manager will review it shortly.' }) }} />
      )}
    </Requests>
  )
}

function Wfh() {
  const r = useRequests('wfh')
  return (
    <Requests
      title="Work from home requests" search rows={r.rows} createLabel="Request WFH" onCreate={() => r.setOpen((o) => !o)}
      stats={[{ label: 'Total', value: r.rows.length, icon: Home, tone: 'blue' }, { label: 'Pending', value: r.rows.length, icon: Clock, tone: 'amber' }, { label: 'Approved', value: 0, icon: CircleCheck, tone: 'green' }, { label: 'Rejected', value: 0, icon: CircleX, tone: 'red' }]}
      statuses={['Pending', 'Approved', 'Rejected']}
      columns={['Requested on', 'From', 'To', 'Days', 'Reason', 'Status']}
      emptyTitle="No work from home requests found" emptyText="There are no work from home requests available at the moment. Try adjusting your search criteria, modifying filters, or check back later."
    >
      {r.open && (
        <FormCard title="New work from home request" onClose={() => r.setOpen(false)}
          fields={[{ key: 'from', label: 'From', type: 'date' }, { key: 'to', label: 'To', type: 'date' }, { key: 'reason', label: 'Reason', wide: true, placeholder: 'Why will you work from home?' }]}
          onSubmit={(v) => { r.add({ mine: v.from || '—', with: v.to || '—', theirs: v.from && v.to ? Math.max(1, Math.round((new Date(v.to) - new Date(v.from)) / 864e5) + 1) : '—', reason: v.reason || '—' }); r.setOpen(false); toast({ title: 'Work from home request sent', text: 'You will be notified once it is approved.' }) }} />
      )}
    </Requests>
  )
}

export default function AttendancePage({ initial = 'history' }) {
  const [tab, setTab] = useState(TABS.some(([k]) => k === initial) ? initial : 'history')
  const ref = useRef(null)
  return (
    <div className="mp" ref={ref}>
      <PageHead title="Attendance" desc="Punch in and out, review your calendar and history, and raise requests." />
      <Tabs label="Attendance sections" value={tab} onChange={setTab} items={TABS} />
      {tab === 'history' && <HistoryStats />}
      {tab === 'insights' && <Insights />}
      {tab === 'history' && <History />}
      {tab === 'reg' && <Regularization />}
      {tab === 'wfh' && <Wfh />}
    </div>
  )
}
