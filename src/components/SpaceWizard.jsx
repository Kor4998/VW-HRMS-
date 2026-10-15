import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, BarChart3, BookOpen, Bug, CalendarDays, ChevronDown, Columns3, ListTodo, Lock, Plus, ScrollText, ShieldCheck, SquareCheck, Trash2, Upload, Users, X, Zap, List as ListIcon, CircleCheck } from 'lucide-react'
import { DIRECTORY } from './person'
import { SPACE_ICONS, SPACE_TONES, SpaceGlyph } from './spaceIcons'
import './spacewizard.css'

const NAV = ['Made for you', 'Bundles', 'Custom templates', 'Import data']
const CATS = ['Software development', 'Service management', 'Work management', 'Product management', 'Marketing', 'Customer service', 'Human resources', 'Finance', 'Design', 'Personal', 'Operations', 'Legal', 'Sales']
const TEMPLATES = [
  { id: 'roadmap', title: 'Product roadmap', desc: 'Create custom roadmaps and share your plans with everyone.', type: 'Kanban', accent: '#A855F7', statuses: ['Now', 'Next', 'Later'], features: ['Plan upcoming work on a timeline', 'Share roadmaps with stakeholders', 'Track delivery progress'], cats: ['Product management', 'Software development'], badge: 'Last created' },
  { id: 'discovery', title: 'Product discovery', desc: 'Prioritise ideas, then connect them from discovery through to delivery.', type: 'Kanban', accent: '#3B82F6', statuses: ['Ideas', 'Discovery', 'Delivery'], features: ['Collect and score ideas', 'Connect ideas to delivery work', 'Share insights with the team'], cats: ['Product management'] },
  { id: 'kanban', title: 'Kanban', desc: 'Work efficiently and visualise work on a board with to do, doing and done.', type: 'Kanban', accent: '#3B82F6', statuses: ['To Do', 'In Progress', 'Done'], features: ['Visualise work on a board', 'Limit work in progress', 'Spot bottlenecks early'], cats: ['Software development', 'Work management', 'Operations', 'Design', 'Marketing', 'Sales', 'Personal'] },
  { id: 'blank', title: 'Blank space', desc: 'Start with a blank canvas.', type: 'Kanban', accent: '#3B82F6', statuses: ['To Do', 'In Progress', 'Done'], features: ['Add only what you need', 'Change anything later'], cats: ['Work management', 'Personal'] },
  { id: 'scrum', title: 'Scrum', desc: 'Plan, track and execute work using sprints and a backlog.', type: 'Scrum', accent: '#2563EB', statuses: ['To Do', 'In Progress', 'Done'], features: ['Plan upcoming work in a backlog', 'Organise cycles of work into sprints', 'Understand your team’s velocity'], cats: ['Software development', 'Product management', 'Design'] },
  { id: 'pm', title: 'Project management', desc: 'Plan and deliver business projects.', type: 'Scrum', accent: '#65A30D', statuses: ['To Do', 'In Progress', 'In Review', 'Done'], features: ['Break projects into tasks', 'Track owners and due dates', 'Report on progress'], cats: ['Work management', 'Operations', 'Human resources', 'Finance', 'Legal', 'Customer service', 'Service management'] },
]
const VIEWS = [['list', 'List', ListIcon, true], ['board', 'Board', Columns3, true], ['backlog', 'Backlog', ListTodo, true], ['summary', 'Summary', BarChart3], ['members', 'Members', Users], ['roles', 'Roles', ShieldCheck], ['activity', 'Activity', ScrollText], ['calendar', 'Calendar', CalendarDays]]
const TYPE_ICON = { Epic: [Zap, 'ty-epic'], Story: [BookOpen, 'ty-story'], Bug: [Bug, 'ty-bug'], Task: [SquareCheck, 'ty-task'] }
const ROLES = ['Administrator', 'Member', 'Viewer']
const autoKey = (n) => n.replace(/[^a-zA-Z ]/g, ' ').trim().split(/\s+/).filter(Boolean).map((w, _, a) => (a.length > 1 ? w[0] : w.slice(0, 3))).join('').slice(0, 5).toUpperCase()

function Art({ accent, wide }) {
  return (
    <svg viewBox="0 0 220 160" className={`sw-art${wide ? ' wide' : ''}`} aria-hidden="true">
      <rect x="0" y="0" width="68" height="160" rx="4" fill="#EEF0F3" /><rect x="76" y="0" width="68" height="160" rx="4" fill="#EEF0F3" /><rect x="152" y="0" width="68" height="160" rx="4" fill="#EEF0F3" />
      <rect x="8" y="14" width="52" height="30" rx="3" fill="#D9DDE3" /><rect x="84" y="14" width="52" height="30" rx="3" fill="#D9DDE3" /><rect x="160" y="14" width="52" height="30" rx="3" fill="#D9DDE3" />
      <rect x="30" y="68" width="112" height="44" rx="5" fill="#fff" stroke="#D9DDE3" /><rect x="40" y="80" width="60" height="5" rx="2.5" fill="#D9DDE3" /><rect x="40" y="94" width="36" height="8" rx="3" fill={accent} />
      <circle cx="170" cy="100" r="16" fill={accent} opacity=".9" />
    </svg>
  )
}

// Space preview card on the tinted panel: live name/key, tabs, and a mini board.
function Preview({ name, key_, statuses, sample, icon, tone, views }) {
  const cols = statuses.slice(0, 3)
  const SAMPLE = ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5', 'Task 6']
  const tabs = ['List', 'Board', ...(views.includes('backlog') ? ['Backlog'] : []), 'Calendar', ...(views.includes('summary') ? ['Summary'] : [])]
  return (
    <div className="sw-pv">
      <i className="sw-pv-c a" /><i className="sw-pv-c b" />
      <div className="sw-pv-card">
        <small>Team-managed space</small>
        <h3>{icon && <span className={`sw-tile ${tone}`}><SpaceGlyph p={{ icon, ini: '' }} size={16} /></span>}{name || 'My space'}</h3>
        <div className="sw-pv-tabs">{tabs.map((t) => <span key={t} className={t === 'Board' ? 'on' : ''}>{t}</span>)}</div>
        <div className="sw-pv-cols">
          {cols.map((c, ci) => (
            <div key={c}><b>{c}</b>
              {(sample ? SAMPLE.filter((_, i) => i % cols.length === ci) : [null, null].slice(0, ci === 0 ? 1 : 1)).map((t, i) => <div key={i} className="sw-pv-i">{t ? <span>{t}</span> : <i />}<em><u className={['s', 'b', 't'][(i + ci) % 3]} />{key_ || 'KEY'}-{2 + ci * 2 + i}</em></div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Create-space wizard (Jira style): templates -> template details -> name -> set up -> invite -> new space.
export default function SpaceWizard({ open, onClose, onCreate, existingKeys = [] }) {
  const [stage, setStage] = useState('templates')
  const [nav, setNav] = useState('Made for you')
  const [tpl, setTpl] = useState(TEMPLATES[4])
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [keyEdited, setKeyEdited] = useState(false)
  const [managed, setManaged] = useState('')
  const [icon, setIcon] = useState('Rocket')
  const [tone, setTone] = useState('blue')
  const [iconOpen, setIconOpen] = useState(false)
  const [types, setTypes] = useState(['Story', 'Bug', 'Task'])
  const [statuses, setStatuses] = useState(['To Do', 'In Progress', 'Done'])
  const [views, setViews] = useState(['list', 'board', 'backlog', 'summary'])
  const [sample, setSample] = useState(false)
  const [open2, setOpen2] = useState({ types: true, statuses: true, views: true })
  const [pct, setPct] = useState(0)
  const [invitees, setInvitees] = useState([])
  const [who, setWho] = useState('')
  const [role, setRole] = useState('Member')
  const [touched, setTouched] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const key_ = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', key_)
    box.current?.focus()
    return () => document.removeEventListener('keydown', key_)
  }, [open, onClose, stage])
  useEffect(() => {
    if (stage !== 'invite') return undefined
    const t = setInterval(() => setPct((p) => Math.min(100, p + 4)), 120)
    return () => clearInterval(t)
  }, [stage])

  const effKey = keyEdited ? key : autoKey(name)
  const keyErr = !effKey ? 'Enter a key' : existingKeys.includes(effKey) ? 'That key is already used' : ''
  const nameErr = !name.trim() ? 'Enter a name' : ''
  const shownTpls = useMemo(() => (nav === 'Made for you' ? TEMPLATES : TEMPLATES.filter((t) => t.cats.includes(nav))), [nav])
  const people = Object.keys(DIRECTORY).filter((n) => !invitees.includes(n))

  if (!open) return null

  const pick = (t) => { setTpl(t); setStatuses(t.statuses); setViews(t.type === 'Scrum' ? ['list', 'board', 'backlog', 'summary'] : ['list', 'board', 'summary']); setStage('detail') }
  const next1 = () => { setTouched(true); if (!nameErr && !keyErr && managed) setStage('setup') }
  const finish = (inv) => {
    const k = effKey
    onCreate({
      id: k, name: name.trim(), key: k, ini: k.slice(0, 2), icon, tone, sub: '', type: tpl.type, pct: 0, members: 1 + inv.length, bugs: 0, open: sample ? 7 : 0,
      lead: 'Venkatesh Korlapati', tags: [], star: false, status: 'On track', due: 'TBD', statuses, types, views: views.filter((v) => ['summary', 'backlog', 'board', 'list', 'members', 'roles', 'activity'].includes(v)), sample,
    })
  }
  const addInvitee = (v) => { const n = v.trim(); if (n && !invitees.includes(n)) setInvitees([...invitees, n]); setWho('') }

  const left = {
    templates: (
      <div className="sw-tpls">
        <aside className="sw-side">
          <button type="button" className="sw-x" aria-label="Close" onClick={onClose}><X size={20} strokeWidth={1.75} /></button>
          <h1>Space templates</h1>
          <ul>{NAV.map((n) => <li key={n}><button type="button" className={nav === n ? 'on' : ''} onClick={() => setNav(n)}>{n}{n === 'Custom templates' && <em>Enterprise</em>}{n === 'Import data' && <Upload size={14} strokeWidth={1.75} aria-hidden="true" />}</button></li>)}</ul>
          <h2>Categories</h2>
          <ul>{CATS.map((c) => <li key={c}><button type="button" className={nav === c ? 'on' : ''} onClick={() => setNav(c)}>{c}</button></li>)}</ul>
        </aside>
        <main className="sw-main">
          <p className="sw-bc">Space templates</p>
          <h2>{['Bundles', 'Custom templates', 'Import data'].includes(nav) ? nav : nav === 'Made for you' ? 'Made for you' : nav}</h2>
          <p className="sw-sub">{nav === 'Made for you' ? 'Templates for you based on how similar teams work.' : ['Bundles', 'Custom templates', 'Import data'].includes(nav) ? 'Not available in this demo.' : `Templates for ${nav.toLowerCase()}.`}</p>
          {['Bundles', 'Custom templates', 'Import data'].includes(nav) ? <div className="sw-empty">Nothing here yet.</div> : (
            <div className="sw-grid">
              {shownTpls.map((t) => (
                <button key={t.id} type="button" className="sw-tc" onClick={() => pick(t)}>
                  <Art accent={t.accent} />
                  <span className="sw-tc-t"><b>{t.title}</b>{t.badge && <em>{t.badge}</em>}</span>
                  <span className="sw-tc-d">{t.desc}</span>
                  <span className="sw-tc-a"><i />Voltuswave Projects</span>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    ),
    detail: (
      <div className="sw-tpls">
        <aside className="sw-side"><button type="button" className="sw-x" aria-label="Close" onClick={onClose}><X size={20} strokeWidth={1.75} /></button><h1>Space templates</h1><ul>{NAV.map((n) => <li key={n}><button type="button" className={n === 'Made for you' ? 'on' : ''} onClick={() => { setNav(n); setStage('templates') }}>{n}</button></li>)}</ul></aside>
        <main className="sw-main">
          <p className="sw-bc"><button type="button" onClick={() => setStage('templates')}>Space templates</button> / Made for you</p>
          <div className="sw-det">
            <div className="sw-det-l">
              <span className="sw-brand"><i />Voltuswave Projects</span>
              <h2>{tpl.title}</h2><p>{tpl.desc}</p>
              <button type="button" className="sw-btn" onClick={() => setStage('name')}>Use template</button>
              <h3>Features</h3><ul>{tpl.features.map((f) => <li key={f}><ListTodo size={16} strokeWidth={1.75} aria-hidden="true" />{f}</li>)}</ul>
              <h3>Workflow</h3><div className="sw-wf">{tpl.statuses.map((s, i) => <span key={s} className={i === 0 ? 'a' : i === tpl.statuses.length - 1 ? 'c' : 'b'}>{s}</span>)}</div>
              <h3>Work types</h3><div className="sw-wt">{['Epic', 'Story', 'Bug', 'Task'].map((t) => { const [I, c] = TYPE_ICON[t]; return <span key={t}><I size={14} strokeWidth={1.75} className={c} aria-hidden="true" />{t}</span> })}</div>
            </div>
            <div className="sw-det-r"><Preview name={`Sample ${tpl.title} project`} key_="SCR" statuses={tpl.statuses} sample icon="" tone="blue" views={['backlog']} /></div>
          </div>
        </main>
      </div>
    ),
    name: (
      <div className="sw-step">
        <button type="button" className="sw-back" onClick={() => setStage('detail')}><ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />Back to templates</button>
        <div className="sw-form">
          <h1>Name your space</h1>
          <p className="sw-req">Required fields are marked with an asterisk <b>*</b></p>
          <label className="sw-f"><span>Name <b>*</b></span>
            <span className="sw-name">
              <span className="sw-ic-wrap">
                <button type="button" className={`sw-tile lg ${tone}`} aria-label="Choose space icon" aria-expanded={iconOpen} onClick={() => setIconOpen((v) => !v)}><SpaceGlyph p={{ icon, ini: '' }} size={20} /></button>
                {iconOpen && (
                  <span className="sw-ic-pop" role="dialog" aria-label="Space icon">
                    <small>Icon</small>
                    <span className="sw-ic-grid">{Object.entries(SPACE_ICONS).map(([k, I]) => <button key={k} type="button" aria-label={k} aria-pressed={icon === k} className={icon === k ? 'on' : ''} onClick={() => setIcon(k)}><I size={18} strokeWidth={1.75} /></button>)}</span>
                    <small>Colour</small>
                    <span className="sw-ic-tones">{SPACE_TONES.map((t) => <button key={t} type="button" aria-label={t} aria-pressed={tone === t} className={`${t}${tone === t ? ' on' : ''}`} onClick={() => setTone(t)} />)}</span>
                  </span>
                )}
              </span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Try a team name, project goal, milestone..." aria-invalid={touched && !!nameErr} />
            </span>
            {touched && nameErr && <em className="sw-err">{nameErr}</em>}
          </label>
          <label className="sw-f"><span>How your space is managed <b>*</b></span>
            <select value={managed} onChange={(e) => setManaged(e.target.value)} aria-invalid={touched && !managed}><option value="">Select a person</option><option value="team">Team-managed</option><option value="company">Company-managed</option></select>
            {touched && !managed && <em className="sw-err">Choose how your space is managed</em>}
            <a className="sw-link" href="#" onClick={(e) => e.preventDefault()}>Learn more about space types</a>
          </label>
          <div className="sw-f"><span>Space permissions</span><div className="sw-promo"><b>Choose who can view, edit, and comment</b><p>With space permissions, control who has access to your spaces and what they can do.</p><a href="#" onClick={(e) => e.preventDefault()}>Try it free for 14 days</a></div></div>
          <label className="sw-f"><span>Key <b>*</b></span><input className="sw-key" value={effKey} maxLength={5} onChange={(e) => { setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setKeyEdited(true) }} aria-invalid={touched && !!keyErr} />{touched && keyErr && <em className="sw-err">{keyErr}</em>}</label>
          <div className="sw-f"><span className="sw-row">Template <button type="button" onClick={() => setStage('detail')}>See details</button></span>
            <div className="sw-tpl-sel"><Art accent={tpl.accent} /><span><b>{tpl.title}</b><small><i />Voltuswave Projects</small><em>{tpl.desc}</em></span></div></div>
        </div>
      </div>
    ),
    setup: (
      <div className="sw-step">
        <button type="button" className="sw-back" onClick={() => setStage('name')}><ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />Back to Name your space</button>
        <div className="sw-form scroll">
          <h1>Let’s set up your space</h1>
          <p className="sw-sub2">These form the building blocks of your space. You can change these settings later.</p>
          <p className="sw-cfg">Configuration<b>*</b></p>

          <section className="sw-box"><button type="button" className="sw-bh" aria-expanded={open2.types} onClick={() => setOpen2((o) => ({ ...o, types: !o.types }))}>Work types<ChevronDown size={16} strokeWidth={1.75} className={open2.types ? '' : 'shut'} aria-hidden="true" /></button>
            {open2.types && (<>
              <div className="sw-line"><i className="ty"><Zap size={16} strokeWidth={1.75} className="ty-epic" /></i><input value="Epic" readOnly aria-label="Epic" /></div>
              <hr />
              {types.map((t, i) => { const [I, c] = TYPE_ICON[t] || TYPE_ICON.Task; return <div key={i} className="sw-line"><i className="ty"><I size={16} strokeWidth={1.75} className={c} /></i><input value={t} onChange={(e) => setTypes(types.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Work type ${i + 1}`} /><button type="button" aria-label={`Delete ${t}`} onClick={() => setTypes(types.filter((_, j) => j !== i))}><Trash2 size={16} strokeWidth={1.75} /></button></div> })}
              <button type="button" className="sw-add" onClick={() => setTypes([...types, `Work type ${types.length + 1}`])}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Add work type</button>
            </>)}
          </section>

          <section className="sw-box"><button type="button" className="sw-bh" aria-expanded={open2.statuses} onClick={() => setOpen2((o) => ({ ...o, statuses: !o.statuses }))}>Statuses<ChevronDown size={16} strokeWidth={1.75} className={open2.statuses ? '' : 'shut'} aria-hidden="true" /></button>
            {open2.statuses && (<>
              {statuses.map((s, i) => <div key={i} className="sw-line"><span className="sw-grip" aria-hidden="true">⋮⋮</span><input value={s} onChange={(e) => setStatuses(statuses.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Status ${i + 1}`} /><button type="button" aria-label={`Delete ${s}`} disabled={statuses.length <= 2} onClick={() => setStatuses(statuses.filter((_, j) => j !== i))}><Trash2 size={16} strokeWidth={1.75} /></button></div>)}
              <button type="button" className="sw-add" onClick={() => setStatuses([...statuses.slice(0, -1), `Status ${statuses.length}`, statuses[statuses.length - 1]])}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Add status</button>
            </>)}
          </section>

          <section className="sw-box"><button type="button" className="sw-bh" aria-expanded={open2.views} onClick={() => setOpen2((o) => ({ ...o, views: !o.views }))}>Views<ChevronDown size={16} strokeWidth={1.75} className={open2.views ? '' : 'shut'} aria-hidden="true" /></button>
            {open2.views && (
              <div className="sw-chips">{VIEWS.map(([k, l, I, locked]) => {
                const on = views.includes(k)
                return <button key={k} type="button" disabled={locked} aria-pressed={on || locked} className={on || locked ? 'on' : ''} onClick={() => setViews(on ? views.filter((v) => v !== k) : [...views, k])}><I size={14} strokeWidth={1.75} aria-hidden="true" />{l}{locked && <Lock size={12} strokeWidth={1.75} aria-label="Always on" />}</button>
              })}</div>
            )}
          </section>

          <label className="sw-switch"><span>Start with sample work items</span><input type="checkbox" role="switch" checked={sample} onChange={(e) => setSample(e.target.checked)} /><i aria-hidden="true">{sample ? <CircleCheck size={12} strokeWidth={2.5} /> : <X size={12} strokeWidth={2.5} />}</i></label>
        </div>
      </div>
    ),
    invite: (
      <div className="sw-step">
        <div className="sw-form">
          <h1>{pct < 100 ? 'We’re setting up your space…' : 'Your space is ready'}</h1>
          <div className="sw-prog" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
          <p className="sw-sub2">Get a head start by inviting your team while you wait.</p>
          <label className="sw-f"><span>Enter names or emails</span>
            <span className="sw-chipbox">
              {invitees.map((n) => <span key={n} className="sw-chip">{n}<button type="button" aria-label={`Remove ${n}`} onClick={() => setInvitees(invitees.filter((x) => x !== n))}><X size={12} strokeWidth={2} /></button></span>)}
              <input list="sw-people" value={who} onChange={(e) => setWho(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addInvitee(who) } }} onBlur={() => addInvitee(who)} placeholder={invitees.length ? '' : 'John Smith'} />
              <datalist id="sw-people">{people.map((n) => <option key={n} value={n} />)}</datalist>
            </span>
          </label>
          <label className="sw-f"><span>Role</span><select value={role} disabled={!invitees.length} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
        </div>
      </div>
    ),
  }[stage]

  const stepNo = { name: 1, setup: 2, invite: 3 }[stage]
  return (
    <div className="sw" role="dialog" aria-modal="true" aria-label="Create a space" tabIndex={-1} ref={box}>
      <div className={`sw-body${stepNo ? ' split' : ''}`}>
        <div className="sw-left">{left}</div>
        {stepNo && <div className="sw-right"><Preview name={name.trim() || 'My space'} key_={effKey} statuses={statuses} sample={sample} icon={name ? icon : ''} tone={tone} views={views} /></div>}
      </div>
      {stepNo && (
        <footer className="sw-foot">
          <span>Step {stepNo} of 3</span>
          <div>
            {stage === 'invite' && <button type="button" className="sw-ghost" onClick={() => finish([])}>I’ll do this later</button>}
            {stage === 'name' && <button type="button" className="sw-btn" onClick={next1}>Next</button>}
            {stage === 'setup' && <button type="button" className="sw-btn" disabled={statuses.some((s) => !s.trim())} onClick={() => { setPct(0); setStage('invite') }}>Next</button>}
            {stage === 'invite' && <button type="button" className="sw-btn" disabled={pct < 100} onClick={() => finish(invitees)}>Next</button>}
          </div>
        </footer>
      )}
    </div>
  )
}
