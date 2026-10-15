import { useMemo, useState, useEffect } from 'react'
import { ChevronDown, CirclePlus, Clock, Ellipsis, GitPullRequest, Plus, Search, SquareCheck, Flag } from 'lucide-react'
import { AvatarGroup } from '@/components/Avatar'
import { PageTop } from './ProjectOps'
import ProjectActivity from './ProjectActivity'
import { Timeline, Reports, Releases } from './ProjectJira'
import IssueView from './IssueView'
import { ProjectOverview, ProjectTeam, ScopeRequirements, ScrumBoard, SprintBoard, Defects } from './ProjectOps'
import { TestRepository, Timesheets, ProjectCalendar, Credentials, Deployments, Maintenance, Analytics } from './ProjectOps2'
import CreateIssue, { ISSUE_TYPES } from './CreateIssue'
import LogWorkDialog from './LogWorkDialog'
import { fmtDur, wlId } from './issueTime'
import { Tabs, Tag } from './ModuleKit'
import Checkbox from '@/components/Checkbox'
import { toast } from '@/components/toast'
import Avatar from '@/components/Avatar'

const DEFAULT_COLS = [['todo', 'To do'], ['doing', 'In progress'], ['review', 'In review'], ['done', 'Done']]
const PRIO = { Highest: 'err', High: 'err', Medium: 'warn', Low: 'info' }
const PRIOS = ['Highest', 'High', 'Medium', 'Low']
const TYPES = ISSUE_TYPES
const SPRINTS = ['Sprint 1', 'Sprint 2', '']
const ME = 'Venkatesh Korlapati'
const STATUS_CLS = { todo: 'st-todo', doing: 'st-doing', review: 'st-review', done: 'st-done' }
const DAYS = ['Today', 'Yesterday', '2 days ago', '3 days ago', 'Oct 6', 'Oct 3', 'Sep 29']
const PEOPLE = (lead) => [lead, 'Anita Rao', 'Mohan Pillai', 'Vinod Pasupuleti']
const fmtDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '')
const num = (id) => +id.split('-').pop()

const TITLES = [
  ['Set up the project workspace', 'task', 'todo', 3], ['Design the main screen', 'story', 'todo', 5], ['Fix the login redirect', 'bug', 'doing', 2], ['Write API contract', 'task', 'doing', 3],
  ['Add export to CSV', 'story', 'review', 5], ['Review accessibility issues', 'task', 'todo', 2], ['Improve loading state', 'bug', 'done', 1], ['Prepare release notes', 'task', 'done', 1],
  ['Notification preferences', 'story', 'backlog', 8], ['Bulk edit for issues', 'story', 'backlog', 5], ['Slow search on large projects', 'bug', 'backlog', 3],
  ['Launch to all employees', 'epic', 'backlog', 13],
]
function seed(p, cols) {
  if (p.sample === false) return []
  const who = PEOPLE(p.lead)
  const map = { todo: cols[0][0], doing: cols[Math.min(1, cols.length - 1)][0], review: cols[Math.max(0, cols.length - 2)][0], done: cols[cols.length - 1][0] }
  const epic = `${p.key}-${101 + 11}`
  return TITLES.map(([title, type, col, pts], i) => {
    const est = type === 'epic' ? 0 : pts * 120
    const logged = col === 'done' ? est : col === 'doing' ? Math.round(est / 2) : col === 'review' ? Math.round(est * 0.8) : 0
    return {
      id: `${p.key}-${101 + i}`, title, type, col: map[col === 'backlog' ? 'todo' : col], sprint: col !== 'backlog' ? 'Sprint 1' : i === 8 || i === 9 ? 'Sprint 2' : '',
      prio: PRIOS[i % 4], who: who[i % 4], pts, labels: i % 4 === 1 ? ['frontend'] : [], parent: [1, 4, 8].includes(i) ? epic : '', team: i % 3 === 0 ? 'Engineering' : '',
      due: i < 8 ? `2026-10-${String(14 + i * 2).padStart(2, '0')}` : '', start: '', est, logged, created: ['3 days ago', 'Oct 6', 'Oct 3'][i % 3],
      worklog: logged ? [{ who: who[i % 4], min: logged, date: 'Oct 8', text: 'Initial work' }] : [],
      desc: i % 3 === 0 ? 'Describe what needs to change, why it matters and how we will know it is done.' : '',
      comments: i % 2 ? [{ who: who[(i + 1) % 4], text: 'Picked this up, will share a draft tomorrow.', at: '2 days ago' }] : [],
    }
  })
}

function Pip({ type }) { const [l, I] = TYPES[type] || TYPES.task; return <I size={14} strokeWidth={1.75} className={`ty-${type}`} aria-label={l} /> }
function Av({ name, size = 24 }) { return <Avatar name={name} size={size} /> }

// Jira-style project: summary, backlog with sprints, board (drag-and-drop), list table, Create work item dialog,
// full issue view with time tracking, then members / roles / activity.
// Issues survive switching between the project's sidebar pages (each page remounts this component).
const STORE = {}

export default function ProjectBoard({ project, ProjIcon, tab: tabProp, setTab: setTabProp, showTabs = false }) {
  const baseCols = useMemo(() => (project.statuses ? project.statuses.map((n, i) => [`s${i}`, n]) : DEFAULT_COLS), [project.statuses])
  const [custom, setCustom] = useState(null)
  const COLS = custom || baseCols
  const clsOf = (k) => { if (STATUS_CLS[k]) return STATUS_CLS[k]; const i = COLS.findIndex(([c]) => c === k); return i <= 0 ? 'st-todo' : i === COLS.length - 1 ? 'st-done' : i === COLS.length - 2 && COLS.length > 3 ? 'st-review' : 'st-doing' }
  const [issues, setIssues] = useState(() => STORE[project.id] || seed(project, baseCols))
  useEffect(() => { STORE[project.id] = issues }, [project.id, issues])
  const [tabLocal, setTabLocal] = useState('board')
  const tab = tabProp || tabLocal
  const setTab = setTabProp || setTabLocal
  const [q, setQ] = useState('')
  const [who, setWho] = useState('')
  const [type, setType] = useState('')
  const [sel, setSel] = useState(null)
  const [picked, setPicked] = useState([])
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  const [adding, setAdding] = useState(null)
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState({ 'Sprint 1': true, 'Sprint 2': true, backlog: true })
  const [groupBy, setGroupBy] = useState('none')
  const [wip, setWip] = useState(0)
  const [quick, setQuick] = useState('')
  const [anchor, setAnchor] = useState('')
  const [logFor, setLogFor] = useState(null)
  const [create, setCreate] = useState(null) // null | defaults object
  const people = PEOPLE(project.lead)

  const patch = (id, ch) => setIssues((l) => l.map((x) => (x.id === id ? { ...x, ...ch } : x)))
  const nextId = (l) => `${project.key}-${Math.max(100, ...l.map((x) => num(x.id))) + 1}`
  const addIssue = (partial) => {
    let made = null
    setIssues((l) => { made = { id: nextId(l), title: 'Untitled', type: 'task', col: COLS[0][0], sprint: 'Sprint 1', prio: 'Medium', who: project.lead, pts: 1, labels: [], parent: '', team: '', due: '', start: '', est: 0, logged: 0, created: 'Today', worklog: [], desc: '', comments: [], ...partial }; return [...l, made] })
    return made
  }
  const inline = (col, sprint) => {
    if (!draft.trim()) { setAdding(null); return }
    addIssue({ title: draft.trim(), col, sprint })
    setDraft(''); setAdding(null); toast({ title: 'Work item created', duration: 2000 })
  }
  const fromDialog = (f) => {
    const made = addIssue({ title: f.summary, type: f.type, desc: f.desc, who: f.who, labels: f.labels, parent: f.type === 'epic' ? '' : f.parent, sprint: f.sprint, due: f.due, prio: f.prio, est: f.est, pts: f.pts, team: f.team, col: f.col || COLS[0][0] })
    toast({ title: `${made?.id || TYPES[f.type][0]} created`, text: `${TYPES[f.type][0]} “${f.summary}” was added${f.sprint ? ` to ${f.sprint}` : ' to the backlog'}.`, duration: 6000, action: { label: 'Open ' + (made?.id || 'ticket'), run: () => { setAnchor('timesheet'); setSel(made?.id) } } })
    if (made) setLogFor(made)
    return made
  }
  const addChild = (parent, title) => { addIssue({ title, type: 'subtask', parent: parent.id, sprint: parent.sprint, col: COLS[0][0], who: parent.who, pts: 1 }); toast({ title: 'Child work item added', duration: 1800 }) }

  const match = (x) => (!quick || (quick === 'mine' ? x.who === ME : quick === 'bugs' ? x.type === 'bug' : quick === 'due' ? !!x.due && x.col !== lastKey : true)) && (!q || `${x.id} ${x.title}`.toLowerCase().includes(q.toLowerCase())) && (!who || x.who === who) && (!type || x.type === type)
  const sprintIssues = issues.filter((x) => x.sprint === 'Sprint 1')
  const lastKey = COLS[COLS.length - 1][0]
  const lanes = groupBy === 'none' ? [[null, sprintIssues]] : (() => { const key = (x) => (groupBy === 'who' ? x.who : groupBy === 'prio' ? x.prio : (issues.find((e) => e.id === x.parent)?.title || 'No epic')); const m = new Map(); sprintIssues.forEach((x) => { const k = key(x); m.set(k, [...(m.get(k) || []), x]) }); return [...m.entries()] })()
  const done = sprintIssues.filter((x) => x.col === lastKey)
  const pts = (l) => l.reduce((a, x) => a + x.pts, 0)
  const cur = issues.find((x) => x.id === sel)
  const drop = (col) => { if (drag) patch(drag, { col }); setDrag(null); setOver(null) }
  const epics = issues.filter((x) => x.type === 'epic')
  const epicOf = (x) => issues.find((e) => e.id === x.parent)

  const row = (x) => (
    <li key={x.id}>
      <button type="button" className="bl-row" onClick={() => setSel(x.id)}>
        <Pip type={x.type} /><code>{x.id}</code><b>{x.title}</b>
        {epicOf(x) && <span className="wl-ep" title={epicOf(x).title}>{epicOf(x).id}</span>}
        {x.est > 0 && <span className="pb-time"><Clock size={12} strokeWidth={1.75} aria-hidden="true" />{fmtDur(x.logged)}/{fmtDur(x.est)}</span>}
        <span className={`wl-st ${clsOf(x.col)}`}>{COLS.find(([k]) => k === x.col)?.[1]}</span>
        <Tag tone={PRIO[x.prio]}>{x.prio}</Tag><span className="bl-pts">{x.pts}</span><Av name={x.who} />
      </button>
      <button type="button" className="bl-mv" onClick={() => { patch(x.id, { sprint: x.sprint ? '' : 'Sprint 1' }); toast({ title: x.sprint ? 'Moved to backlog' : 'Added to Sprint 1', duration: 1800 }) }}>{x.sprint ? 'To backlog' : 'To sprint'}</button>
    </li>
  )

  const issueEl = cur ? (
    <IssueView
      key={cur.id} issue={cur} project={project} cols={COLS} clsOf={clsOf} people={people} issues={issues} sprints={SPRINTS} me={ME}
      patch={patch} anchor={anchor} onClose={() => { setSel(null); setAnchor('') }} onOpen={setSel} onAddChild={addChild}
      onAddStatus={(name) => { setCustom([...COLS.slice(0, -1), [`c${Date.now()}`, name], COLS[COLS.length - 1]]); toast({ title: 'Status added', text: `${name} is now a column on the board.`, duration: 2400 }) }}
      onRenameStatus={(key, name) => setCustom(COLS.map(([k, l]) => (k === key ? [k, name] : [k, l])))}
    />
  ) : null
  const saveNewLog = ({ min, date, text, start }) => {
    patch(logFor.id, { logged: (logFor.logged || 0) + min, worklog: [{ id: wlId(), who: ME, min, date, start, text }] })
    toast({ title: 'Work logged', text: `${fmtDur(min)} added to ${logFor.id} and the timesheet.`, duration: 3000, action: { label: 'Open timesheet', run: () => { setAnchor('timesheet'); setSel(logFor.id) } } })
    setLogFor(null)
  }
  const dialog = <>{logFor ? <LogWorkDialog issue={logFor} project={project} who={ME} skipLabel="Skip for now" onSave={saveNewLog} onClose={() => setLogFor(null)} /> : null}<CreateIssue open={!!create} onClose={() => setCreate(null)} project={project} people={people} epics={epics} sprints={SPRINTS} defaults={create || undefined} onCreate={fromDialog} /></>
  if (cur) return <div className="mp">{issueEl}{dialog}</div>

  return (
    <div className="mp">
      <header className="mp-head"><div className="pj-title"><ProjIcon p={project} size={44} /><div><h1>{project.name}</h1><p>{project.key} · {project.type} · Lead {project.lead}</p></div></div>
        <button type="button" className="pb-create" onClick={() => setCreate({ sprint: tab === 'backlog' ? '' : 'Sprint 1' })}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Create</button></header>
      {showTabs && <Tabs label="Project sections" value={tab} onChange={setTab} items={[['summary', 'Overview'], ['backlog', 'Backlog', issues.length], ['board', 'Board', sprintIssues.length], ['list', 'List', issues.length], ['timeline', 'Timeline'], ['reports', 'Reports'], ['releases', 'Releases'], ['team', 'Project Team'], ['scope', 'Scope & Requirements'], ['scrum', 'Scrum Board'], ['sprints', 'Sprint Board'], ['defects', 'Defects'], ['tests', 'Test Repository'], ['time', 'Timesheets'], ['calendar', 'Calendar'], ['creds', 'Credentials'], ['deploy', 'Deployments'], ['maint', 'Maintenance'], ['analytics', 'Analytics & Reports'], ['activity', 'Activity']]} />}

      {(tab === 'team' || tab === 'members' || tab === 'roles') && <ProjectTeam project={project} issues={issues} cols={COLS} />}
      {tab === 'timeline' && <Timeline issues={issues} cols={COLS} onOpen={setSel} />}
      {tab === 'reports' && <Reports issues={issues} cols={COLS} />}
      {tab === 'releases' && <Releases issues={issues} cols={COLS} setIssues={setIssues} />}
      {tab === 'scope' && <ScopeRequirements project={project} />}
      {tab === 'scrum' && <ScrumBoard project={project} issues={issues} cols={COLS} />}
      {tab === 'sprints' && <SprintBoard project={project} issues={issues} cols={COLS} patch={patch} onOpen={setSel} />}
      {tab === 'defects' && <Defects project={project} />}
      {tab === 'tests' && <TestRepository />}
      {tab === 'time' && <Timesheets project={project} issues={issues} setIssues={setIssues} />}
      {tab === 'calendar' && <ProjectCalendar issues={issues} cols={COLS} />}
      {tab === 'creds' && <Credentials />}
      {tab === 'deploy' && <Deployments project={project} />}
      {tab === 'maint' && <Maintenance project={project} />}
      {tab === 'analytics' && <Analytics issues={issues} cols={COLS} />}
      {tab === 'activity' && <ProjectActivity project={project} />}

      {(tab === 'board' || tab === 'backlog' || tab === 'list') && <PageTop title={{ board: 'Board', backlog: 'Backlog', list: 'List' }[tab]} sub={{ board: 'Drag work between columns to update its status.', backlog: 'Plan sprints and rank what comes next.', list: 'Every work item in one table.' }[tab]} />}
      {(tab === 'board' || tab === 'backlog' || tab === 'list') && (
        <div className="pb-bar">
          <label className="mp-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search work" aria-label="Search work" /></label>
          <span className="uag pb-people" role="group" aria-label="Filter by assignee">{people.map((n) => <button key={n} type="button" aria-pressed={who === n} className={who === n ? 'on' : ''} aria-label={n} onClick={() => setWho(who === n ? '' : n)}><Av name={n} size={28} /></button>)}</span>
          <select className="pb-sel" value={type} onChange={(e) => setType(e.target.value)} aria-label="Work type"><option value="">All types</option>{Object.entries(TYPES).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
          {(q || who || type) && <button type="button" className="pb-clear" onClick={() => { setQ(''); setWho(''); setType('') }}>Clear</button>}
        </div>
      )}

      {tab === 'summary' && <ProjectOverview project={project} issues={issues} cols={COLS} />}

      {tab === 'list' && (
        <section className="wl" aria-label="All work">
          <div className="wl-scroll">
            <table className="wl-table">
              <thead><tr>
                <th className="wl-cb"><Checkbox aria-label="Select all" checked={picked.length > 0 && picked.length === issues.filter(match).length} indeterminate={picked.length > 0 && picked.length < issues.filter(match).length} onChange={(e) => setPicked(e.target.checked ? issues.filter(match).map((x) => x.id) : [])} /></th>
                <th>Work</th><th>Status</th><th>Assignee</th><th>Priority</th><th>Sprint</th><th>Due date</th><th>Time tracking</th><th>Updated</th>
              </tr></thead>
              <tbody>
                {issues.filter(match).map((x, i) => (
                  <tr key={x.id} className={picked.includes(x.id) ? 'sel' : ''}>
                    <td className="wl-cb"><Checkbox aria-label={`Select ${x.id}`} checked={picked.includes(x.id)} onChange={(e) => setPicked((l) => (e.target.checked ? [...l, x.id] : l.filter((v) => v !== x.id)))} /></td>
                    <td><button type="button" className="wl-w" onClick={() => setSel(x.id)}><Pip type={x.type} /><code>{x.id}</code><b>{x.title}</b>{epicOf(x) && <span className="wl-ep" title={epicOf(x).title}>{epicOf(x).id}</span>}</button></td>
                    <td><span className={`wl-st ${clsOf(x.col)}`}>{COLS.find(([k]) => k === x.col)?.[1]}</span></td>
                    <td><span className="wl-as"><Av name={x.who} />{x.who}</span></td>
                    <td><Tag tone={PRIO[x.prio]}>{x.prio}</Tag></td>
                    <td>{x.sprint || <span className="wl-un">Backlog</span>}</td>
                    <td>{x.due ? fmtDate(x.due) : <span className="wl-un">—</span>}</td>
                    <td>{x.est || x.logged ? <span className="wl-tm"><i><b style={{ width: `${x.est ? Math.min(100, (x.logged / x.est) * 100) : 100}%` }} /></i>{fmtDur(x.logged)}{x.est ? ` / ${fmtDur(x.est)}` : ''}</span> : <span className="wl-un">—</span>}</td>
                    <td>{DAYS[i % 4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="wl-foot">
            {adding === 'list'
              ? <input className="pj-new" autoFocus value={draft} placeholder="What needs to be done?" aria-label="New work item" onChange={(e) => setDraft(e.target.value)} onBlur={() => inline(COLS[0][0], '')} onKeyDown={(e) => { if (e.key === 'Enter') inline(COLS[0][0], ''); if (e.key === 'Escape') { setDraft(''); setAdding(null) } }} />
              : <button type="button" className="pj-add" onClick={() => setAdding('list')}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Create</button>}
            <span>{picked.length ? `${picked.length} selected` : `${issues.filter(match).length} work items`}</span>
          </div>
        </section>
      )}

      {tab === 'board' && (
        <>
          <section className="pb-sprint" aria-label="Sprint">
            <div><b>Sprint 1</b><span>Oct 6 – Oct 20 · 8 days left</span></div>
            <div className="pb-sp-prog"><i style={{ width: `${sprintIssues.length ? (done.length / sprintIssues.length) * 100 : 0}%` }} /></div>
            <span>{done.length} of {sprintIssues.length} done · {pts(done)}/{pts(sprintIssues)} points</span>
            <button type="button" className="mp-btn" onClick={() => { setIssues((l) => l.map((x) => (x.sprint === 'Sprint 1' && x.col !== lastKey ? { ...x, sprint: 'Sprint 2' } : x))); toast({ title: 'Sprint completed', text: `${done.length} closed. Unfinished work moved to Sprint 2.` }) }}><Flag size={16} strokeWidth={1.75} aria-hidden="true" />Complete sprint</button>
          </section>
          <div className="kb-tools">
            <label><span>Group by</span><select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} aria-label="Group by"><option value="none">None</option><option value="who">Assignee</option><option value="prio">Priority</option><option value="epic">Epic</option></select></label>
            <label><span>WIP limit</span><select value={wip} onChange={(e) => setWip(+e.target.value)} aria-label="WIP limit"><option value={0}>Off</option>{[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} per column</option>)}</select></label>
            <div className="su-seg" role="group" aria-label="Quick filters">{[['mine', 'Only my work'], ['bugs', 'Bugs'], ['due', 'Due soon']].map(([k, l]) => <button key={k} type="button" aria-pressed={quick === k} className={quick === k ? 'on' : ''} onClick={() => setQuick(quick === k ? '' : k)}>{l}</button>)}</div>
          </div>
          {lanes.map(([label, laneItems]) => (
            <div key={label || 'all'} className="kb-lane">
              {label && <h4 className="kb-lh">{label}<em>{laneItems.filter(match).length}</em></h4>}
            <div className="kb" style={{ gridTemplateColumns: `repeat(${COLS.length}, minmax(300px, 1fr))` }}>
              {COLS.map(([k, label], ci) => {
                const col = laneItems.filter((x) => x.col === k && match(x))
                return (
                  <section key={k} className={`kb-col${over === k ? ' over' : ''}`} aria-label={label} onDragOver={(e) => { e.preventDefault(); setOver(k) }} onDragLeave={() => setOver(null)} onDrop={() => drop(k)}>
                    <header className="kb-h"><h3>{label}{wip > 0 && ci > 0 && ci < COLS.length - 1 && <em className={`kb-wip${col.length > wip ? " over" : ""}`} title="Work in progress limit">{col.length}/{wip}</em>}</h3><span><button type="button" aria-label={`Add work item to ${label}`} onClick={() => setCreate({ sprint: 'Sprint 1', col: k })}><CirclePlus size={22} strokeWidth={1.5} /></button><button type="button" aria-label={`${label} options`} onClick={() => toast({ title: label, text: `${col.length} work items in this column.`, duration: 1800 })}><Ellipsis size={20} strokeWidth={1.75} /></button></span></header>
                    <ul>
                      {col.map((x) => {
                        const kids = issues.filter((c) => c.parent === x.id)
                        const kd = kids.filter((c) => c.col === lastKey).length
                        const total = kids.length || 1
                        const doneN = kids.length ? kd : x.col === lastKey ? 1 : 0
                        const tone = x.col === lastKey ? 'ok' : doneN ? 'info' : 'warn'
                        return (
                          <li key={x.id} draggable onDragStart={() => setDrag(x.id)} onDragEnd={() => { setDrag(null); setOver(null) }} className={`kb-card${drag === x.id ? ' dragging' : ''}`}>
                            <div className="kb-top"><code>{x.id}</code><button type="button" aria-label={`Open ${x.id}`} onClick={() => setSel(x.id)}><Ellipsis size={18} strokeWidth={1.75} /></button></div>
                            <button type="button" className="kb-title" onClick={() => setSel(x.id)}>{x.title}</button>
                            <div className="kb-tags"><span>{TYPES[x.type]?.[0] || 'Task'}</span><span>{x.prio}</span>{x.labels?.map((l) => <span key={l}>{l}</span>)}{x.parent && <span>Epic</span>}</div>
                            <div className="kb-prog"><span>Progress</span><em>{doneN} of {total}</em></div>
                            <div className={`kb-bar ${tone}`}><i style={{ width: `${(doneN / total) * 100}%` }} /></div>
                            <div className="kb-foot">
                              <AvatarGroup names={[x.who, ...people.filter((n) => n !== x.who).slice(0, x.pts > 2 ? 2 : 1)]} max={3} size={28} />
                              <span className="kb-ic">{x.comments.length > 0 && <b className="kb-n">{x.comments.length}</b>}<SquareCheck size={20} strokeWidth={1.5} aria-label="Tasks" /><GitPullRequest size={20} strokeWidth={1.5} aria-label="Linked" /></span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                    <button type="button" className="kb-add" onClick={() => setCreate({ sprint: 'Sprint 1', col: k })}><CirclePlus size={18} strokeWidth={1.5} aria-hidden="true" />Add Task</button>
                  </section>
                )
              })}
            </div>
            </div>
          ))}
        </>
      )}

      {tab === 'backlog' && (
        <div className="bl">
          {[['Sprint 1', 'Sprint 1', 'Active · Oct 6 – Oct 20'], ['Sprint 2', 'Sprint 2', 'Planned'], ['backlog', 'Backlog', '']].map(([k, label, sub]) => {
            const list = issues.filter((x) => (k === 'backlog' ? !x.sprint : x.sprint === k) && match(x))
            return (
              <section key={k} className="bl-sec">
                <button type="button" className="bl-h" aria-expanded={open[k]} onClick={() => setOpen((o) => ({ ...o, [k]: !o[k] }))}><ChevronDown size={16} strokeWidth={1.75} className={open[k] ? '' : 'shut'} aria-hidden="true" /><b>{label}</b>{sub && <span className="bl-sub">{sub}</span>}<em>{list.length} work items · {pts(list)} points{list.some((x) => x.est) ? ` · ${fmtDur(list.reduce((a, x) => a + (x.est || 0), 0))} estimated` : ''}</em></button>
                {open[k] && (
                  <>
                    <ul>{list.map(row)}{list.length === 0 && <li className="bl-empty">Nothing here yet.</li>}</ul>
                    {adding === k
                      ? <input className="pj-new" autoFocus value={draft} placeholder="What needs to be done?" aria-label="New work item" onChange={(e) => setDraft(e.target.value)} onBlur={() => inline(COLS[0][0], k === 'backlog' ? '' : k)} onKeyDown={(e) => { if (e.key === 'Enter') inline(COLS[0][0], k === 'backlog' ? '' : k); if (e.key === 'Escape') { setDraft(''); setAdding(null) } }} />
                      : <button type="button" className="pj-add" onClick={() => setAdding(k)}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Create</button>}
                  </>
                )}
              </section>
            )
          })}
        </div>
      )}


      {dialog}
    </div>
  )
}
