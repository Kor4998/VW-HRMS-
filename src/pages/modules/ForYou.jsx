import { useState } from 'react'
import { Bug, Search, SquareCheck, Star, BookOpen } from 'lucide-react'
import { Tag } from './ModuleKit'
import { SpaceGlyph } from '@/components/spaceIcons'

const ME = 'Venkatesh Korlapati'
const WORK = [
  ['HRM-101', 'Set up the project workspace', 'HRMS', 'task', 'To do', 'Highest', ME, ['rec', 'mine', 'worked']],
  ['HRM-105', 'Add export to CSV', 'HRMS', 'story', 'In review', 'Highest', ME, ['rec', 'mine', 'worked', 'viewed']],
  ['VFR-104', 'Shipment tracking bug on mobile', 'VoltusFreight', 'bug', 'In progress', 'High', 'Charla Venkatesh', ['rec', 'viewed']],
  ['WEH-112', 'Pick-list motion prototype', 'Wehouse', 'story', 'In progress', 'Medium', 'Saisaankhya Katari', ['viewed']],
  ['SAP-087', 'Publish test summary notes', 'SAP Test Assurance', 'task', 'Done', 'Low', 'Diviti Tejesh', ['worked']],
  ['POR-044', 'Slow dashboard on large portfolios', 'Portfolio Intelligence', 'bug', 'To do', 'High', ME, ['rec', 'mine']],
]
const ICON = { task: [SquareCheck, 'ty-task'], bug: [Bug, 'ty-bug'], story: [BookOpen, 'ty-story'] }
const TABS = [['rec', 'Recommended'], ['mine', 'Assigned to me'], ['starred', 'Starred'], ['worked', 'Worked on'], ['viewed', 'Viewed']]

// Jira-style "For you" home: greeting, find a project, recent project cards, and a tabbed list of your work.
export default function ForYou({ projects, onOpen, onAll, name = 'Venkatesh' }) {
  const [tab, setTab] = useState('rec')
  const [q, setQ] = useState('')
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  const mine = WORK.filter((w) => w[7].includes('mine')).length
  const rows = WORK.filter((w) => w[7].includes(tab))
  const found = q ? projects.filter((p) => `${p.name} ${p.key} ${p.lead}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : []
  const recent = ['HRM', 'VFR', 'WEH'].map((id) => projects.find((p) => p.id === id)).filter(Boolean)
  const open = (project) => project && onOpen(project)

  return (
    <div className="fy">
      <h1>Welcome {name}. It’s {today}.</h1>
      <p className="fy-sub">Let’s find your work.</p>

      <section className="fy-sec" aria-label="Find a project">
        <div className="fy-h"><h2>Find a project</h2><button type="button" onClick={onAll}>View all projects</button></div>
        <label className="fy-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find projects by name, key or lead" aria-label="Find projects" /></label>
        {q && (
          <ul className="fy-found">{found.map((p) => <li key={p.id}><button type="button" onClick={() => open(p)}><i className={`pn-tile ${p.tone}`}><SpaceGlyph p={p} size={13} /></i><span><b>{p.name}</b><em>{p.key} · {p.lead}</em></span></button></li>)}{found.length === 0 && <li className="fy-none">No projects match “{q}”.</li>}</ul>
        )}
        <div className="fy-cards">
          {recent.map((p) => (
            <button key={p.id} type="button" className="fy-card" onClick={() => open(p)}>
              <i className={`pn-tile lg ${p.tone}`}><SpaceGlyph p={p} size={20} /></i><b>{p.name}</b><small>{p.type} project · {p.members} members</small>
            </button>
          ))}
        </div>
      </section>

      <section className="fy-sec" aria-label="Your work">
        <div className="fy-h"><h2>For you</h2>
          <div className="su-seg" role="tablist" aria-label="Work filter">{TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} aria-pressed={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{k === 'mine' && <em className="fy-n">{mine}</em>}</button>)}</div>
        </div>
        {rows.length === 0 ? (
          <div className="fy-empty"><i><Star size={28} strokeWidth={1.5} aria-hidden="true" /></i><b>Star your work for quick access</b><p>Star issues and projects you care about and they will show up here.</p></div>
        ) : (
          <ul className="fy-list">
            {rows.map(([id, title, proj, type, status, prio, who]) => {
              const [I, cls] = ICON[type]
              return (
                <li key={id}>
                  <button type="button" onClick={() => open(projects.find((p) => p.name === proj))}>
                    <I size={16} strokeWidth={1.75} className={cls} aria-label={type} /><span><b>{title}</b><em>{id} · {proj}</em></span>
                    <Tag tone={prio === 'Low' ? 'info' : prio === 'Medium' ? 'warn' : 'err'}>{prio}</Tag><span className={`wl-st st-${status === 'To do' ? 'todo' : status === 'Done' ? 'done' : status === 'In review' ? 'review' : 'doing'}`}>{status}</span><small>{who === ME ? 'You' : who}</small>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
