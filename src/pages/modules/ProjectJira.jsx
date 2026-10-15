import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Package, Plus, Rocket, Zap } from 'lucide-react'
import { PageTop, Card } from './ProjectOps'
import { fmtDur } from './issueTime'
import { toast } from '@/components/toast'
import DonutBreakdown from '@/components/DonutBreakdown'
import DateField from '@/components/DateField'

const DAY = 864e5
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parse = (s) => new Date(`${s}T00:00:00`)
const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const SPRINT_DAYS = { 'Sprint 1': ['2026-10-06', '2026-10-20'], 'Sprint 2': ['2026-10-21', '2026-11-03'], 'Sprint 3': ['2026-11-04', '2026-11-17'] }

// ---------- Timeline: epics and work on a date axis (Jira roadmap)
export function Timeline({ issues, cols, onOpen }) {
  const lastKey = cols[cols.length - 1][0]
  const [zoom, setZoom] = useState(28) // days shown
  const [start, setStart] = useState(() => parse('2026-10-05'))
  const [open, setOpen] = useState({})
  const days = Array.from({ length: zoom }, (_, i) => new Date(start.getTime() + i * DAY))
  const today = iso(new Date())
  const epics = issues.filter((x) => x.type === 'epic')
  const rows = []
  ;[...epics, { id: '', title: 'Work without an epic', type: 'none' }].forEach((e) => {
    const kids = issues.filter((x) => x.type !== 'epic' && (e.id ? x.parent === e.id : !x.parent))
    if (e.id || kids.length) rows.push({ e, kids })
  })
  const bar = (x) => {
    const due = x.due ? parse(x.due) : null
    if (!due) return null
    const s = x.start ? parse(x.start) : new Date(due.getTime() - Math.max(1, x.pts) * DAY)
    const a = Math.max(0, Math.round((s - start) / DAY)); const b = Math.min(zoom, Math.round((due - start) / DAY) + 1)
    if (b <= 0 || a >= zoom) return null
    return { left: `${(a / zoom) * 100}%`, width: `${((b - a) / zoom) * 100}%` }
  }
  const shift = (n) => setStart((d) => new Date(d.getTime() + n * 7 * DAY))
  return (
    <div className="po">
      <PageTop title="Timeline" sub="Epics and the work inside them, laid out by date.">
        <div className="tl-tools">
          <div className="su-seg" role="group" aria-label="Zoom">{[[14, '2 weeks'], [28, '4 weeks'], [56, '8 weeks']].map(([n, l]) => <button key={n} type="button" aria-pressed={zoom === n} className={zoom === n ? 'on' : ''} onClick={() => setZoom(n)}>{l}</button>)}</div>
          <div className="tm-nav"><button type="button" aria-label="Earlier" onClick={() => shift(-1)}><ChevronLeft size={16} strokeWidth={1.75} /></button><b>{fmt(start)}</b><button type="button" aria-label="Later" onClick={() => shift(1)}><ChevronRight size={16} strokeWidth={1.75} /></button></div>
        </div>
      </PageTop>
      <section className="tl" aria-label="Timeline">
        <div className="tl-head"><span>Work</span><div className="tl-axis" style={{ gridTemplateColumns: `repeat(${zoom}, 1fr)` }}>{days.map((d) => <i key={iso(d)} className={`${[0, 6].includes(d.getDay()) ? 'we' : ''}${iso(d) === today ? ' now' : ''}`}>{zoom <= 28 || d.getDate() === 1 || d.getDay() === 1 ? <><small>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</small><b>{d.getDate()}</b></> : null}</i>)}</div></div>
        {rows.map(({ e, kids }) => {
          const done = kids.filter((k) => k.col === lastKey).length
          const isOpen = open[e.id || 'x'] !== false
          const dueKids = kids.filter((k) => k.due).map((k) => parse(k.due))
          const eb = e.id && dueKids.length ? (() => { const a = Math.max(0, Math.round((Math.min(...dueKids) - start) / DAY) - 3); const b = Math.min(zoom, Math.round((Math.max(...dueKids) - start) / DAY) + 1); return b > a ? { left: `${(a / zoom) * 100}%`, width: `${((b - a) / zoom) * 100}%` } : null })() : null
          return (
            <div key={e.id || 'none'} className="tl-grp">
              <div className="tl-row epic"><button type="button" className="tl-name" onClick={() => setOpen((o) => ({ ...o, [e.id || 'x']: !isOpen }))} aria-expanded={isOpen}><ChevronRight size={14} strokeWidth={2} className={isOpen ? 'o' : ''} aria-hidden="true" />{e.id && <Zap size={14} strokeWidth={1.75} className="ty-epic" aria-hidden="true" />}<b>{e.title}</b><em>{done}/{kids.length}</em></button>
                <div className="tl-lane">{eb && <span className="tl-bar epic" style={eb}><i style={{ width: `${kids.length ? (done / kids.length) * 100 : 0}%` }} />{e.id}</span>}</div></div>
              {isOpen && kids.map((x) => { const bb = bar(x); return (
                <div key={x.id} className="tl-row"><button type="button" className="tl-name sub" onClick={() => onOpen(x.id)}><code>{x.id}</code><span>{x.title}</span></button>
                  <div className="tl-lane">{bb ? <button type="button" className={`tl-bar ${x.col === lastKey ? 'done' : ''}`} style={bb} onClick={() => onOpen(x.id)} title={`${x.title} · due ${x.due}`}>{x.title}</button> : <small>No dates</small>}</div></div>
              ) })}
            </div>
          )
        })}
        <div className="tl-today" style={{ left: `calc(260px + (100% - 260px) * ${Math.max(0, Math.min(1, (parse(today) - start) / DAY / zoom))})` }} aria-hidden="true" />
      </section>
    </div>
  )
}

// ---------- Reports: burndown, velocity, cumulative flow, sprint report
export function Reports({ issues, cols }) {
  const lastKey = cols[cols.length - 1][0]
  const [sprint, setSprint] = useState('Sprint 1')
  const [a, b] = SPRINT_DAYS[sprint]
  const list = issues.filter((x) => x.sprint === sprint)
  const total = list.reduce((s, x) => s + x.pts, 0)
  const doneP = list.filter((x) => x.col === lastKey).reduce((s, x) => s + x.pts, 0)
  const n = Math.round((parse(b) - parse(a)) / DAY) + 1
  const todayIdx = Math.max(0, Math.min(n - 1, Math.round((new Date(2026, 9, 12) - parse(a)) / DAY)))
  const ideal = Array.from({ length: n }, (_, i) => total * (1 - i / (n - 1)))
  const actual = Array.from({ length: todayIdx + 1 }, (_, i) => (i === todayIdx ? total - doneP : total - doneP * (i / Math.max(1, todayIdx)) * 0.8))
  // drawn at the card's real pixel width so labels stay the same size on any screen
  const chartBox = useRef(null)
  const [W, setW] = useState(760)
  useEffect(() => {
    const el = chartBox.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setW(Math.max(320, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const H = 280, PL = 40, PR = 16, PT = 14, PB = 32, P = PL
  const x = (i) => PL + (i / (n - 1)) * (W - PL - PR)
  const y = (v) => H - PB - (total ? (v / total) * (H - PT - PB) : 0)
  const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const velo = [['Sprint 1', total, doneP], ['Sprint 2', issues.filter((i) => i.sprint === 'Sprint 2').reduce((s, i) => s + i.pts, 0), 0], ['Sprint 3', 0, 0]]
  const vmax = Math.max(1, ...velo.map((v) => v[1]))
  const cc = ['#9CA3AF', '#3B82F6', '#8B5CF6', '#16A34A', '#F59E0B', '#14B8A6']
  return (
    <div className="po">
      <PageTop title="Reports" sub="How the sprint is going and how the team delivers.">
        <label className="po-fil"><span>Sprint</span><select value={sprint} onChange={(e) => setSprint(e.target.value)} aria-label="Sprint">{Object.keys(SPRINT_DAYS).map((s) => <option key={s}>{s}</option>)}</select></label>
      </PageTop>
      <div className="po-2 rp-top">
        <Card title="Burndown chart" aside={`${total - doneP} of ${total} points left`}>
          <div ref={chartBox} className="rp-chartbox"><svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="rp-chart" role="img" aria-label="Burndown chart">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => <g key={t}><line x1={PL} x2={W - PR} y1={y(total * t)} y2={y(total * t)} className="grid" /><text x={P - 6} y={y(total * t) + 4} textAnchor="end">{Math.round(total * t)}</text></g>)}
            <path d={path(ideal)} className="ideal" /><path d={path(actual)} className="actual" />
            {actual.length > 0 && <circle cx={x(todayIdx)} cy={y(actual[todayIdx])} r="4" className="dot" />}
            <text x={PL} y={H - 8}>{fmt(parse(a))}</text><text x={W - PR} y={H - 8} textAnchor="end">{fmt(parse(b))}</text>
          </svg></div>
          <ul className="rp-leg"><li><i className="a" />Remaining work</li><li><i className="i" />Ideal burndown</li></ul>
        </Card>
        <Card title="Velocity chart" aside="Committed vs completed points">
          <div className="rp-bars">{velo.map(([n2, c, d]) => <div key={n2}><div className="rp-pair"><i className="c" style={{ height: `${(c / vmax) * 100}%` }} title={`Committed ${c}`} /><i className="d" style={{ height: `${(d / vmax) * 100}%` }} title={`Completed ${d}`} /></div><small>{n2}</small><em>{d}/{c}</em></div>)}</div>
          <ul className="rp-leg"><li><i className="c" />Committed</li><li><i className="d" />Completed</li></ul>
        </Card>
      </div>
      <div className="po-2 rp-bot">
        <DonutBreakdown title="Work by status" centerLabel="Work items" className="compact rp-donut" ranges={Object.keys(SPRINT_DAYS).map((sp) => ({
            key: sp, label: sp.replace('Sprint ', 'S'), subtitle: `${sp} · ${fmt(parse(SPRINT_DAYS[sp][0]))} – ${fmt(parse(SPRINT_DAYS[sp][1]))}`,
            items: cols.map(([k, l], i) => ({ label: l, value: issues.filter((x) => x.sprint === sp && x.col === k).length, color: cc[i % cc.length], note: i === cols.length - 1 ? 'Counts as done' : undefined })),
          }))} />
          <Card title="Sprint report" aside={sprint}>
          <ul className="rp-sum"><li><b>{list.filter((i) => i.col === lastKey).length}</b><span>Completed</span></li><li><b>{list.filter((i) => i.col !== lastKey).length}</b><span>Not completed</span></li><li><b>{total}</b><span>Committed points</span></li><li><b>{fmtDur(list.reduce((x, i) => x + (i.logged || 0), 0))}</b><span>Time logged</span></li></ul>
        </Card>
      </div>
    </div>
  )
}

// ---------- Releases (versions)
const REL0 = [['v1.0 Launch', '2026-10-30', 'Unreleased'], ['v0.9 Beta', '2026-09-14', 'Released'], ['v1.1 Payroll', '2026-12-05', 'Unreleased']]
export function Releases({ issues, cols, setIssues }) {
  const lastKey = cols[cols.length - 1][0]
  const [rels, setRels] = useState(REL0.map(([name, date, st]) => ({ name, date, st })))
  const [form, setForm] = useState(null)
  const lis = useMemo(() => Object.fromEntries(rels.map((r) => [r.name, issues.filter((x) => x.release === r.name)])), [rels, issues])
  const assign = (id, name) => setIssues((l) => l.map((x) => (x.id === id ? { ...x, release: name } : x)))
  const unassigned = issues.filter((x) => !x.release && x.type !== 'epic').slice(0, 6)
  const ship = (name) => { setRels((l) => l.map((r) => (r.name === name ? { ...r, st: 'Released' } : r))); toast({ title: 'Release shipped', text: name, duration: 2200 }) }
  return (
    <div className="po">
      <PageTop title="Releases" sub="Group work into versions and ship them."><button type="button" className="ci-btn" onClick={() => setForm({ name: '', date: '' })}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Create version</button></PageTop>
      {form && (
        <section className="po-card po-form"><h3>New version</h3>
          <label><span>Name</span><input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="v1.2 Reports" /></label>
          <label><span>Release date</span><DateField value={form.date} onChange={(v) => setForm({ ...form, date: v })} empty="Select release date" /></label>
          <div><button type="button" className="ci-btn" disabled={!form.name.trim()} onClick={() => { setRels((l) => [...l, { name: form.name.trim(), date: form.date || '2027-01-15', st: 'Unreleased' }]); setForm(null) }}>Create</button><button type="button" className="ci-ghost" onClick={() => setForm(null)}>Cancel</button></div></section>
      )}
      <div className="rl">
        {rels.map((r) => {
          const l = lis[r.name] || []; const d = l.filter((x) => x.col === lastKey).length
          return (
            <section key={r.name} className="rl-card">
              <header><span className="rl-ic"><Rocket size={18} strokeWidth={1.75} aria-hidden="true" /></span><div><h3>{r.name}</h3><small>Release date {fmt(parse(r.date))}</small></div><span className={`po-stag${r.st === 'Released' ? ' on' : ''}`}>{r.st}</span></header>
              <div className="iv-bar"><i style={{ width: `${l.length ? (d / l.length) * 100 : r.st === 'Released' ? 100 : 0}%` }} /></div>
              <small>{l.length ? `${d} of ${l.length} work items done` : r.st === 'Released' ? 'Shipped' : 'No work items yet'}</small>
              {r.st !== 'Released' && <button type="button" className="mp-btn" onClick={() => ship(r.name)}><Package size={16} strokeWidth={1.75} aria-hidden="true" />Release</button>}
            </section>
          )
        })}
      </div>
      <Card title="Add work to a version" aside="Pick a version for each item">
        <ul className="rl-list">{unassigned.map((x) => <li key={x.id}><code>{x.id}</code><b>{x.title}</b><select value="" aria-label={`Version for ${x.id}`} onChange={(e) => assign(x.id, e.target.value)}><option value="">Choose version</option>{rels.filter((r) => r.st !== 'Released').map((r) => <option key={r.name}>{r.name}</option>)}</select></li>)}{unassigned.length === 0 && <li className="po-empty">Every work item already has a version.</li>}</ul>
      </Card>
    </div>
  )
}
