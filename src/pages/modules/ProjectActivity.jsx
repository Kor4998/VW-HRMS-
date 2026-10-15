import { useMemo, useState } from 'react'
import { ChevronDown, Download, Search, ShieldCheck, Users, Plug, FolderKanban, CircleCheck } from 'lucide-react'
import { toast } from '@/components/toast'
import Avatar from '@/components/Avatar'
import { PageTop } from './ProjectOps'

const CAT = { Members: Users, Security: ShieldCheck, Integrations: Plug, Issues: FolderKanban }

// [who, verb, object, category, ip, minutes ago, detail]
const EVENTS = (lead) => [
  [lead, 'changed the role of', 'Anita Rao', 'Members', '203.0.113.24', 19, 'Member → Admin on this project.'],
  ['Anita Rao', 'moved', 'issue 103 to In review', 'Issues', '203.0.113.81', 34, 'From In progress. Reviewer: ' + lead + '.'],
  ['Mohan Pillai', 'connected Slack to', '#project-updates', 'Integrations', '198.51.100.7', 120, 'Posts a summary when an issue is done.'],
  [lead, 'required', 'two-factor authentication', 'Security', '203.0.113.81', 190, 'Applies to every member from next sign-in.'],
  ['Vinod Pasupuleti', 'removed', 'Kalyani Devarapalli', 'Members', '192.0.2.146', 300, 'Removed from the project; open issues were reassigned.'],
  ['Mohan Pillai', 'created the API key', 'Deploy hook', 'Security', '198.51.100.63', 420, 'Scope: read issues, write comments.'],
  [lead, 'closed', 'issue 107', 'Issues', '203.0.113.81', 1300, 'Marked Done after release 0.9.'],
  ['Anita Rao', 'created', 'issue 108', 'Issues', '203.0.113.24', 2900, 'Prepare release notes · Medium priority.'],
  ['Mohan Pillai', 'rotated the signing secret for', 'GitHub webhooks', 'Integrations', '198.51.100.63', 4300, 'Old secret stopped working immediately.'],
  [lead, 'added', 'Vinod Pasupuleti', 'Members', '203.0.113.81', 6000, 'Invited as Member.'],
]
const ago = (m) => (m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`)

const UPDATES = (p) => [
  ['Today', [
    ['Anita Rao', 'shared 14 test cases for', `${p.name} login`, '18m'],
    ['Mohan Pillai', 'commented on', 'the export design', '1h'],
    [null, 'Release 0.9 was approved', p.name, '4h'],
    ['Vinod Pasupuleti', 'published', 'API contract v2', '5h'],
  ]],
  ['Yesterday', [
    [p.lead, 'uploaded 6 interview recordings to', p.name, '5:20 PM'],
    [null, 'Sprint 1 goal was met', `${p.name} · 8 of 8 issues`, '3:45 PM'],
    ['Anita Rao', 'approved the', 'accessibility fixes', '10:15 AM'],
  ]],
]

export default function ProjectActivity({ project }) {
  const all = useMemo(() => EVENTS(project.lead), [project.lead])
  const [q, setQ] = useState('')
  const [range, setRange] = useState('7d')
  const [cat, setCat] = useState('All')
  const [live, setLive] = useState(false)
  const [shown, setShown] = useState(5)
  const [openRow, setOpenRow] = useState(null)

  const lim = { '24h': 1440, '7d': 10080, '30d': 43200 }[range]
  const inRange = all.filter((e) => e[5] <= lim)
  const rows = inRange.filter((e) => (cat === 'All' || e[3] === cat) && (!q || `${e[0]} ${e[1]} ${e[2]} ${e[4]}`.toLowerCase().includes(q.toLowerCase())))
  const cats = ['All', ...Object.keys(CAT)]
  const count = (c) => (c === 'All' ? inRange.length : inRange.filter((e) => e[3] === c).length)
  const exportCsv = () => {
    const t = ['Who,Action,Target,Category,IP,Minutes ago', ...rows.map((e) => [e[0], e[1], e[2], e[3], e[4], e[5]].map((v) => `"${v}"`).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv' })); a.download = 'audit-log.csv'; a.click(); URL.revokeObjectURL(a.href)
    toast({ title: 'Export ready', text: `${rows.length} events saved to audit-log.csv.` })
  }

  return (
    <div className="po"><PageTop title="Activity" sub="Who changed what, and what the team shipped." />
    <div className="pa">
      <section className="pm pa-log" aria-label="Audit log">
        <header className="pm-head">
          <div><h2>Audit log</h2><p>{project.name} · kept for 400 days</p></div>
          <button type="button" className="mp-btn" onClick={exportCsv}><Download size={16} strokeWidth={1.75} aria-hidden="true" />Export CSV</button>
        </header>
        <div className="pa-tools">
          <label className="pm-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, actions, IPs" aria-label="Search audit log" /></label>
          <div className="su-seg" role="group" aria-label="Range">{[['24h', '24 hours'], ['7d', '7 days'], ['30d', '30 days']].map(([k, l]) => <button key={k} type="button" aria-pressed={range === k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{l}</button>)}</div>
          <label className="pa-live"><input type="checkbox" role="switch" checked={live} onChange={(e) => setLive(e.target.checked)} /><span className="pa-sw" aria-hidden="true" />Live</label>
        </div>
        <div className="pj-chips pa-chips" role="group" aria-label="Category">
          {cats.map((c) => <button key={c} type="button" aria-pressed={cat === c} className={cat === c ? 'on' : ''} onClick={() => { setCat(c); setShown(5) }}>{c}<em>{count(c)}</em></button>)}
        </div>
        <ul className="pa-list">
          <li className="pa-th"><span>Event</span><span>IP address</span><span>Time</span><span /></li>
          {rows.slice(0, shown).map((e, i) => {
            const Ico = CAT[e[3]]
            const id = `${e[0]}${e[5]}`
            return (
              <li key={id} className={openRow === id ? 'open' : ''}>
                <button type="button" aria-expanded={openRow === id} onClick={() => setOpenRow(openRow === id ? null : id)}>
                  <span className="pa-ev"><Avatar name={e[0]} size={32} /><span><span><b>{e[0]}</b> {e[1]} <b>{e[2]}</b></span><small><Ico size={14} strokeWidth={1.75} aria-hidden="true" />{e[3]}</small></span></span>
                  <code>{e[4]}</code><span className="pa-t">{i === 0 && live ? 'just now' : ago(e[5])}</span><ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
                {openRow === id && <p className="pa-detail">{e[6]}</p>}
              </li>
            )
          })}
          {rows.length === 0 && <li className="pm-none">No events match your filters.</li>}
        </ul>
        <footer className="pm-foot rl-foot"><span>Showing {Math.min(shown, rows.length)} of {rows.length} events</span>{rows.length > shown && <button type="button" className="pa-more" onClick={() => setShown(shown + 5)}>Show {Math.min(5, rows.length - shown)} more</button>}</footer>
      </section>

      <aside className="pm pa-up" aria-label="Team updates">
        <header className="pm-head"><div><h2>Team updates</h2><p>What the team shipped and shared</p></div></header>
        {UPDATES(project).map(([day, items]) => (
          <div key={day} className="pa-day">
            <h3>{day}<em>{items.length} updates</em></h3>
            <ol>
              {items.map(([who, verb, obj, t]) => (
                <li key={verb + obj}>
                  {who ? <Avatar name={who} size={32} /> : <i className="ok"><CircleCheck size={16} strokeWidth={1.75} aria-label="Done" /></i>}
                  <span>{who ? <><b>{who}</b> {verb} <b>{obj}</b></> : <b>{verb}</b>}{!who && <small>{obj}</small>}</span>
                  <time>{t}</time>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </aside>
    </div>
    </div>
  )
}
