import { useMemo, useState } from 'react'
import { CircleCheck, Clock, FileText, ListChecks, Plus, RefreshCw, Search, TrendingDown, X } from 'lucide-react'
import { PageHead, Pager, Tag } from './ModuleKit'
import { Stat } from './RequestsPanel'
import Slideout from '@/components/Slideout'
import DatePicker, { rangeLabel } from '@/components/DatePicker'
import { toast } from '@/components/toast'

export const CATEGORIES = ['Payroll Issue', 'IT Access', 'Leave Query', 'Asset Issue', 'HR Policy']
export const PRIORITIES = [['P1', 'Critical', 'err'], ['P2', 'High', 'warn'], ['P3', 'Medium', 'info'], ['P4', 'Low', undefined]]
const RANGES = [['today', 'Today', 1], ['7d', 'Last 7d', 7], ['30d', 'Last 30d', 30], ['quarter', 'This Quarter', 90], ['custom', 'Custom', 7]]
const NOW = () => new Date()
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })

// ---- shared range bar (Today / Last 7d / ... / Custom) ----
export function RangeBar({ range, setRange, custom, setCustom, children }) {
  return (
    <div className="su-range">
      <div className="su-seg" role="group" aria-label="Date range">
        {RANGES.filter((r) => r[0] !== 'custom').map(([k, l]) => (
          <button key={k} type="button" aria-pressed={range === k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{l}</button>
        ))}
        <DatePicker className={range === 'custom' ? 'su-cust on' : 'su-cust'} value={custom} label={range === 'custom' ? rangeLabel(custom, 'Custom') : 'Custom'} onApply={(v) => { setCustom(v); setRange(v.from ? 'custom' : '7d') }} align="right" />
      </div>
      {children}
    </div>
  )
}

const inRange = (t, range, custom) => {
  if (range === 'custom' && custom?.from) { const e = new Date(custom.to || custom.from); e.setHours(23, 59, 59); return t.createdAt >= custom.from && t.createdAt <= e }
  const days = RANGES.find((r) => r[0] === range)[2]
  const from = NOW(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - (days - 1))
  return t.createdAt >= from
}

function VolumeChart({ tickets, range }) {
  const days = RANGES.find((r) => r[0] === range)[2]
  const n = Math.min(days, 14)
  const buckets = useMemo(() => Array.from({ length: n }, (_, i) => { const d = NOW(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (n - 1 - i)); return d }), [n])
  const rows = buckets.map((d) => ({
    d,
    created: tickets.filter((t) => dayKey(t.createdAt) === dayKey(d)).length,
    resolved: tickets.filter((t) => t.status === 'Resolved' && dayKey(t.resolvedAt || t.createdAt) === dayKey(d)).length,
    discarded: tickets.filter((t) => t.status === 'Discarded' && dayKey(t.createdAt) === dayKey(d)).length,
  }))
  const max = Math.max(4, ...rows.flatMap((r) => [r.created, r.resolved, r.discarded]))
  const W = 700, H = 260, L = 34, B = 28, T = 10, R = 22
  const x = (i) => L + (n === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1))
  const y = (v) => T + (H - T - B) * (1 - v / max)
  const line = (key) => rows.map((r, i) => `${i ? 'L' : 'M'}${x(i)},${y(r[key])}`).join(' ')
  const ticks = Array.from({ length: max + 1 }, (_, i) => i).filter((v) => max <= 6 || v % Math.ceil(max / 5) === 0)
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="su-svg" role="img" aria-label="Ticket volume chart">
        {ticks.map((v) => (<g key={v}><line x1={L} x2={W - R + 10} y1={y(v)} y2={y(v)} className="gl" /><text x={L - 8} y={y(v) + 4} className="ax" textAnchor="end">{v}</text></g>))}
        {rows.map((r, i) => (i % Math.ceil(n / 7) === 0 ? <text key={i} x={x(i)} y={H - 6} className="ax" textAnchor="middle">{fmt(r.d)}</text> : null))}
        <path d={line('created')} className="ln c" /><path d={line('resolved')} className="ln r" /><path d={line('discarded')} className="ln d" />
        {rows.map((r, i) => <g key={i}><circle cx={x(i)} cy={y(r.created)} r="3" className="dt c" /><circle cx={x(i)} cy={y(r.resolved)} r="3" className="dt r" /></g>)}
      </svg>
      <ul className="su-legend"><li><i className="c" />Created</li><li><i className="r" />Resolved</li><li><i className="d" />Discarded</li></ul>
    </>
  )
}

function CategoryChart({ tickets }) {
  const counts = CATEGORIES.map((c) => [c, tickets.filter((t) => t.category === c).length])
  const max = Math.max(4, ...counts.map((c) => c[1]))
  return (
    <ul className="su-bars" aria-label="Tickets by category">
      {counts.map(([c, v]) => (
        <li key={c}><span>{c}</span><div><i style={{ width: `${(v / max) * 100}%` }} /></div><b>{v}</b></li>
      ))}
      <li className="axis"><span /><div>{Array.from({ length: max + 1 }, (_, i) => i).filter((v) => max <= 6 || v % Math.ceil(max / 5) === 0).map((v) => <em key={v}>{v}</em>)}</div><b /></li>
    </ul>
  )
}

export function SupportDashboard({ tickets, onRefresh }) {
  const [range, setRange] = useState('7d')
  const [custom, setCustom] = useState({ from: null, to: null })
  const list = tickets.filter((t) => inRange(t, range, custom))
  const resolved = list.filter((t) => t.status === 'Resolved').length
  const open = list.filter((t) => t.status === 'Open' || t.status === 'In progress').length
  const esc = list.length ? Math.round((list.filter((t) => t.priority === 'P1').length / list.length) * 100) : 0
  const label = range === 'custom' ? rangeLabel(custom, 'Custom') : RANGES.find((r) => r[0] === range)[1]
  return (
    <div className="mp su">
      <PageHead title="Support dashboard" desc="Ticket volume, backlog and escalations at a glance." />
      <RangeBar range={range} setRange={setRange} custom={custom} setCustom={setCustom}>
        <button type="button" className="mp-btn" onClick={() => { onRefresh(); toast({ title: 'Dashboard refreshed', tone: 'info', duration: 1800 }) }}><RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />Refresh</button>
      </RangeBar>
      <div className="sh-stats c4">
        <Stat label="Tickets Created" value={list.length} icon={ListChecks} tone="violet" trend={list.length ? { v: `${list.length * 100}%`, dir: 'up', title: 'vs previous period' } : { v: '0%', dir: 'up', title: 'vs previous period' }} />
        <Stat label="Resolved" value={resolved} icon={CircleCheck} tone="teal" trend={{ v: `${resolved ? 100 : 0}%`, dir: resolved ? 'up' : 'down', bad: !resolved && list.length > 0, title: 'vs previous period' }} />
        <Stat label="Open Backlog" value={open} icon={Clock} tone="blue" trend={{ v: `${open}`, dir: open ? 'up' : 'down', bad: open > 0, title: 'open tickets right now' }} />
        <Stat label="Escalation Rate" value={`${esc}%`} icon={TrendingDown} tone="red" />
      </div>
      <div className="su-two">
        <section className="su-card"><h3>Ticket Volume</h3><p>Created vs resolved over {label}</p><VolumeChart tickets={list} range={range} /></section>
        <section className="su-card"><h3>By Category</h3><p>Ticket distribution across every configured category</p><CategoryChart tickets={list} /></section>
      </div>
    </div>
  )
}

export function MyQueue({ tickets, setTickets }) {
  const [range, setRange] = useState('7d')
  const [custom, setCustom] = useState({ from: null, to: null })
  const [prio, setPrio] = useState(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], priority: 'P3', detail: '' })
  const [pg, setPg] = useState(0)
  const [per, setPer] = useState(10)

  const shown = tickets.filter((t) => inRange(t, range, custom) && (!prio || t.priority === prio) && (!q || `${t.id} ${t.title} ${t.category}`.toLowerCase().includes(q.toLowerCase())))
  const view = shown.slice(pg * per, pg * per + per)
  const create = () => {
    const id = `TKT-${1001 + tickets.length}`
    setTickets((l) => [{ id, ...form, status: 'Open', createdAt: NOW() }, ...l])
    setOpen(false); setForm({ title: '', category: CATEGORIES[0], priority: 'P3', detail: '' })
    toast({ title: 'Ticket created', text: `${id} is now in your queue.` })
  }
  const move = (id, status) => setTickets((l) => l.map((t) => (t.id === id ? { ...t, status, resolvedAt: status === 'Resolved' ? NOW() : t.resolvedAt } : t)))

  return (
    <div className="mp su">
      <PageHead title="My queue" desc="Tickets assigned to you. Filter by priority or date." />
      <div className="su-bar">
        <div className="su-title">
          {PRIORITIES.map(([p, l]) => <button key={p} type="button" className={prio === p ? 'su-chip on' : 'su-chip'} aria-pressed={prio === p} onClick={() => { setPrio(prio === p ? null : p); setPg(0) }}>{p} {l}</button>)}
        </div>
        <div className="su-tools">
          <RangeBar range={range} setRange={setRange} custom={custom} setCustom={setCustom} />
          <label className="mp-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => { setQ(e.target.value); setPg(0) }} aria-label="Search tickets" placeholder="Search tickets" /></label>
          <button type="button" className="mp-btn" onClick={() => toast({ title: 'Queue refreshed', tone: 'info', duration: 1800 })}><RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />Refresh</button>
          <button type="button" className="mp-btn primary" onClick={() => setOpen(true)}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Create Ticket</button>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mp-card mp-pad"><div className="mp-empty"><span className="mp-empty-ic"><FileText size={22} strokeWidth={1.5} aria-hidden="true" /></span><b>No tickets found</b><p>Try adjusting your search, clearing filters, or check back later.</p></div></div>
      ) : (
        <>
          <div className="ex-table-wrap">
            <table className="ex-table lv-table">
              <colgroup><col style={{ width: 110 }} /><col /><col style={{ width: 160 }} /><col style={{ width: 90 }} /><col style={{ width: 130 }} /><col style={{ width: 110 }} /><col style={{ width: 150 }} /></colgroup>
              <thead><tr><th>Ticket</th><th>Subject</th><th>Category</th><th>Priority</th><th>Status</th><th>Created</th><th /></tr></thead>
              <tbody>
                {view.map((t) => (
                  <tr key={t.id}>
                    <td><b>{t.id}</b></td><td title={t.title}>{t.title}</td><td>{t.category}</td>
                    <td><Tag tone={PRIORITIES.find((p) => p[0] === t.priority)[2]}>{t.priority}</Tag></td>
                    <td><Tag tone={t.status === 'Resolved' ? 'ok' : t.status === 'Discarded' ? undefined : 'info'}>{t.status}</Tag></td>
                    <td className="ex-date">{fmt(t.createdAt)}</td>
                    <td className="r su-act">{t.status === 'Open' || t.status === 'In progress'
                      ? <><button type="button" className="mp-btn sm" onClick={() => move(t.id, 'Resolved')}>Resolve</button> <button type="button" className="ps-dots" aria-label={`Discard ${t.id}`} onClick={() => move(t.id, 'Discarded')}><X size={14} strokeWidth={1.75} /></button></> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager total={shown.length} page={pg} setPage={setPg} perPage={per} setPerPage={setPer} options={[10, 20, 50]} />
        </>
      )}

      <Slideout open={open} title="Create ticket" desc="Tell support what is going on." onClose={() => setOpen(false)}
        footer={<><button type="button" className="ov-btn" onClick={() => setOpen(false)}>Cancel</button><button type="button" className="ov-btn primary" disabled={!form.title} onClick={create}>Create ticket</button></>}>
        <label className="ov-field"><span>Subject</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Salary slip is missing" /></label>
        <div className="ov-two">
          <label className="ov-field"><span>Category</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="ov-field"><span>Priority</span><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(([p, l]) => <option key={p} value={p}>{p} {l}</option>)}</select></label>
        </div>
        <label className="ov-field"><span>Details</span><textarea rows={5} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} /></label>
      </Slideout>
    </div>
  )
}
