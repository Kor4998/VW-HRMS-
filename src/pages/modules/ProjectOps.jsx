import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, Bug, CalendarDays, CheckCircle2, Clock, Code2, Download, FileText, FlaskConical, Layers, ListChecks, Search, Timer, Users } from 'lucide-react'
import { Donut, Tag } from './ModuleKit'
import { Stat } from './RequestsPanel'
import ProjectMembers from './ProjectMembers'
import ProjectRoles from './ProjectRoles'
import { fmtDur } from './issueTime'
import { toast } from '@/components/toast'
import Avatar from '@/components/Avatar'

function Av({ name, size = 28 }) { return <Avatar name={name} size={size} /> }
export function PageTop({ title, sub, children }) { return <header className="po-top"><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>{children}</header> }
export function Card({ title, aside, children, className = '' }) { return <section className={`po-card ${className}`}>{title && <h3>{title}{aside && <em>{aside}</em>}</h3>}{children}</section> }

const ROLE = ['Project Manager', 'Developer', 'Developer', 'Tester', 'Developer', 'Tester', 'Developer', 'Developer']
export const teamOf = (project) => {
  const base = [project.lead, 'Anita Rao', 'Mohan Pillai', 'Vinod Pasupuleti', 'Kalyani Devarapalli', 'Aasritha Samudrala', 'Gaurav Bhadani', 'Diviti Tejesh']
  return base.slice(0, Math.max(3, Math.min(8, project.members || 4))).map((name, i) => ({ name, role: ROLE[i], boss: i === 0 ? 'Diviti Tejesh' : project.lead }))
}

// ---------- Overview (dashboard)
export function ProjectOverview({ project, issues, cols }) {
  const lastKey = cols[cols.length - 1][0]
  const total = issues.length
  const done = issues.filter((x) => x.col === lastKey).length
  const sprint = issues.filter((x) => x.sprint === 'Sprint 1')
  const sprintDone = sprint.filter((x) => x.col === lastKey).length
  const bugs = issues.filter((x) => x.type === 'bug' && x.col !== lastKey).length
  const inProg = issues.filter((x) => x.col !== lastKey && x.col !== cols[0][0]).length
  const scope = total ? Math.round((done / total) * 100) : 0
  const quality = total ? Math.max(0, 100 - Math.round((bugs / total) * 100)) : 100
  const health = Math.round((scope + quality + 40) / 3)
  const team = teamOf(project)
  const logAll = issues.reduce((x, y) => x + (y.logged || 0), 0)
  const estAll = issues.reduce((x, y) => x + (y.est || 0), 0)
  const phases = [['Planning', 'Set by hand · set by the project manager', 'Active'], ['Design', `${Math.max(1, project.members)} documents attached`, 'Active'], ['Development', `${done} of ${total} work items done`, 'Active'], ['Testing', 'no test cases yet', 'Pending'], ['Deployment', '1 release planned', 'Active'], ['Maintenance', 'no support items yet', 'Pending']]
  return (
    <div className="po">
      <PageTop title={`${project.name} — Dashboard`} sub={`Sprint 1 · ${project.type} · 2 weeks`}><span className="po-ok"><i />On Track</span></PageTop>
      <div className="sh-stats c4">
        <Stat label="Total issues" value={total} icon={ListChecks} tone="blue" />
        <Stat label="Completed" value={done} icon={CheckCircle2} tone="green" />
        <Stat label="Sprint progress" value={`${sprintDone}/${sprint.length}`} icon={Timer} tone="violet" />
        <Stat label="Open bugs" value={bugs} icon={Bug} tone="red" />
      </div>
      <div className="po-grid3">
        <div className="po-col">
          <Card title="Project health index" aside={<span className="po-chip err">{health}/100</span>}>
            <div className="po-health">
              <Donut value={health} total={100} color={health < 40 ? '#EF4444' : health < 70 ? '#F59E0B' : '#16A34A'} size={110} stroke={10}><b className="po-big">{health}</b><small>/100</small></Donut>
              <ul>
                {[['Scope', scope, `${done} of ${total} work items done`, '#3B82F6'], ['Schedule', Math.min(100, scope), `${scope}% done, 33% of the plan elapsed`, '#16A34A'], ['Quality', quality, `${bugs} open bugs across ${total} work items`, '#F59E0B'], ['Morale', 0, 'not set — survey measure', '#98A2B3']].map(([l, v, n, c]) => (
                  <li key={l}><span>{l}</span><i><b style={{ width: `${v}%`, background: c }} /></i><em>{l === 'Morale' ? '—' : `${v}%`}</em><small>{n}</small></li>
                ))}
              </ul>
            </div>
          </Card>
          <Card title="Sprint history">
            <ul className="po-hist">{[['S1', 'Sprint 1', '2026-10-06 – 2026-10-20', `${sprintDone}/${sprint.length} done`, 'Active'], ['S2', 'Sprint 2', '2026-10-21 – 2026-11-03', '0/3 done', 'Planned'], ['S3', 'Sprint 3', '2026-11-04 – 2026-11-17', '0/0 done', 'Planned']].map(([k, n, d, p, st], i) => <li key={k} className={i === 0 ? 'on' : ''}><i>{k}</i><span><b>{n}</b><small>{d}</small></span><em>{p}</em><span className={`po-stag ${st === 'Active' ? 'on' : ''}`}>{st}</span></li>)}</ul>
          </Card>
          <Card title="Priority breakdown" aside="All work items">
            <ul className="sm-bars po-bars">{['Highest', 'High', 'Medium', 'Low'].map((pr) => { const n = issues.filter((x) => x.prio === pr).length; return <li key={pr}><span>{pr}</span><i><b className={pr === 'Medium' ? 'warn' : pr === 'Low' ? 'info' : 'err'} style={{ width: `${total ? (n / total) * 100 : 0}%` }} /></i><em>{n}</em></li> })}</ul>
          </Card>
        </div>
        <div className="po-col">
          <Card title="Sprint 1 status">
            <p className="po-goal">Complete the authentication module testing and resolve critical API defects.</p>
            <div className="po-comp"><div><span>Completion</span><b>{sprint.length ? Math.round((sprintDone / sprint.length) * 100) : 0}%</b></div><div className="iv-bar"><i style={{ width: `${sprint.length ? (sprintDone / sprint.length) * 100 : 0}%` }} /></div>
              <ul><li><b>{sprintDone}</b><span>Completed</span></li><li><b>{sprint.length - sprintDone}</b><span>Remaining</span></li><li><b>{sprint.length}</b><span>Committed</span></li></ul></div>
          <ul className="po-kv"><li><span>Dates</span><b>Oct 6 – Oct 20</b></li><li><span>Days left</span><b>7</b></li><li><span>Story points</span><b>{sprint.reduce((x, y) => x + y.pts, 0)}</b></li></ul>
          </Card>
          <Card title="SDLC phase status" aside={`${phases.filter((p) => p[2] === 'Active').length} of 6 active`}>
            <ol className="po-sdlc">{phases.map(([n, d, st], i) => <li key={n}><i className={st === 'Pending' ? 'off' : ''}>{i + 1}</i><span><b>{n}</b><small>{d}</small></span><em className={st === 'Pending' ? 'off' : ''}>{st}</em></li>)}</ol>
          </Card>
          <Card title="Types of work" aside={`${total} work items`}>
            <ul className="sm-bars po-bars">{[['epic', 'Epic'], ['story', 'Story'], ['task', 'Task'], ['bug', 'Bug']].map(([k, l]) => { const n = issues.filter((x) => x.type === k).length; return <li key={k}><span>{l}</span><i><b className={k === 'bug' ? 'err' : 'info'} style={{ width: `${total ? (n / total) * 100 : 0}%` }} /></i><em>{n}</em></li> })}</ul>
          </Card>
        </div>
        <div className="po-col">
          <Card title={`Team · ${team.length}`}>
            <ul className="po-team">{team.slice(0, 4).map((m) => { const mine = issues.filter((x) => x.who === m.name); const open = mine.filter((x) => x.col !== lastKey).length; return <li key={m.name}><Av name={m.name} /><span><b>{m.name}</b><small>{m.role}</small></span><div><em>{mine.length} TASKS</em><i><b style={{ width: `${mine.length ? ((mine.length - open) / mine.length) * 100 : 0}%` }} /></i><small>{open} open</small></div></li> })}</ul>{team.length > 4 && <p className="po-more">+{team.length - 4} more members</p>}
          </Card>
          <Card title="Recent activity">
            <ul className="po-act">{issues.filter((x) => x.worklog?.length).slice(0, 4).map((x) => <li key={x.id}><Av name={x.worklog[0].who} /><span><b>{x.worklog[0].who}</b> created time log<small>{x.worklog[0].date}</small></span></li>)}</ul>
          </Card>
          <Card title="Time tracking" aside="Logged against the estimate">
            <div className="iv-tt" role="img" aria-label="Time logged"><i style={{ width: `${estAll ? Math.min(100, (logAll / estAll) * 100) : 0}%` }} /></div>
            <ul className="rp-sum"><li><b>{fmtDur(logAll)}</b><span>Logged</span></li><li><b>{fmtDur(estAll)}</b><span>Estimated</span></li><li><b>{fmtDur(Math.max(0, estAll - logAll))}</b><span>Remaining</span></li><li><b>{issues.filter((x) => x.type === 'epic').length}</b><span>Epics</span></li></ul>
          </Card>
      
        </div>
      </div>
      <p className="po-fine">{inProg} items in progress · {fmtDur(issues.reduce((a, x) => a + (x.logged || 0), 0))} logged this sprint</p>
    </div>
  )
}

// ---------- Project Team
export function ProjectTeam({ project, issues, cols }) {
  const [view, setView] = useState('team')
  const [q, setQ] = useState('')
  const lastKey = cols[cols.length - 1][0]
  const rows = teamOf(project).filter((m) => !q || `${m.name} ${m.role}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="po">
      <PageTop title="Project team" sub={`${teamOf(project).length} members`}>
        <div className="su-seg" role="group" aria-label="Team view">{[['team', 'Team'], ['invites', 'Invites'], ['roles', 'Roles']].map(([k, l]) => <button key={k} type="button" aria-pressed={view === k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>)}</div>
      </PageTop>
      {view === 'invites' && <ProjectMembers project={project} />}
      {view === 'roles' && <ProjectRoles project={project} />}
      {view === 'team' && (
        <>
          <label className="mp-search po-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or role…" aria-label="Search team" /></label>
          <section className="wl"><div className="wl-scroll"><table className="wl-table">
            <thead><tr><th>Member</th><th>Role</th><th>Reports to</th><th className="num">Assigned</th><th className="num">Bugs</th><th className="num">On time</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{rows.map((m) => { const mine = issues.filter((x) => x.who === m.name); const bugs = mine.filter((x) => x.type === 'bug' && x.col !== lastKey).length; return (
              <tr key={m.name}><td><span className="wl-as"><Av name={m.name} />{m.name}</span></td><td><span className={`po-role ${m.role === 'Tester' ? 'amber' : m.role === 'Project Manager' ? 'violet' : 'blue'}`}>{m.role}</span></td><td><span className="wl-as"><Av name={m.boss} size={24} />{m.boss}</span></td><td className="num">{mine.length}</td><td className={`num${bugs ? ' bad' : ''}`}>{bugs}</td><td className="num good">100%</td><td><span className="po-on"><i />Active</span></td><td><button type="button" className="po-mini" onClick={() => toast({ title: 'Lifecycle', text: `${m.name} is active on ${project.name}.`, duration: 2000 })}>Lifecycle</button></td></tr>
            ) })}</tbody></table></div><div className="wl-foot"><span>Showing 1–{rows.length} of {rows.length}</span></div></section>
        </>
      )}
    </div>
  )
}

// ---------- Scope & Requirements
const DOCS = [['Developer Tasks list', 'Sep 15, 2026'], ['Devloper Tasks List', 'Sep 15, 2026'], ['Developer tasks List', 'Sep 15, 2026']]
export function ScopeRequirements({ project }) {
  const [q, setQ] = useState('')
  const docs = DOCS.filter(([n]) => n.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="po">
      <PageTop title="Scope & requirements" sub="Client requirements, developer feature list, testers scope & custom document sections" />
      <div className="sh-stats c4">
        <Stat label="Client requirements" value={0} icon={Users} tone="blue" /><Stat label="Developer features" value={3} icon={Code2} tone="violet" /><Stat label="Testers scope" value={0} icon={FlaskConical} tone="amber" /><Stat label="Custom sections" value={0} icon={Layers} tone="green" />
      </div>
      <Card title="Scope documents list" aside={`${docs.length} documents`} className="po-narrow">
        <p className="po-note">Documents related to the project scope, including functional requirements, technical specifications, feature details, development plans, and related implementation documentation.</p>
        <small className="po-by">Created by {project.lead}</small>
        <label className="mp-search po-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents by title…" aria-label="Search documents" /></label>
        <ul className="po-docs">{docs.map(([n, d]) => <li key={n}><FileText size={18} strokeWidth={1.75} aria-hidden="true" /><span><b>{n}</b><small>{d} · Added by {project.lead}</small></span><button type="button" aria-label={`Download ${n}`} onClick={() => toast({ title: 'Download started', text: n, duration: 1800 })}><Download size={16} strokeWidth={1.75} /></button></li>)}{docs.length === 0 && <li className="po-empty">No documents match.</li>}</ul>
      </Card>
    </div>
  )
}

// ---------- Scrum & Ceremonies
export function ScrumBoard({ project, issues, cols }) {
  const [notes, setNotes] = useState({ y: [], t: [], b: [] })
  const [retro, setRetro] = useState({ well: [], improve: [], action: [] })
  const [draft, setDraft] = useState({})
  const add = (grp, key, set) => { const v = (draft[`${grp}${key}`] || '').trim(); if (!v) return; set((s) => ({ ...s, [key]: [...s[key], v] })); setDraft((d) => ({ ...d, [`${grp}${key}`]: '' })) }
  const lastKey = cols[cols.length - 1][0]
  const sprint = issues.filter((x) => x.sprint === 'Sprint 1')
  const done = sprint.filter((x) => x.col === lastKey).length
  const box = (grp, key, label, Icon, cls, store, set) => (
    <div className={`po-sb ${cls}`}><span><Icon size={14} strokeWidth={1.75} aria-hidden="true" />{label}</span>
      {store[key].length ? <ul>{store[key].map((n, i) => <li key={i}>{n}</li>)}</ul> : <p>Nothing noted.</p>}
      <input value={draft[`${grp}${key}`] || ''} onChange={(e) => setDraft((d) => ({ ...d, [`${grp}${key}`]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') add(grp, key, set) }} placeholder="Add a note" aria-label={`${label} note`} /></div>
  )
  return (
    <div className="po">
      <PageTop title="Scrum & ceremonies" sub="Sprint 1"><label className="po-date"><CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" /><input type="date" defaultValue={new Date().toLocaleDateString('en-CA')} aria-label="Showing date" /></label></PageTop>
      <Card className="po-narrow"><h3 className="po-h po-hi"><Clock size={20} strokeWidth={1.5} aria-hidden="true" />Daily standup</h3><p className="po-note">Daily team sync to discuss progress and blockers</p><small className="po-by">Daily · Sep 15 – Sep 29 · 9:45 AM · 15 min</small></Card>
      <div className="po-2">
        <Card title="Today's standup" aside={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}>
          <div className="po-3b">{box('s', 'y', 'Yesterday', CheckCircle2, 'ok', notes, setNotes)}{box('s', 't', 'Today', ArrowRight, 'info', notes, setNotes)}{box('s', 'b', 'Blockers', AlertTriangle, 'err', notes, setNotes)}</div>
        </Card>
        <Card title="Sprint goal"><p className="po-goal">“Complete the authentication module testing and resolve critical API defects.”</p><div className="po-gl"><b>{done}</b><span>/ {sprint.length} issues</span><div className="iv-bar"><i style={{ width: `${sprint.length ? (done / sprint.length) * 100 : 0}%` }} /></div><em>{sprint.length ? Math.round((done / sprint.length) * 100) : 0}% complete</em></div></Card>
      </div>
      <Card title="Last sprint retrospective">
        {[['well', 'Went well', 'ok'], ['improve', 'To improve', 'warn'], ['action', 'Action item', 'info']].map(([k, l, c]) => (
          <div key={k} className={`po-retro ${c}`}><b>{l}</b>{retro[k].length > 0 && <ul>{retro[k].map((n, i) => <li key={i}>{n}</li>)}</ul>}
            <input value={draft[`r${k}`] || ''} onChange={(e) => setDraft((d) => ({ ...d, [`r${k}`]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') add('r', k, setRetro) }} placeholder={`Add to “${l}”`} aria-label={l} /></div>
        ))}
      </Card>
      <p className="po-fine">{project.name}</p>
    </div>
  )
}

// ---------- Sprint Board (sprint cards) + dedicated per-sprint board
const SPRINT_INFO = [['Sprint 1', 'Active', 'Oct 6, 2026 – Oct 20, 2026', '10 working days', 'Complete the authentication module testing and resolve critical API defects.', '2026-10-20'], ['Sprint 2', 'Planned', 'Oct 21, 2026 – Nov 3, 2026', '10 working days', 'Sprint 2', '2026-11-03'], ['Sprint 3', 'Planned', 'Nov 4, 2026 – Nov 17, 2026', '10 working days', 'Sprint 3', '2026-11-17']]
const COL_COLOR = ['#8B5CF6', '#16A34A', '#F59E0B', '#7C3AED', '#14B8A6', '#3B82F6']
const TYPE_LABEL = { task: 'Task', bug: 'Bug', story: 'Story', epic: 'Epic', subtask: 'Sub-task' }

function SprintBoardView({ sprint, project, issues, cols, patch, onOpen, onBack }) {
  const [type, setType] = useState('')
  const [per, setPer] = useState(10)
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  const info = SPRINT_INFO.find((x) => x[0] === sprint)
  const [n, , , , goal, end] = info
  const left = Math.ceil((new Date(`${end}T00:00:00`) - new Date()) / 86400000)
  const status = left < 0 ? 'Past its end date' : left === 0 ? 'Ends today' : `${left} days left`
  const list = issues.filter((x) => x.sprint === n && (!type || x.type === type))
  return (
    <div className="po">
      <button type="button" className="po-back" onClick={onBack}><ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />All sprints</button>
      <PageTop title={`${n} board`} sub={`Goal: ${goal}`}><span className="po-st">{status}</span></PageTop>
      <div className="po-fil">
        <label><span>Type</span><select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type"><option value="">All types</option>{Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label><span>Show</span><select value={per} onChange={(e) => setPer(+e.target.value)} aria-label="Show"><option value={5}>5 per column</option><option value={10}>10 per column</option><option value={25}>25 per column</option></select></label>
      </div>
      <div className="po-sbd" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(200px, 1fr))` }}>
        {cols.map(([k, label], ci) => {
          const col = list.filter((x) => x.col === k)
          return (
            <section key={k} className={over === k ? 'over' : ''} aria-label={label} onDragOver={(e) => { e.preventDefault(); setOver(k) }} onDragLeave={() => setOver(null)} onDrop={() => { if (drag) patch(drag, { col: k }); setDrag(null); setOver(null) }}>
              <h3 style={{ color: COL_COLOR[ci % COL_COLOR.length], borderBottomColor: COL_COLOR[ci % COL_COLOR.length] }}>{label.toUpperCase()}<em>{col.length}</em></h3>
              {col.length === 0 ? <p>Nothing here.</p> : col.slice(0, per).map((x) => (
                <article key={x.id} draggable onDragStart={() => setDrag(x.id)} onDragEnd={() => { setDrag(null); setOver(null) }} className={drag === x.id ? 'drag' : ''}>
                  <button type="button" onClick={() => onOpen(x.id)}><small>{x.id}</small><b>{x.title}</b></button>
                  <div><span className={`po-pill ${x.type === 'bug' ? 'err' : 'info'}`}>{TYPE_LABEL[x.type] || 'Task'}</span><Av name={x.who} size={24} /></div>
                </article>
              ))}
              {col.length > per && <small className="po-more">+{col.length - per} more</small>}
            </section>
          )
        })}
      </div>
      <p className="po-fine">{project.name} · {list.length} work items in {n}</p>
    </div>
  )
}

export function SprintBoard({ project, issues, cols, patch, onOpen }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const lastKey = cols[cols.length - 1][0]
  if (open) return <SprintBoardView sprint={open} project={project} issues={issues} cols={cols} patch={patch} onOpen={onOpen} onBack={() => setOpen(null)} />
  const S = SPRINT_INFO.filter(([n]) => n.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="po">
      <PageTop title="Sprint board" sub="Sprint 1 is active" />
      <div className="po-bar"><label className="mp-search po-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sprints…" aria-label="Search sprints" /></label><span>{S.length} sprints</span></div>
      <div className="po-sprints">{S.map(([n, st, d, w, g]) => { const l = issues.filter((x) => x.sprint === n); const dn = l.filter((x) => x.col === lastKey).length; return (
        <section key={n} className={`po-sp${st === 'Active' ? ' on' : ''}`}><h3>{n}<span className={`po-stag ${st === 'Active' ? 'on' : ''}`}>{st}</span></h3><small><CalendarDays size={13} strokeWidth={1.75} aria-hidden="true" />{d} · {w}</small><p>{g}</p>
          <div className="iv-bar"><i style={{ width: `${l.length ? (dn / l.length) * 100 : 0}%` }} /></div><small>{dn} / {l.length} items · {l.length ? Math.round((dn / l.length) * 100) : 0}%</small><button type="button" className="ci-btn" onClick={() => setOpen(n)}>Open board <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" /></button></section>
      ) })}</div>
    </div>
  )
}

// ---------- Defects / bug tracker
const BUGS = [
  ['Task Details – Scrollbar Missing', 'In My Tasks, when a particular task is clicked, the task details panel has no scrollbar.', 'Medium', 'Dev Progress', 'Anita Rao'],
  ['Visibility / Border Issue', 'Borders are not visible. The UI should have a visible border on cards.', 'Medium', 'UAT', 'Mohan Pillai'],
  ['Modal Header Inconsistency', 'The header is not consistent across modal/pop-up/dialog boxes.', 'Medium', 'UAT', 'Mohan Pillai'],
  ['Scope & Requirements UI Issue', 'The Scope & Requirements section has UI/color mismatches.', 'Medium', 'Prod', 'Vinod Pasupuleti'],
  ['Dialog Box Scroll Issue', 'Scrolling is not working properly inside dialog boxes.', 'High', 'UAT', 'Mohan Pillai'],
  ['Backlog Status Issue', 'In Backlog, the status available during Create/Edit is wrong.', 'Medium', 'Dev Completed', 'Vinod Pasupuleti'],
  ['Date and Time Picker Issue', 'Date and time picker components need alignment fixes.', 'Medium', 'Dev Progress', 'Anita Rao'],
  ['Work Log – “What Did You Work On?” Issue', 'The “What did you work on?” field needs to be removed.', 'Medium', 'Dev Completed', 'Vinod Pasupuleti'],
  ['Work Log Date/Time Display', 'Date and time information in the work log should be consistent.', 'Critical', 'Dev Progress', 'Anita Rao'],
  ['Work Log Delete Confirmation', 'Work log deletion should have a proper delete confirmation.', 'High', 'Prod', 'Mohan Pillai'],
].map(([t, d, p, s, a], i) => ({ id: i + 3, t, d, p, s, a }))
export function Defects({ project }) {
  const [q, setQ] = useState('')
  const [f, setF] = useState('All')
  const rows = BUGS.filter((b) => (!q || `${b.t} ${b.d}`.toLowerCase().includes(q.toLowerCase())) && (f === 'All' || (f === 'Critical' && b.p === 'Critical') || (f === 'High' && b.p === 'High') || (f === 'In Pipeline' && b.s !== 'Prod') || (f === 'Prod' && b.s === 'Prod')))
  const cnt = (fn) => BUGS.filter(fn).length
  return (
    <div className="po">
      <PageTop title="Bug tracker" sub={`${BUGS.length} total · ${cnt((b) => b.s !== 'Prod')} in pipeline`} />
      <div className="sh-stats c5">
        <Stat label="Total" value={BUGS.length} icon={Bug} tone="blue" /><Stat label="Critical" value={cnt((b) => b.p === 'Critical')} icon={AlertTriangle} tone="red" /><Stat label="Open" value={cnt((b) => b.s !== 'Prod')} icon={Clock} tone="teal" /><Stat label="Prod" value={cnt((b) => b.s === 'Prod')} icon={CheckCircle2} tone="green" /><Stat label="Tasks affected" value={0} icon={ListChecks} tone="violet" />
      </div>
      <div className="po-bar"><label className="mp-search po-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bugs…" aria-label="Search bugs" /></label>
        <div className="su-seg" role="group" aria-label="Bug filter">{['All', 'Critical', 'High', 'In Pipeline', 'Prod'].map((k) => <button key={k} type="button" aria-pressed={f === k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{k}</button>)}</div></div>
      <section className="wl"><div className="wl-scroll"><table className="wl-table">
        <thead><tr><th>ID</th><th>Title</th><th>Description</th><th>Priority</th><th>Status</th><th>Assignee</th><th /></tr></thead>
        <tbody>{rows.map((b) => <tr key={b.id}><td className="po-id">{project.key}-{b.id}</td><td><b>{b.t}</b></td><td className="po-desc">{b.d}</td><td><Tag tone={b.p === 'Critical' || b.p === 'High' ? 'err' : 'warn'}>{b.p}</Tag></td><td><span className={`po-pill ${b.s === 'Prod' ? 'ok' : b.s === 'UAT' ? 'violet' : b.s === 'Dev Completed' ? 'ok' : 'info'}`}>{b.s}</span></td><td><span className="wl-as"><Av name={b.a} size={24} />{b.a}</span></td><td><button type="button" className="po-mini" aria-label="More" onClick={() => toast({ title: `${project.key}-${b.id}`, text: b.t, duration: 1800 })}>⋮</button></td></tr>)}
          {rows.length === 0 && <tr><td colSpan={7} className="po-empty">No bugs match.</td></tr>}</tbody></table></div></section>
    </div>
  )
}

