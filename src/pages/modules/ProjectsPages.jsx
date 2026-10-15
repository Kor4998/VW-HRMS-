import { useMemo, useState } from 'react'
import { Columns3, ArrowDown, Download, ArrowUp, Bug, CircleAlert, CircleCheck, FolderKanban, LayoutGrid, List, ListChecks, Plus, Search, Star } from 'lucide-react'
import WorkBoard from './WorkBoard'
import ProjectBoardView from './ProjectBoard'
import { PageHead, Pager, TableCard, Tag } from './ModuleKit'
import { Stat } from './RequestsPanel'
import { SpaceGlyph } from '@/components/spaceIcons'
import Avatar, { AvatarGroup } from '@/components/Avatar'
import FilterMenu from '@/components/FilterMenu'
import { toast } from '@/components/toast'

const TONES = ['blue', 'amber', 'green', 'violet', 'pink', 'teal']
const SEED = [
  ['Accounting', 'ACC', 'AC', 'Accounting', 'Scrum', 0, 9, 0, 49, 'Bheemachandu Anagani', []],
  ['Amura AI Chat', 'AAC', 'AA', '', 'Scrum', 0, 3, 0, 7, 'Sasi Charlespaul', ['Development']],
  ['BlueLine', 'BLU', 'BL', 'BlueLine', 'Scrum', 0, 8, 0, 156, 'Diviti Tejesh', ['Development']],
  ['Engineering Process Improvement', 'EPI', 'EP', '', 'Scrum', 0, 2, 0, 23, 'Diviti Tejesh', ['BA']],
  ['Flamingo', 'FLM', 'FL', 'Voltuswave', 'Scrum', 0, 2, 0, 10, 'Diviti Tejesh', ['Development']],
  ['Harsha Engineers', 'HEN', 'HE', '', 'Scrum', 0, 6, 0, 39, 'Charla Venkatesh', ['BA']],
  ['HRMS', 'HRM', 'HR', '', 'Scrum', 12, 7, 0, 53, 'Venkatesh Korlapati', ['BA']],
  ['ICE GATE Integration', 'ICE', 'IG', '', 'Scrum', 0, 3, 0, 12, 'Diviti Tejesh', ['BA']],
  ['ITFS', 'ITF', 'IT', '', 'Scrum', 0, 1, 0, 0, 'Diviti Tejesh', ['BA']],
  ['Latent Accounts', 'LAT', 'LA', '', 'Scrum', 0, 1, 0, 1, 'Diviti Tejesh', ['BA']],
  ['MCP Servers and Voltus AI', 'MCP', 'MS', 'MCP Servers and Voltus AI', 'Scrum', 4, 2, 0, 22, 'Diviti Tejesh', ['Development']],
  ['Oasis Platform', 'OAS', 'OP', '', 'Scrum', 0, 8, 2, 33, 'Diviti Tejesh', ['BA']],
  ['Portfolio Intelligence', 'POR', 'PI', '', 'Scrum', 19, 5, 33, 42, 'Charla Venkatesh', ['BA']],
  ['Road Fleet Management', 'RFM', 'RF', '', 'Scrum', 0, 1, 0, 0, 'Sasi Charlespaul', ['BA']],
  ['Sales and marketing - voltusfreight', 'SAM', 'SA', '', 'Kanban', 0, 2, 0, 2, 'Gaurav Bhadani', ['BA']],
  ['SAP Test Assurance', 'SAP', 'ST', '', 'Scrum', 5, 8, 19, 39, 'Diviti Tejesh', ['BA']],
  ['UI/UX', 'UIX', 'UI', 'UI/UX - Internal', 'Scrum', 0, 3, 0, 0, 'Diviti Tejesh', ['Mock']],
  ['VoltusFreight', 'VFR', 'VO', '', 'Scrum', 3, 24, 5, 226, 'Charla Venkatesh', ['BA']],
  ['Warehouse Management System', 'WMS', 'WM', '', 'Scrum', 0, 10, 0, 3, 'Diviti Tejesh', ['Development']],
  ['Wehouse', 'WEH', 'WE', 'Wehouse', 'Scrum', 10, 10, 9, 142, 'Saisaankhya Katari', ['Development']],
].map(([name, key, ini, sub, type, pct, members, bugs, open, lead, tags], i) => ({ id: key, name, key, ini, sub, type, pct, members, bugs, open, lead, tags, tone: TONES[i % TONES.length], star: ['HRM', 'VFR'].includes(key), status: 'On track' }))

const STATUS_OF = { POR: 'At risk', SAP: 'At risk', WEH: 'In review', VFR: 'In review', ITF: 'Shipped', LAT: 'Shipped', RFM: 'Shipped' }
const DUE = ['Oct 30', 'Nov 14', 'Oct 21', 'Dec 05', 'Nov 28', 'Oct 18', 'Jan 12', 'Nov 07', 'Dec 19', 'Oct 27']
SEED.forEach((p, i) => { p.status = STATUS_OF[p.key] || 'On track'; if (p.status === 'Shipped') p.pct = 100; p.due = DUE[i % DUE.length] })
const STATUS_TONE = { 'At risk': 'warn', 'In review': 'info', 'On track': 'ok', Shipped: 'ok' }
const STATUSES = ['At risk', 'In review', 'On track', 'Shipped']
const TEAM_POOL = ['Anita Rao', 'Mohan Pillai', 'Vinod Pasupuleti', 'Kalyani Devarapalli', 'Aasritha Samudrala', 'Gaurav Bhadani']
try { JSON.parse(localStorage.getItem('prj-custom') || '[]').forEach((c) => { if (!SEED.some((x) => x.id === c.id)) SEED.push(c) }) } catch { /* storage unavailable */ }
export function addProject(p) {
  SEED.push(p)
  try { const c = JSON.parse(localStorage.getItem('prj-custom') || '[]'); c.push(p); localStorage.setItem('prj-custom', JSON.stringify(c)) } catch { /* storage unavailable */ }
}
export const PROJECT_LIST = SEED
const PIN = 'prj-star'
const csv = (rows) => { const t = ['Name,Key,Type,Lead,Status,Progress,Due,Open issues,Bugs', ...rows.map((p) => [p.name, p.key, p.type, p.lead, p.status, `${p.pct}%`, p.due, p.open, p.bugs].map((v) => `"${v}"`).join(','))].join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv' })); a.download = 'projects.csv'; a.click(); URL.revokeObjectURL(a.href) }

function ProjIcon({ p, size = 40 }) {
  return <span className={`pj-ic ${p.tone}`} style={{ width: size, height: size }}><SpaceGlyph p={p} size={Math.round(size * 0.5)} /></span>
}
function Stack({ p }) {
  const names = [p.lead, ...TEAM_POOL].slice(0, Math.min(4, p.members))
  return <AvatarGroup names={names} max={3} size={28} total={p.members} />
}
function Lead({ name }) { return <span className="pj-lead"><Avatar name={name} size={24} />{name}</span> }

function Meter({ pct }) { return <div className="pj-meter" role="img" aria-label={`${pct}% complete`}><i style={{ width: `${pct}%` }} /></div> }

// Jira-style "Projects" page: table list (star, name, key, type, lead, progress, issues) with a cards view and a New project panel.
export function AllProjects({ onOpen }) {
  const [list, setList] = useState(SEED.map((p) => ({ ...p, star: (() => { try { const s = JSON.parse(localStorage.getItem(PIN)); return s ? s.includes(p.id) : p.star } catch { return p.star } })() })))
  const [view, setView] = useState('list')
  const [mode, setMode] = useState('list')
  const [q, setQ] = useState('')
  const [scope, setScope] = useState('all')
  const [sort, setSort] = useState({ k: 'name', dir: 1 })
  const [pg, setPg] = useState(0)
  const [per, setPer] = useState(10)
  const [leads, setLeads] = useState([])
  const [sts, setSts] = useState([])

  const toggleStar = (id) => setList((l) => {
    const n = l.map((p) => (p.id === id ? { ...p, star: !p.star } : p))
    try { localStorage.setItem(PIN, JSON.stringify(n.filter((p) => p.star).map((p) => p.id))) } catch { /* storage unavailable */ }
    setTimeout(() => window.dispatchEvent(new Event('prj-star-change')), 0)
    return n
  })
  const rows = useMemo(() => {
    const r = list.filter((p) => (scope === 'all' || p.star) && (!leads.length || leads.includes(p.lead)) && (!sts.length || sts.includes(p.status)) && (!q || `${p.name} ${p.key} ${p.lead}`.toLowerCase().includes(q.toLowerCase())))
    return [...r].sort((a, b) => {
      const x = a[sort.k], y = b[sort.k]
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir
    })
  }, [list, q, scope, sort, leads, sts])
  const view_ = rows.slice(pg * per, pg * per + per)
  const th = (k, label) => (
    <th aria-sort={sort.k === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="pj-th" onClick={() => setSort((s) => ({ k, dir: s.k === k ? -s.dir : 1 }))}>{label}{sort.k === k && (sort.dir === 1 ? <ArrowUp size={12} strokeWidth={2} /> : <ArrowDown size={12} strokeWidth={2} />)}</button>
    </th>
  )
  const total = list.reduce((a, p) => a + p.open, 0)
  const top = [...list].sort((a, b) => b.open - a.open).slice(0, 6)
  const byLead = Object.entries(list.reduce((m, p) => ({ ...m, [p.lead]: (m[p.lead] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])
  const leadOpts = byLead.map(([v, n]) => ({ value: v, label: v, count: n }))
  const busiest = top[0]

  return (
    <div className="mp">
      <div className="su-seg pj-mode" role="group" aria-label="Projects view">
        {[['list', 'List', List], ['board', 'Board', Columns3]].map(([k, l, I]) => <button key={k} type="button" aria-pressed={mode === k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}><I size={16} strokeWidth={1.75} aria-hidden="true" />{l}</button>)}
      </div>
      {mode === 'board' ? <WorkBoard /> : (<>
      <PageHead title="Projects" desc={`${list.filter((p) => p.status !== 'Shipped').length} in progress, ${list.filter((p) => p.status === 'At risk').length} at risk`}>
        <button type="button" className="mp-btn" onClick={() => { csv(rows); toast({ title: 'Export ready', text: `${rows.length} projects saved to projects.csv.` }) }}><Download size={16} strokeWidth={1.75} aria-hidden="true" />Export</button>
        <button type="button" className="mp-btn primary" onClick={() => window.dispatchEvent(new Event('prj-create'))}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Create project</button>
      </PageHead>

      <div className="sh-stats c4">
        <Stat label="Total projects" value={list.length} icon={FolderKanban} tone="blue" />
        <Stat label="On track" value={list.filter((p) => p.status === 'On track' || p.status === 'Shipped').length} icon={CircleCheck} tone="green" trend={{ v: `${Math.round(list.filter((p) => p.status === 'On track' || p.status === 'Shipped').length / list.length * 100)}%`, dir: 'up', title: 'of projects' }} />
        <Stat label="At risk" value={list.filter((p) => p.status === 'At risk').length} icon={CircleAlert} tone="red" />
        <Stat label="Open issues" value={total} icon={ListChecks} tone="violet" />
      </div>

      <div className="pj-ins">
        <section className="pj-panel">
          <h3>Open issues by project<small>Top 6 of {list.length}</small></h3>
          <ul className="pj-hbars">
            {top.map((p) => (
              <li key={p.id}><button type="button" onClick={() => onOpen(p)}><span>{p.name}</span><i><b className={p.tone} style={{ width: `${(p.open / busiest.open) * 100}%` }} /></i><em>{p.open}</em></button></li>
            ))}
          </ul>
        </section>
        <section className="pj-panel">
          <h3>Projects by lead<small>{byLead.length} leads</small></h3>
          <ul className="pj-hbars">
            {byLead.slice(0, 6).map(([n, c]) => (
              <li key={n}><button type="button" onClick={() => { setLeads([n]); setScope('all'); setPg(0) }}><span>{n}</span><i><b className="violet" style={{ width: `${(c / byLead[0][1]) * 100}%` }} /></i><em>{c}</em></button></li>
            ))}
          </ul>
        </section>
        <section className="pj-panel">
          <h3>Needs attention<small>Bugs open</small></h3>
          <ul className="pj-attn">
            {[...list].filter((p) => p.bugs > 0).sort((a, b) => b.bugs - a.bugs).slice(0, 4).map((p) => (
              <li key={p.id}><button type="button" onClick={() => onOpen(p)}><ProjIcon p={p} size={32} /><span><b>{p.name}</b><small>{p.bugs} bugs · {p.open} open</small></span><Bug size={16} strokeWidth={1.75} aria-hidden="true" /></button></li>
            ))}
          </ul>
        </section>
      </div>

      <div className="pj-chips" role="group" aria-label="Filter by status">
        {STATUSES.map((st) => {
          const n = list.filter((p) => p.status === st).length
          const on = sts.includes(st)
          return <button key={st} type="button" aria-pressed={on} className={on ? 'on' : ''} onClick={() => { setSts((l) => (l.includes(st) ? l.filter((x) => x !== st) : [...l, st])); setPg(0) }}><i className={`d-${STATUS_TONE[st]}`} />{st}<em>{n}</em></button>
        })}
        {(sts.length > 0 || leads.length > 0) && <button type="button" className="clear" onClick={() => { setSts([]); setLeads([]); setPg(0) }}>Clear filters</button>}
      </div>

      <TableCard
        title={view === 'list' ? 'All projects' : 'Project cards'} count={rows.length} unit="projects" desc="Star the ones you work in most so they stay at the top of your list."
        toolbar={(
          <>
            <label className="mp-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => { setQ(e.target.value); setPg(0) }} placeholder="Search projects" aria-label="Search projects" /></label>
            <FilterMenu label="Lead" options={leadOpts} value={leads} onChange={(v) => { setLeads(v); setPg(0) }} />
            <div className="su-seg" role="group" aria-label="Scope">{[['all', 'All'], ['star', 'Starred']].map(([k, l]) => <button key={k} type="button" aria-pressed={scope === k} className={scope === k ? 'on' : ''} onClick={() => { setScope(k); setPg(0) }}>{l}</button>)}</div>
            <div className="grow"><div className="su-seg" role="group" aria-label="View">
              <button type="button" aria-label="List view" aria-pressed={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><List size={16} strokeWidth={1.75} /></button>
              <button type="button" aria-label="Card view" aria-pressed={view === 'cards'} className={view === 'cards' ? 'on' : ''} onClick={() => setView('cards')}><LayoutGrid size={16} strokeWidth={1.75} /></button>
            </div></div>
          </>
        )}
        footer={view === 'list' && rows.length > per ? <Pager total={rows.length} page={pg} setPage={setPg} perPage={per} setPerPage={setPer} options={[10, 20, 50]} /> : null}
      >
        {rows.length === 0 ? (
          <div className="mp-empty" style={{ padding: 32 }}><span className="mp-empty-ic"><Search size={22} strokeWidth={1.5} /></span><b>No projects found</b><p>{scope === 'star' ? 'Star a project to see it here.' : 'Try a different search.'}</p></div>
        ) : view === 'list' ? (
          <div className="ex-table-wrap">
            <table className="ex-table pj-table">
              <colgroup><col style={{ width: 52 }} /><col /><col style={{ width: 220 }} /><col style={{ width: 120 }} /><col style={{ width: 110 }} /><col style={{ width: 150 }} /><col style={{ width: 90 }} /><col style={{ width: 100 }} /></colgroup>
              <thead><tr><th aria-label="Starred" />{th('name', 'Project')}{th('lead', 'Lead')}<th>Team</th>{th('status', 'Status')}{th('pct', 'Progress')}{th('due', 'Due')}{th('open', 'Open')}</tr></thead>
              <tbody>
                {view_.map((p) => (
                  <tr key={p.id} className="clk" tabIndex={0} onClick={() => onOpen(p)} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(p) }}>
                    <td><button type="button" className={p.star ? 'pj-star on' : 'pj-star'} aria-label={p.star ? `Unstar ${p.name}` : `Star ${p.name}`} aria-pressed={p.star} onClick={(e) => { e.stopPropagation(); toggleStar(p.id) }}><Star size={16} strokeWidth={1.75} fill={p.star ? 'currentColor' : 'none'} /></button></td>
                    <td><span className="pj-name"><ProjIcon p={p} size={32} /><span><b>{p.name}</b><small>{p.key} · {p.type}{p.sub ? ` · ${p.sub}` : ''}</small></span></span></td>
                    <td><Lead name={p.lead} /></td>
                    <td><Stack p={p} /></td>
                    <td><Tag tone={STATUS_TONE[p.status]}>{p.status}</Tag></td>
                    <td><span className="pj-prog"><Meter pct={p.pct} /><em>{p.pct}%</em></span></td>
                    <td>{p.due}</td>
                    <td><b>{p.open}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pj-cards">
            {rows.map((p) => (
              <button key={p.id} type="button" className="pj-card" onClick={() => onOpen(p)}>
                <span className="pj-card-h"><ProjIcon p={p} /><span><b>{p.name}</b><small>{p.key}{p.sub ? ` · ${p.sub}` : ''}</small></span>
                  <span className={p.star ? 'pj-star on' : 'pj-star'} role="button" tabIndex={0} aria-label={`${p.star ? 'Unstar' : 'Star'} ${p.name}`} onClick={(e) => { e.stopPropagation(); toggleStar(p.id) }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleStar(p.id) } }}><Star size={16} strokeWidth={1.75} fill={p.star ? 'currentColor' : 'none'} /></span>
                </span>
                <span className="pj-tags"><Tag tone={STATUS_TONE[p.status]}>{p.status}</Tag>{p.tags.map((t) => <Tag key={t}>{t}</Tag>)}<Tag>{p.type}</Tag></span>
                <span className="pj-prog"><Meter pct={p.pct} /><em>{p.pct}%</em></span>
                <span className="pj-foot"><span><b>{p.members}</b> {p.members === 1 ? 'member' : 'members'}</span><span className={p.bugs ? 'pj-bad' : ''}><b>{p.bugs}</b> bugs</span><span><b>{p.open}</b> open</span></span>
                <Lead name={p.lead} />
              </button>
            ))}
          </div>
        )}
      </TableCard>

      </>)}
    </div>
  )
}

export function ProjectBoard(props) { return <ProjectBoardView {...props} ProjIcon={ProjIcon} /> }
