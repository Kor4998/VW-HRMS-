import { useMemo, useState } from 'react'
import { Activity, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, Eye, EyeOff, Flame, KeyRound, Layers, ListChecks, Plus, Rocket, Search, Trash2, Bug, Users, CalendarDays } from 'lucide-react'
import { PageTop, Card, teamOf } from './ProjectOps'
import { Tag } from './ModuleKit'
import { Stat } from './RequestsPanel'
import { parseDur, fmtDur } from './issueTime'
import { toast } from '@/components/toast'
import WeekTimeline from './WeekTimeline'
import Avatar from '@/components/Avatar'

function Av({ name, size = 28 }) { return <Avatar name={name} size={size} /> }
const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dl = (name, text, type = 'text/csv') => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href) }

// ---------- Test repository: suites -> scenarios -> cases
export function TestRepository() {
  const [suites, setSuites] = useState([])
  const [sel, setSel] = useState(null)
  const [selS, setSelS] = useState(null)
  const [draft, setDraft] = useState({ a: '', b: '', c: '' })
  const suite = suites.find((s) => s.id === sel)
  const scen = suite?.scenarios.find((s) => s.id === selS)
  const up = (fn) => setSuites((l) => l.map((s) => (s.id === sel ? fn(s) : s)))
  const addSuite = () => { const v = draft.a.trim(); if (!v) return; const s = { id: Date.now(), name: v, scenarios: [] }; setSuites([...suites, s]); setSel(s.id); setSelS(null); setDraft({ ...draft, a: '' }) }
  const addScen = () => { const v = draft.b.trim(); if (!v || !suite) return; const s = { id: Date.now(), name: v, cases: [] }; up((x) => ({ ...x, scenarios: [...x.scenarios, s] })); setSelS(s.id); setDraft({ ...draft, b: '' }) }
  const addCase = () => { const v = draft.c.trim(); if (!v || !scen) return; up((x) => ({ ...x, scenarios: x.scenarios.map((s) => (s.id === selS ? { ...s, cases: [...s.cases, { id: Date.now(), name: v, status: 'Not run' }] } : s)) })); setDraft({ ...draft, c: '' }) }
  const setCase = (id, status) => up((x) => ({ ...x, scenarios: x.scenarios.map((s) => (s.id === selS ? { ...s, cases: s.cases.map((c) => (c.id === id ? { ...c, status } : c)) } : s)) }))
  const col = (title, n, body, input) => <section className="po-tr"><header>{title}<em>{n}</em></header><div>{body}</div>{input}</section>
  const inp = (k, ph, fn, off) => <div className="po-tr-in"><input value={draft[k]} disabled={off} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') fn() }} placeholder={ph} aria-label={ph} /><button type="button" className="ci-btn" disabled={off || !draft[k].trim()} onClick={fn}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Add</button></div>
  const empty = (Icon, t, d) => <div className="po-tr-e"><span><Icon size={22} strokeWidth={1.5} aria-hidden="true" /></span><b>{t}</b><p>{d}</p></div>
  return (
    <div className="po">
      <PageTop title="Test repository" sub="Author test suites, the scenarios inside them, and the cases inside those. A work item attaches cases from here — it does not create its own." />
      <div className="po-3t">
        {col('Suites', suites.length, suites.length ? <ul>{suites.map((s) => <li key={s.id}><button type="button" className={sel === s.id ? 'on' : ''} onClick={() => { setSel(s.id); setSelS(null) }}>{s.name}<em>{s.scenarios.length}</em></button></li>)}</ul> : empty(Layers, 'No suites yet.', 'A suite is a body of testing — Identity & Access, Checkout. Create the first one to start filing scenarios under it.'), inp('a', 'New suite name', addSuite))}
        {col(suite ? `Scenarios · ${suite.name}` : 'Scenarios · unfiled', suite?.scenarios.length || 0, suite?.scenarios.length ? <ul>{suite.scenarios.map((s) => <li key={s.id}><button type="button" className={selS === s.id ? 'on' : ''} onClick={() => setSelS(s.id)}>{s.name}<em>{s.cases.length}</em></button></li>)}</ul> : empty(ListChecks, suite ? 'No scenarios yet.' : 'Nothing unfiled.', suite ? 'Add the first scenario to this suite.' : 'Pick a suite to add a scenario to it.'), inp('b', 'New scenario name', addScen, !suite))}
        {col('Cases', scen?.cases.length || 0, scen?.cases.length ? <ul>{scen.cases.map((c) => <li key={c.id} className="po-case"><span>{c.name}</span><select value={c.status} aria-label={`Status of ${c.name}`} onChange={(e) => setCase(c.id, e.target.value)}>{['Not run', 'Passed', 'Failed', 'Blocked'].map((s) => <option key={s}>{s}</option>)}</select></li>)}</ul> : empty(CheckCircle2, scen ? 'No cases yet.' : 'No scenario selected.', scen ? 'Add a test case to this scenario.' : 'Pick a scenario to add a case to it.'), inp('c', 'New case name', addCase, !scen))}
      </div>
    </div>
  )
}

// ---------- Timesheets
const startOfWeek = (d) => { const x = new Date(d); const k = (x.getDay() + 6) % 7; x.setDate(x.getDate() - k); x.setHours(0, 0, 0, 0); return x }
export function Timesheets({ project, issues = [], setIssues }) {
  const [mode, setMode] = useState('timeline')
  const [wk, setWk] = useState(() => startOfWeek(new Date()))
  const [logs, setLogs] = useState({})
  const team = teamOf(project)
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(wk); d.setDate(wk.getDate() + i); return d })
  const key = (n, d) => `${n}|${isoLocal(d)}`
  const todayKey = isoLocal(new Date())
  const fromTickets = useMemo(() => { const m = {}; issues.forEach((x) => (x.worklog || []).forEach((w) => { if (/^\d{4}-\d{2}-\d{2}$/.test(w.date || '')) m[`${w.who}|${w.date}`] = (m[`${w.who}|${w.date}`] || 0) + (w.min || 0) })); return m }, [issues])
  const val = (n, d) => (logs[key(n, d)] || 0) + (fromTickets[key(n, d)] || 0)
  const rowTotal = (n) => days.reduce((a, d) => a + val(n, d), 0)
  const total = team.reduce((a, m) => a + rowTotal(m.name), 0)
  const todayTotal = team.reduce((a, m) => a + val(m.name, new Date()), 0)
  const logged = team.filter((m) => rowTotal(m.name) > 0).length
  const fmt = (d) => isoLocal(d)
  const shift = (n) => setWk((w) => { const x = new Date(w); x.setDate(w.getDate() + n * 7); return x })
  const exportCsv = () => dl('timesheet.csv', ['Member,' + days.map((d) => fmt(d)).join(',') + ',Total', ...team.map((m) => [m.name, ...days.map((d) => fmtDur(val(m.name, d)) || '0m'), fmtDur(rowTotal(m.name))].join(','))].join('\n'))
  const toggle = <div className="su-seg" role="group" aria-label="Timesheet view">{[['timeline', 'Timeline'], ['grid', 'Grid']].map(([k, l]) => <button key={k} type="button" aria-pressed={mode === k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>)}</div>
  if (mode === 'timeline') return <div className="po"><PageTop title="Timesheet" sub={`Time logged on ${project.name} work items, laid out on the week`}><div className="po-ctl">{toggle}</div></PageTop><WeekTimeline issues={issues} setIssues={setIssues} me="Venkatesh Korlapati" /></div>
  return (
    <div className="po">
      <PageTop title="Timesheet" sub={`Team worklogs for ${project.name}`}>
        <div className="po-ctl">
          <div className="po-wk"><button type="button" aria-label="Previous week" onClick={() => shift(-1)}><ChevronLeft size={16} strokeWidth={1.75} /></button><span><CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" />{fmt(days[0])} – {fmt(days[6])}</span><button type="button" aria-label="Next week" onClick={() => shift(1)}><ChevronRight size={16} strokeWidth={1.75} /></button></div>
          {toggle}
        </div>
      </PageTop>
      <div className="sh-stats c3"><Stat label="Period total" value={fmtDur(total)} icon={Clock} tone="blue" /><Stat label="Today" value={fmtDur(todayTotal)} icon={CalendarDays} tone="blue" /><Stat label="Members logged" value={`${logged}/${team.length}`} icon={Users} tone="blue" /></div>
      <section className="wl"><div className="po-tsh"><b>Timesheet <em>{project.key}</em></b><button type="button" className="po-mini" onClick={exportCsv}><Download size={14} strokeWidth={1.75} aria-hidden="true" />Export CSV</button></div>
        <div className="wl-scroll"><table className="wl-table po-ts"><thead><tr><th>Team member</th>{days.map((d) => <th key={fmt(d)} className={`num${fmt(d) === todayKey ? ' today' : ''}`}>{d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}<b>{d.getDate()}</b></th>)}<th className="num">Total</th><th>Signal</th></tr></thead>
          <tbody>{team.map((m) => { const miss = days.filter((d) => ![0, 6].includes(d.getDay()) && fmt(d) <= todayKey && !val(m.name, d)).length; return (
            <tr key={m.name}><td><span className="wl-as"><Av name={m.name} size={24} /><span><b>{m.name}</b><small>{m.role}</small></span></span></td>
              {days.map((d) => <td key={fmt(d)} className={`num${d.getDay() % 6 === 0 ? ' off' : ''}`}><input defaultValue={val(m.name, d) ? fmtDur(val(m.name, d)) : ''} placeholder="·" aria-label={`${m.name} ${fmt(d)}`} key={`${key(m.name, d)}${val(m.name, d)}`} onBlur={(e) => { const m2 = e.target.value ? parseDur(e.target.value) : 0; if (m2 !== null) setLogs((l) => ({ ...l, [key(m.name, d)]: Math.max(0, m2 - (fromTickets[key(m.name, d)] || 0)) })) }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} /></td>)}
              <td className="num"><b>{fmtDur(rowTotal(m.name))}</b></td><td>{miss ? <span className="po-pill warn">{miss} missing</span> : <span className="po-pill ok">On track</span>}</td></tr>) })}
            <tr className="po-sum"><td>Day total</td>{days.map((d) => { const t = team.reduce((a, m) => a + val(m.name, d), 0); return <td key={fmt(d)} className="num">{t ? fmtDur(t) : '—'}</td> })}<td className="num"><b>{fmtDur(total)}</b></td><td /></tr></tbody></table></div></section>
    </div>
  )
}

// ---------- Calendar
export function ProjectCalendar({ issues, cols }) {
  const [cur, setCur] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [mode, setMode] = useState('Month')
  const [scope, setScope] = useState('Whole project')
  const [type, setType] = useState('')
  const lastKey = cols[cols.length - 1][0]
  const items = issues.filter((x) => x.due && (!type || x.type === type) && (scope === 'Whole project' || x.who === 'Venkatesh Korlapati'))
  const first = new Date(cur); const lead = (first.getDay() + 6) % 7
  const start = new Date(first); start.setDate(1 - lead)
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const todayIso = iso(new Date())
  const inView = items.filter((x) => x.due.slice(0, 7) === iso(cur).slice(0, 7))
  const step = (n) => setCur((c) => { const x = new Date(c); x.setMonth(c.getMonth() + n); return x })
  return (
    <div className="po">
      <PageTop title="Calendar" sub="Work items by date, with the team's non-working days" />
      <div className="po-bar"><select className="pb-sel" value={type} onChange={(e) => setType(e.target.value)} aria-label="Work type"><option value="">All work items</option>{['task', 'bug', 'story', 'epic'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}s</option>)}</select>
        <div className="su-seg" role="group" aria-label="Scope">{['My items', 'Whole project'].map((k) => <button key={k} type="button" aria-pressed={scope === k} className={scope === k ? 'on' : ''} onClick={() => setScope(k)}>{k}</button>)}</div><span>{inView.length} items in view</span></div>
      <div className="po-bar"><button type="button" className="po-mini" onClick={() => { const d = new Date(); d.setDate(1); setCur(d) }}>Today</button><button type="button" className="po-ic" aria-label="Previous month" onClick={() => step(-1)}><ChevronLeft size={16} strokeWidth={1.75} /></button><button type="button" className="po-ic" aria-label="Next month" onClick={() => step(1)}><ChevronRight size={16} strokeWidth={1.75} /></button><b className="po-month">{cur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b>
        <div className="su-seg po-r" role="group" aria-label="Calendar view">{['Month', 'List'].map((k) => <button key={k} type="button" aria-pressed={mode === k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{k}</button>)}</div></div>
      {mode === 'Month' ? (
        <section className="po-cal"><div className="po-cal-h">{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => <span key={d}>{d}</span>)}</div>
          <div className="po-cal-g">{cells.map((d) => { const here = items.filter((x) => x.due === iso(d)); return (
            <div key={iso(d)} className={`po-cell${d.getMonth() !== cur.getMonth() ? ' out' : ''}${d.getDay() % 6 === 0 ? ' off' : ''}${iso(d) === todayIso ? ' today' : ''}`}><span>{iso(d) === todayIso ? <i>{d.getDate()}</i> : String(d.getDate()).padStart(2, '0')}</span>{here.slice(0, 3).map((x) => <button key={x.id} type="button" className={x.col === lastKey ? 'done' : ''} title={x.title}>{x.id} {x.title}</button>)}{here.length > 3 && <em>+{here.length - 3} more</em>}</div>) })}</div></section>
      ) : (
        <section className="wl"><ul className="po-lst">{inView.sort((a, b) => a.due.localeCompare(b.due)).map((x) => <li key={x.id}><time>{x.due}</time><code>{x.id}</code><b>{x.title}</b><Tag tone={x.col === lastKey ? 'ok' : 'warn'}>{x.col === lastKey ? 'Done' : 'Open'}</Tag></li>)}{inView.length === 0 && <li className="po-empty">No work items due this month.</li>}</ul></section>
      )}
    </div>
  )
}

// ---------- Credentials
const CTYPES = ['Database', 'Lucid Chart', 'Loom', 'GitHub', 'Custom']
export function Credentials() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [f, setF] = useState('All')
  const [form, setForm] = useState(null)
  const [show, setShow] = useState({})
  const rows = list.filter((c) => (f === 'All' || c.type === f) && (!q || c.name.toLowerCase().includes(q.toLowerCase())))
  const save = () => { if (!form.name.trim()) return; setList([...list, { ...form, id: Date.now() }]); setForm(null); toast({ title: 'Credential saved', text: form.name, duration: 1800 }) }
  return (
    <div className="po">
      <PageTop title="Project credentials" sub={`${list.length} credentials`}><button type="button" className="ci-btn" onClick={() => setForm({ name: '', type: 'Database', user: '', secret: '' })}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Add credential</button></PageTop>
      <div className="po-bar"><label className="mp-search po-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search credentials…" aria-label="Search credentials" /></label>
        <div className="su-seg" role="group" aria-label="Type">{['All', ...CTYPES].map((k) => <button key={k} type="button" aria-pressed={f === k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{k}</button>)}</div><span>{rows.length} entries</span></div>
      {form && (
        <section className="po-card po-form"><h3>New credential</h3>
          <label><span>Name</span><input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Production database" /></label>
          <label><span>Type</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{CTYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label><span>Username</span><input value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} /></label>
          <label><span>Secret</span><input type="password" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} /></label>
          <div><button type="button" className="ci-btn" disabled={!form.name.trim()} onClick={save}>Save</button><button type="button" className="ci-ghost" onClick={() => setForm(null)}>Cancel</button></div></section>
      )}
      <section className="wl">{rows.length === 0 ? <div className="po-empty big"><KeyRound size={24} strokeWidth={1.5} aria-hidden="true" /><span>No credentials yet.</span></div> : (
        <table className="wl-table"><thead><tr><th>Name</th><th>Type</th><th>Username</th><th>Secret</th><th /></tr></thead><tbody>{rows.map((c) => <tr key={c.id}><td><b>{c.name}</b></td><td><Tag>{c.type}</Tag></td><td>{c.user || '—'}</td><td><span className="po-sec">{show[c.id] ? c.secret || '—' : '••••••••'}</span><button type="button" className="po-ic" aria-label={show[c.id] ? 'Hide secret' : 'Show secret'} onClick={() => setShow({ ...show, [c.id]: !show[c.id] })}>{show[c.id] ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}</button></td><td><button type="button" className="po-ic" aria-label={`Delete ${c.name}`} onClick={() => { const at = list.findIndex((x) => x.id === c.id); setList(list.filter((x) => x.id !== c.id)); toast({ title: 'Credential deleted', text: `${c.name} was removed from this project.`, duration: 8000, action: { label: 'Undo', run: () => setList((l) => (l.some((x) => x.id === c.id) ? l : [...l.slice(0, at), c, ...l.slice(at)])) } }) }}><Trash2 size={16} strokeWidth={1.75} /></button></td></tr>)}</tbody></table>)}</section>
    </div>
  )
}

// ---------- Deployments
const ENVS = [['DEV', '1.1', 'Sep 21, 2026', 'blue'], ['QA', '1.1', 'Sep 21, 2026', 'amber'], ['STAGING', '', '', 'teal'], ['UAT', '1.1', 'Sep 21, 2026', 'violet'], ['PROD', '1.1', 'Sep 21, 2026', 'green']]
export function Deployments({ project }) {
  const [q, setQ] = useState('')
  const rels = [{ v: '1.1', date: 'Sep 14, 2026', type: 'Alpha', change: 'Implemented authentication and role-based access validation, API rate-limiting improvements, security fixes, and regression test updates.', tc: 85, env: 'Dev', status: 'Rolled Back', by: project.lead }]
  const rows = rels.filter((r) => !q || `${r.v} ${r.change}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="po">
      <PageTop title="Deployment & CI/CD" sub="Environments and releases" />
      <div className="po-envs">{ENVS.map(([n, v, d, c]) => <section key={n} className={`po-env ${c}`}><b><Rocket size={13} strokeWidth={1.75} aria-hidden="true" />{n}</b>{v ? <><strong>{v}</strong><small>Updated: {d}</small><small>by {project.lead}</small></> : <><strong>—</strong><small>Nothing deployed yet</small></>}</section>)}</div>
      <div className="po-bar"><label className="mp-search po-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search version or changes…" aria-label="Search releases" /></label><span>{rows.length} release</span></div>
      <Card title="Release history"><div className="wl-scroll"><table className="wl-table"><thead><tr><th>Version</th><th>Released</th><th>Type</th><th>Changes</th><th>Test cases</th><th>Environment</th><th>Ladder</th><th>Deployed by</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.v}><td className="po-id">{r.v}</td><td>{r.date}</td><td><span className="po-pill warn">{r.type}</span></td><td className="po-desc wide">{r.change}</td><td><span className="po-tc">{r.tc}%<i><b style={{ width: `${r.tc}%` }} /></i></span></td><td><span className="po-pill info">{r.env}</span></td><td><span className="po-pill ok">{r.status}</span></td><td><span className="wl-as"><Av name={r.by} size={24} />{r.by}</span></td></tr>)}</tbody></table></div></Card>
    </div>
  )
}

// ---------- Maintenance
export function Maintenance({ project }) {
  const [tix, setTix] = useState([])
  const [form, setForm] = useState(null)
  const [q, setQ] = useState('')
  const rows = tix.filter((t) => !q || t.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="po">
      <PageTop title="Maintenance" sub="Support tickets and system health"><button type="button" className="ci-btn" onClick={() => setForm({ title: '', prio: 'P2' })}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Log ticket</button></PageTop>
      <div className="sh-stats c4"><Stat label="P1 open" value={tix.filter((t) => t.prio === 'P1').length} icon={Flame} tone="red" /><Stat label="P2 open" value={tix.filter((t) => t.prio === 'P2').length} icon={AlertCircle} tone="amber" /><Stat label="Prod / month" value={0} icon={Rocket} tone="green" /><Stat label="Uptime (30d)" value="—" icon={Activity} tone="blue" /></div>
      {form && <section className="po-card po-form"><h3>Log ticket</h3><label><span>Title</span><input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What is wrong?" /></label><label><span>Priority</span><select value={form.prio} onChange={(e) => setForm({ ...form, prio: e.target.value })}>{['P1', 'P2', 'P3'].map((p) => <option key={p}>{p}</option>)}</select></label><div><button type="button" className="ci-btn" disabled={!form.title.trim()} onClick={() => { setTix([...tix, { ...form, id: tix.length + 1, by: project.lead }]); setForm(null); toast({ title: 'Ticket logged', duration: 1800 }) }}>Log ticket</button><button type="button" className="ci-ghost" onClick={() => setForm(null)}>Cancel</button></div></section>}
      <section className="wl"><div className="po-tsh"><b>Support tickets <em>{rows.length}</em></b><label className="mp-search po-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets…" aria-label="Search tickets" /></label></div>
        {rows.length === 0 ? <div className="po-empty">No support tickets on this project.</div> : <table className="wl-table"><thead><tr><th>ID</th><th>Title</th><th>Priority</th><th>Reported by</th></tr></thead><tbody>{rows.map((t) => <tr key={t.id}><td className="po-id">{project.key}-S{t.id}</td><td><b>{t.title}</b></td><td><Tag tone={t.prio === 'P1' ? 'err' : t.prio === 'P2' ? 'warn' : 'info'}>{t.prio}</Tag></td><td>{t.by}</td></tr>)}</tbody></table>}</section>
    </div>
  )
}

// ---------- Analytics & reports
export function Analytics({ issues, cols }) {
  const lastKey = cols[cols.length - 1][0]
  const total = issues.length
  const done = issues.filter((x) => x.col === lastKey).length
  const bugs = issues.filter((x) => x.type === 'bug' && x.col !== lastKey).length
  const T = [['epic', 'Epic'], ['feature', 'Feature'], ['story', 'Story'], ['task', 'Task'], ['bug', 'Bug'], ['subtask', 'Sub-task'], ['support', 'Support']]
  const avg = cols.map(([k, l]) => { const l2 = issues.filter((x) => x.col === k && x.logged); return [l, l2.length ? Math.round(l2.reduce((a, x) => a + x.logged, 0) / l2.length) : 0] })
  return (
    <div className="po">
      <PageTop title="Analytics & reports" sub="Distribution, throughput and cycle time" />
      <div className="sh-stats c4"><Stat label="Total work items" value={total} icon={ListChecks} tone="blue" /><Stat label="Completed" value={done} icon={CheckCircle2} tone="green" /><Stat label="Open" value={total - done} icon={Clock} tone="teal" /><Stat label="Open bugs" value={bugs} icon={Bug} tone="red" /></div>
      <div className="po-2">
        <Card title="Issue distribution"><p className="po-note">Every work item, by type — these add up to {total}</p>
          <ul className="sm-bars po-bars">{T.map(([k, l]) => { const n = issues.filter((x) => x.type === k).length; return <li key={k}><span>{l}</span><i><b className={k === 'bug' ? 'err' : 'info'} style={{ width: `${total ? (n / total) * 100 : 0}%` }} /></i><em>{n} · {total ? Math.round((n / total) * 100) : 0}%</em></li> })}</ul></Card>
        <Card title="Cycle time breakdown"><p className="po-note">Average time logged per delivery stage</p>
          <ul className="sm-bars po-bars">{avg.map(([l, m]) => <li key={l}><span>{l}</span><i><b className="info" style={{ width: `${Math.min(100, (m / 600) * 100)}%` }} /></i><em>{m ? fmtDur(m) : '—'}</em></li>)}</ul></Card>
      </div>
    </div>
  )
}

