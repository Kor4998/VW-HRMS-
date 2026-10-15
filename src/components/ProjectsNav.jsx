import { useEffect, useRef, useState } from 'react'
import { SpaceGlyph } from './spaceIcons'
import { GanttChart, ChartNoAxesCombined, Bug, CalendarClock, CalendarDays, FileText, FlaskConical, GitBranch, KeyRound, LineChart, Timer, Wrench, Zap, ListFilter, MoreHorizontal, Orbit, Rocket, BarChart3, ChevronRight, CircleUserRound, Clock, Columns3, Inbox, LayoutGrid, List, ListTodo, Plus, ScrollText, Search, Star, Users, X } from 'lucide-react'

const VIEWS = [['summary', 'Overview', BarChart3], ['backlog', 'Backlog', ListTodo], ['board', 'Board', Columns3], ['list', 'List', List], ['timeline', 'Timeline', GanttChart], ['reports', 'Reports', ChartNoAxesCombined], ['releases', 'Releases', Rocket], ['team', 'Project Team', Users], ['scope', 'Scope & Requirements', FileText], ['scrum', 'Scrum Board', CalendarClock], ['sprints', 'Sprint Board', Zap], ['defects', 'Defects', Bug], ['tests', 'Test Repository', FlaskConical], ['time', 'Timesheets', Timer], ['calendar', 'Calendar', CalendarDays], ['creds', 'Credentials', KeyRound], ['deploy', 'Deployments', GitBranch], ['maint', 'Maintenance', Wrench], ['analytics', 'Analytics & Reports', LineChart], ['activity', 'Activity', ScrollText]]
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }

function Tile({ p }) { return <i className={`pn-tile ${p.tone}`}><SpaceGlyph p={p} size={13} /></i> }

// Jira-style sidebar for the Projects app: For you, Recent / Starred flyouts, project list with expanding views.
export default function ProjectsNav({ projects, page, tab, go, collapsed }) {
  const [fly, setFly] = useState(null) // { kind, top }
  const [q, setQ] = useState('')
  const [, bump] = useState(0)
  const pop = useRef(null)
  const cur = page?.startsWith('proj:') ? page.slice(5) : null

  useEffect(() => {
    if (!cur) return
    const r = [cur, ...read('prj-recent', ['HRM', 'VFR']).filter((x) => x !== cur)].slice(0, 6)
    try { localStorage.setItem('prj-recent', JSON.stringify(r)) } catch { /* storage unavailable */ }
    bump((n) => n + 1)
  }, [cur])
  useEffect(() => {
    const on = () => bump((n) => n + 1)
    window.addEventListener('prj-star-change', on)
    return () => window.removeEventListener('prj-star-change', on)
  }, [])
  useEffect(() => {
    if (!fly) return undefined
    const down = (e) => { if (!pop.current?.contains(e.target) && !e.target.closest?.('.pn-fly-btn')) setFly(null) }
    const key = (e) => { if (e.key === 'Escape') setFly(null) }
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key) }
  }, [fly])

  const byId = (id) => projects.find((p) => p.id === id)
  const recent = read('prj-recent', ['HRM', 'VFR']).map(byId).filter(Boolean)
  const starIds = read('prj-star', projects.filter((p) => p.star).map((p) => p.id))
  const starred = starIds.map(byId).filter(Boolean)

  const openFly = (e, kind) => {
    if (fly?.kind === kind) { setFly(null); return }
    const r = e.currentTarget.getBoundingClientRect()
    setQ(''); setFly({ kind, top: Math.max(64, Math.min(r.top, window.innerHeight - 340)), left: r.right + 12 })
  }
  const list = (fly?.kind === 'recent' ? recent : fly?.kind === 'more' ? projects : starred).filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
  const item = (label, Icon, active, onClick, extra) => (
    <button type="button" className={`pn-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined} title={collapsed ? label : undefined} onClick={onClick}>
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" /><span className="nav-label">{label}</span>{extra}
    </button>
  )

  return (
    <div className="pn">
      {item('For you', CircleUserRound, page === 'For you', () => go('For you'))}
      {item('Recent', Clock, fly?.kind === 'recent', (e) => openFly(e, 'recent'), <ChevronRight size={16} strokeWidth={1.75} className="pn-chev" aria-hidden="true" />)}
      {item('Starred', Star, fly?.kind === 'starred', (e) => openFly(e, 'starred'), <ChevronRight size={16} strokeWidth={1.75} className="pn-chev" aria-hidden="true" />)}
      {item('All projects', LayoutGrid, page === 'All Projects', () => go('All Projects'))}

      <div className="pn-spaces">
        <span className="pn-sp-l"><Orbit size={18} strokeWidth={1.75} aria-hidden="true" /><span className="nav-label">Spaces</span></span>
        <span className="pn-sp-a nav-label"><button type="button" aria-label="Create space" title="Create space" onClick={() => window.dispatchEvent(new Event('prj-create'))}><Plus size={16} strokeWidth={1.75} /></button><button type="button" aria-label="View all spaces" title="View all spaces" onClick={() => go('All Projects')}><MoreHorizontal size={16} strokeWidth={1.75} /></button></span>
      </div>
      <small className="pn-cap nav-label">Recent</small>
      {recent.slice(0, 3).map((p) => {
        const open = cur === p.id
        return (
          <div key={p.id} className="pn-proj">
            <button type="button" className={`pn-item${open ? ' open' : ''}`} aria-expanded={open} title={collapsed ? p.name : undefined} onClick={() => go(`proj:${p.id}`, 'board')}>
              <Tile p={p} /><span className="nav-label">{p.name}</span>
            </button>
            {open && !collapsed && (
              <div className="pn-views" role="group" aria-label={`${p.name} views`}>
                {VIEWS.map(([k, label, I]) => (
                  <button key={k} type="button" className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => go(`proj:${p.id}`, k)}><I size={16} strokeWidth={1.75} aria-hidden="true" />{label}</button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {item('More spaces', ListFilter, fly?.kind === 'more', (e) => openFly(e, 'more'), <ChevronRight size={16} strokeWidth={1.75} className="pn-chev" aria-hidden="true" />)}
      <small className="pn-cap nav-label">Recommended</small>
      <button type="button" className="pn-item" title={collapsed ? 'Product roadmap' : undefined} onClick={() => window.dispatchEvent(new Event('prj-create'))}><i className="pn-tile violet"><Rocket size={13} strokeWidth={1.75} aria-hidden="true" /></i><span className="nav-label">Roadmap</span><em className="pn-try nav-label">Try</em></button>

      {fly && (
        <div className="pn-pop" ref={pop} style={{ top: fly.top, left: fly.left }} role="dialog" aria-label={fly.kind === 'recent' ? 'Recent' : fly.kind === 'more' ? 'More spaces' : 'Starred'}>
          <header><b>{fly.kind === 'recent' ? 'Recent' : fly.kind === 'more' ? 'More spaces' : 'Starred'}</b><button type="button" aria-label="Close" onClick={() => setFly(null)}><X size={16} strokeWidth={1.75} /></button></header>
          {fly.kind !== 'starred' && <label className="pn-q"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={fly.kind === 'more' ? 'Search spaces' : 'Search recent items'} aria-label="Search" /></label>}
          {list.length === 0 ? (
            <div className="pn-none"><Inbox size={28} strokeWidth={1.5} aria-hidden="true" /><b>{fly.kind === 'starred' ? 'You haven’t starred anything yet.' : 'Nothing matches.'}</b>{fly.kind === 'starred' && <p>Star a project to open it quickly from here.</p>}</div>
          ) : (
            <>
              {fly.kind !== 'starred' && <small>{fly.kind === 'more' ? `All spaces (${list.length})` : 'Today'}</small>}
              <ul className={fly.kind === 'more' ? 'pn-scroll' : ''}>{list.map((p) => <li key={p.id}><button type="button" onClick={() => { go(`proj:${p.id}`, 'board'); setFly(null) }}><Tile p={p} /><span><b>{p.name}</b><em>{p.key} · {p.type}</em></span></button></li>)}</ul>
            </>
          )}
          <footer><button type="button" onClick={() => { go('All Projects'); setFly(null) }}><List size={16} strokeWidth={1.75} aria-hidden="true" />View all projects</button></footer>
        </div>
      )}
    </div>
  )
}
