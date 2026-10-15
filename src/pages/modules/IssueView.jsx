import { useEffect, useRef, useState } from 'react'
import { Timer, Eye, FileText, Paperclip, ArrowLeft, Bot, ChevronDown, Clock, GitBranch, GitCommitHorizontal, Link2, Plug, Plus, RefreshCw, SquareTerminal, X, Zap } from 'lucide-react'
import { parseDur, fmtDur, wlId } from './issueTime'
import LogWorkDialog from './LogWorkDialog'
import DateField from '@/components/DateField'
import { ISSUE_TYPES } from './CreateIssue'
import { Tag } from './ModuleKit'
import { toast } from '@/components/toast'
import Avatar from '@/components/Avatar'

const PRIOS = ['Highest', 'High', 'Medium', 'Low']
const PRIO = { Highest: 'err', High: 'err', Medium: 'warn', Low: 'info' }
const TEAMS = ['Engineering', 'Design', 'QA', 'Product', 'Support']

function Av({ name, size = 24 }) { return <Avatar name={name} size={size} /> }
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

// Jira-style status control: lozenge button, menu of the other statuses, Add status / Edit status / View workflow.
function StatusMenu({ issue, cols, clsOf, patch, onAddStatus, onRenameStatus }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('pick') // pick | add | edit | flow
  const [name, setName] = useState('')
  const wrap = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const down = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', down)
    return () => document.removeEventListener('mousedown', down)
  }, [open])
  const cur = cols.find(([k]) => k === issue.col)
  const close = () => { setOpen(false); setMode('pick'); setName('') }
  return (
    <div className="iv-sm" ref={wrap}>
      <button type="button" className={`iv-stb ${clsOf(issue.col)}`} aria-haspopup="menu" aria-expanded={open} onClick={() => { setOpen(!open); setMode('pick') }}>{cur?.[1]}<ChevronDown size={14} strokeWidth={2} aria-hidden="true" /></button>
      {open && (
        <div className="iv-menu" role="menu">
          {mode === 'pick' && (<>
            <ul>{cols.filter(([k]) => k !== issue.col).map(([k, l]) => <li key={k}><button type="button" role="menuitem" onClick={() => { patch(issue.id, { col: k, sprint: issue.sprint || 'Sprint 1' }); close() }}><span className={`wl-st ${clsOf(k)}`}>{l}</span></button></li>)}</ul>
            <hr />
            <button type="button" role="menuitem" className="iv-mi" onClick={() => setMode('add')}>Add status</button>
            <button type="button" role="menuitem" className="iv-mi" onClick={() => setMode('edit')}>Edit status</button>
            <button type="button" role="menuitem" className="iv-mi" onClick={() => setMode('flow')}>View workflow</button>
          </>)}
          {mode === 'add' && (
            <div className="iv-mf"><b>Add status</b><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Status name" aria-label="Status name" onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { onAddStatus(name.trim()); close() } }} />
              <div><button type="button" className="ci-btn" disabled={!name.trim()} onClick={() => { onAddStatus(name.trim()); close() }}>Add</button><button type="button" className="ci-ghost" onClick={() => setMode('pick')}>Back</button></div></div>
          )}
          {mode === 'edit' && (
            <div className="iv-mf"><b>Edit status</b>{cols.map(([k, l]) => <input key={k} defaultValue={l} aria-label={`Rename ${l}`} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== l) onRenameStatus(k, e.target.value.trim()) }} />)}<div><button type="button" className="ci-btn" onClick={close}>Done</button></div></div>
          )}
          {mode === 'flow' && (
            <div className="iv-mf"><b>Workflow</b><ol className="iv-flow">{cols.map(([k, l], i) => <li key={k}><span className={`wl-st ${clsOf(k)}`}>{l}</span>{i < cols.length - 1 && <em aria-hidden="true">→</em>}</li>)}</ol><p>Any status can move to any other.</p><div><button type="button" className="ci-ghost" onClick={() => setMode('pick')}>Back</button></div></div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }) { return <div className="iv-row"><span>{label}</span><div>{children}</div></div> }

// Jira-style full issue view: description, child work items, activity on the left; status + details + time tracking on the right.
export default function IssueView({ issue, project, cols, clsOf, people, issues, sprints, me, patch, onClose, onOpen, onAddChild, onAddStatus, onRenameStatus, anchor }) {
  const box = useRef(null)
  const [comment, setComment] = useState('')
  const [feed, setFeed] = useState('all')
  const [child, setChild] = useState('')
  const [lab, setLab] = useState('')
  const [log, setLog] = useState(false)
  const [linkType, setLinkType] = useState('blocks')
  const [linkTo, setLinkTo] = useState('')
  const goTs = (e) => { e.preventDefault(); document.getElementById(`ts-${issue.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }) }
  useEffect(() => { if (anchor === 'timesheet') setTimeout(() => document.getElementById(`ts-${issue.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 250) }, [anchor, issue.id])
  const [openBlocks, setOpenBlocks] = useState({ desc: true, dev: true, auto: true })

  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose })
  useEffect(() => {
    const prev = document.activeElement
    box.current?.focus({ preventScroll: true })
    if (!anchor) box.current?.scrollIntoView({ block: 'start' })
    const key = (e) => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); prev?.focus?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issue.id])

  const [tl, TI] = ISSUE_TYPES[issue.type] || ISSUE_TYPES.task
  const epics = issues.filter((x) => x.type === 'epic' && x.id !== issue.id)
  const parent = issues.find((x) => x.id === issue.parent)
  const kids = issues.filter((x) => x.parent === issue.id)
  const kidsDone = kids.filter((k) => k.col === cols[cols.length - 1][0]).length
  const est = issue.est || 0
  const logged = issue.logged || 0
  const remaining = Math.max(0, est - logged)
  const addLabel = () => { const v = lab.trim().replace(/\s+/g, '-'); if (v && !(issue.labels || []).includes(v)) patch(issue.id, { labels: [...(issue.labels || []), v] }); setLab('') }
  const postComment = () => { if (!comment.trim()) return; patch(issue.id, { comments: [...issue.comments, { who: me, text: comment.trim(), at: 'Just now' }] }); setComment('') }
  const saveLog = ({ min, date, text, start }) => {
    patch(issue.id, { logged: logged + min, worklog: [{ id: wlId(), who: me, min, date, start, text }, ...(issue.worklog || [])] })
    toast({ title: 'Work logged', text: `${fmtDur(min)} added to ${issue.id} and the timesheet.`, duration: 2600 })
    setLog(false)
  }
  const history = [{ who: me, text: `created this ${tl.toLowerCase()}`, at: issue.created || 'Today' }]
  const items = [
    ...(feed === 'all' || feed === 'comments' ? issue.comments.map((c) => ({ ...c, kind: 'comment' })) : []),
    ...(feed === 'all' || feed === 'work' ? (issue.worklog || []).map((w) => ({ who: w.who, kind: 'work', text: `logged ${fmtDur(w.min)}${w.text ? ` · ${w.text}` : ''}`, at: w.date })) : []),
    ...(feed === 'all' || feed === 'history' ? history.map((h) => ({ ...h, kind: 'history' })) : []),
  ]

  return (
    <div className="iv-page" role="region" aria-label={`${issue.id} ${issue.title}`} tabIndex={-1} ref={box}>
      <div className="iv">
        <header className="iv-top">
          <nav aria-label="Breadcrumb"><button type="button" onClick={onClose}>Spaces</button><i>/</i><button type="button" onClick={onClose}>{project.name}</button>{parent && <><i>/</i><button type="button" onClick={() => onOpen(parent.id)}><Zap size={14} strokeWidth={1.75} className="ty-epic" aria-hidden="true" />{parent.id}</button></>}<i>/</i><b><TI size={14} strokeWidth={1.75} className={`ty-${issue.type}`} aria-hidden="true" />{issue.id}</b></nav>
          <button type="button" className="iv-back" onClick={onClose}><ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />Back to {project.name}</button>
        </header>
        <div className="iv-grid">
          <div className="iv-main">
            <input className="id-title iv-title" value={issue.title} onChange={(e) => patch(issue.id, { title: e.target.value })} aria-label="Title" />
            <div className="iv-tools">
              <button type="button" onClick={() => { navigator.clipboard?.writeText(`${issue.id}`); toast({ title: 'Link copied', text: issue.id, duration: 1600 }) }}><Link2 size={14} strokeWidth={1.75} aria-hidden="true" />Copy key</button>
              <button type="button" onClick={() => { setLog(true) }}><Clock size={14} strokeWidth={1.75} aria-hidden="true" />Log work</button>
              <a className="iv-anchor" href={`#ts-${issue.id}`} onClick={goTs}><Timer size={14} strokeWidth={1.75} aria-hidden="true" />Timesheet{(issue.worklog || []).length > 0 && <em>{fmtDur(logged)}</em>}</a>
            </div>

            <section className="iv-sec">
              <button type="button" className="iv-h" aria-expanded={openBlocks.desc} onClick={() => setOpenBlocks((o) => ({ ...o, desc: !o.desc }))}><ChevronDown size={16} strokeWidth={1.75} className={openBlocks.desc ? '' : 'shut'} aria-hidden="true" />Description</button>
              {openBlocks.desc && <textarea className="iv-desc" rows={7} value={issue.desc} placeholder="Add a description…" onChange={(e) => patch(issue.id, { desc: e.target.value })} aria-label="Description" />}
            </section>

            <section className="iv-sec iv-ts" id={`ts-${issue.id}`} aria-label="Timesheet">
              <h3 className="iv-h2">Timesheet<a className="iv-anchor-h" href={`#ts-${issue.id}`} onClick={goTs} aria-label="Link to this section">#</a><em>{(issue.worklog || []).length} {(issue.worklog || []).length === 1 ? 'entry' : 'entries'}</em></h3>
              <div className="iv-ts-sum">
                <div><small>Original estimate</small><b>{est ? fmtDur(est) : 'Not set'}</b></div>
                <div><small>Time spent</small><b>{fmtDur(logged)}</b></div>
                <div><small>Remaining</small><b>{est ? fmtDur(remaining) : '—'}</b></div>
              </div>
              {(issue.worklog || []).length === 0 ? <p className="iv-ts-empty">No time logged on this work item yet.</p> : (
                <ul className="iv-ts-list">{[...(issue.worklog || [])].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((w, i) => (
                  <li key={w.id || i}><Av name={w.who} size={28} /><span><span className="iv-ts-l"><b>{w.who}</b> logged <b>{fmtDur(w.min)}</b></span><small>{w.date}{w.start != null ? ` · ${Math.floor(w.start / 60)}:${String(w.start % 60).padStart(2, '0')}` : ''}</small>{w.text && <p>{w.text}</p>}</span></li>
                ))}</ul>
              )}
              <button type="button" className="iv-logbtn" onClick={() => setLog(true)}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Log work</button>
              <p className="iv-ts-note">Every entry also appears on the project Timesheets page.</p>
            </section>

            <section className="iv-sec">
              <h3 className="iv-h2">Child work items{kids.length > 0 && <em>{kidsDone}/{kids.length} done</em>}</h3>
              {kids.length > 0 && <div className="iv-bar"><i style={{ width: `${(kidsDone / kids.length) * 100}%` }} /></div>}
              <ul className="iv-kids">{kids.map((k) => { const [, KI] = ISSUE_TYPES[k.type] || ISSUE_TYPES.task; return <li key={k.id}><button type="button" onClick={() => onOpen(k.id)}><KI size={14} strokeWidth={1.75} className={`ty-${k.type}`} /><code>{k.id}</code><b>{k.title}</b><span className={`wl-st ${clsOf(k.col)}`}>{cols.find(([c]) => c === k.col)?.[1]}</span><Av name={k.who} /></button></li> })}</ul>
              <input className="iv-add" value={child} onChange={(e) => setChild(e.target.value)} placeholder="Add child work item" aria-label="Add child work item" onKeyDown={(e) => { if (e.key === 'Enter' && child.trim()) { onAddChild(issue, child.trim()); setChild('') } }} />
            </section>

            <section className="iv-sec">
              <h3 className="iv-h2">Linked work items{(issue.links || []).length > 0 && <em>{issue.links.length}</em>}</h3>
              <ul className="iv-kids">{(issue.links || []).map((l) => { const t = issues.find((x) => x.id === l.id); return <li key={l.type + l.id}><button type="button" onClick={() => onOpen(l.id)}><i className="iv-lk">{l.type}</i><code>{l.id}</code><b>{t?.title || l.id}</b><span className={`wl-st ${clsOf(t?.col)}`}>{cols.find(([c]) => c === t?.col)?.[1]}</span></button></li> })}</ul>
              <div className="iv-addrow"><select value={linkType} onChange={(e) => setLinkType(e.target.value)} aria-label="Link type">{['blocks', 'is blocked by', 'relates to', 'duplicates'].map((t) => <option key={t}>{t}</option>)}</select>
                <select value={linkTo} onChange={(e) => setLinkTo(e.target.value)} aria-label="Work item to link">{[['', 'Choose work item'], ...issues.filter((x) => x.id !== issue.id).map((x) => [x.id, `${x.id} ${x.title}`])].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                <button type="button" className="ci-btn" disabled={!linkTo} onClick={() => { patch(issue.id, { links: [...(issue.links || []), { type: linkType, id: linkTo }] }); setLinkTo(''); toast({ title: 'Linked', text: `${issue.id} ${linkType} ${linkTo}`, duration: 1800 }) }}>Link</button></div>
            </section>

            <section className="iv-sec">
              <h3 className="iv-h2">Attachments{(issue.files || []).length > 0 && <em>{issue.files.length}</em>}</h3>
              <ul className="iv-files">{(issue.files || []).map((f) => <li key={f.name}><FileText size={16} strokeWidth={1.75} aria-hidden="true" /><b>{f.name}</b><small>{f.size}</small><button type="button" aria-label={`Remove ${f.name}`} onClick={() => patch(issue.id, { files: issue.files.filter((x) => x.name !== f.name) })}><X size={14} strokeWidth={1.75} /></button></li>)}</ul>
              <label className="iv-drop"><Paperclip size={16} strokeWidth={1.75} aria-hidden="true" />Drop files or <u>browse</u><input type="file" multiple onChange={(e) => { const add = [...e.target.files].map((f) => ({ name: f.name, size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB` })); patch(issue.id, { files: [...(issue.files || []), ...add] }); e.target.value = '' }} /></label>
            </section>

            <section className="iv-sec">
              <h3 className="iv-h2">Activity</h3>
              <div className="su-seg" role="group" aria-label="Activity filter">{[['all', 'All'], ['comments', 'Comments'], ['work', 'Work log'], ['history', 'History']].map(([k, l]) => <button key={k} type="button" aria-pressed={feed === k} className={feed === k ? 'on' : ''} onClick={() => setFeed(k)}>{l}</button>)}</div>
              <div className="id-add iv-cm"><Av name={me} size={28} /><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" aria-label="Add a comment" onKeyDown={(e) => { if (e.key === 'Enter') postComment() }} /><button type="button" className="mp-btn primary" disabled={!comment.trim()} onClick={postComment}>Save</button></div>
              <ul className="iv-feed">{items.map((c, i) => <li key={i}><Av name={c.who} size={28} /><span><b>{c.who}</b> <small>{c.kind === 'comment' ? c.at : `${c.text.startsWith('logged') ? '' : ''}${c.at}`}</small>{c.kind === 'comment' ? <p>{c.text}</p> : <p className="mute">{c.text}</p>}</span></li>)}{items.length === 0 && <li className="iv-none">Nothing to show yet.</li>}</ul>
            </section>
          </div>

          <aside className="iv-side">
            <div className="iv-status">
              <StatusMenu issue={issue} cols={cols} clsOf={clsOf} patch={patch} onAddStatus={onAddStatus} onRenameStatus={onRenameStatus} />
              <Tag tone={PRIO[issue.prio]}>{issue.prio}</Tag>
            </div>

            <section className="iv-card">
              <h3>Details</h3>
              <Row label="Assignee"><div className="iv-as"><Av name={issue.who} /><select value={issue.who} onChange={(e) => patch(issue.id, { who: e.target.value })} aria-label="Assignee">{people.map((n) => <option key={n}>{n}</option>)}</select>{issue.who !== me && <button type="button" onClick={() => patch(issue.id, { who: me })}>Assign to me</button>}</div></Row>
              <Row label="Labels"><div className="iv-labs">{(issue.labels || []).map((l) => <span key={l} className="ci-tag">{l}<button type="button" aria-label={`Remove ${l}`} onClick={() => patch(issue.id, { labels: issue.labels.filter((x) => x !== l) })}><X size={10} strokeWidth={2.5} /></button></span>)}<input value={lab} onChange={(e) => setLab(e.target.value)} placeholder="Add labels" aria-label="Add labels" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addLabel() } }} onBlur={addLabel} /></div></Row>
              <Row label="Parent"><select value={issue.parent || ''} disabled={issue.type === 'epic'} onChange={(e) => patch(issue.id, { parent: e.target.value })} aria-label="Parent"><option value="">Add parent</option>{epics.map((x) => <option key={x.id} value={x.id}>{x.id} {x.title}</option>)}</select></Row>
              <Row label="Team"><select value={issue.team || ''} onChange={(e) => patch(issue.id, { team: e.target.value })} aria-label="Team"><option value="">Add team</option>{TEAMS.map((t) => <option key={t}>{t}</option>)}</select></Row>
              <Row label="Due date"><DateField value={issue.due || ''} onChange={(v) => patch(issue.id, { due: v })} empty="Set due date" /></Row>
              <Row label="Start date"><DateField value={issue.start || ''} onChange={(v) => patch(issue.id, { start: v })} empty="Set start date" /></Row>
              <Row label="Sprint"><select value={issue.sprint || ''} onChange={(e) => patch(issue.id, { sprint: e.target.value })} aria-label="Sprint">{sprints.map((s) => <option key={s} value={s}>{s || 'Backlog'}</option>)}</select></Row>
              <Row label="Work type"><select value={issue.type} onChange={(e) => patch(issue.id, { type: e.target.value })} aria-label="Work type">{Object.entries(ISSUE_TYPES).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></Row>
              <Row label="Priority"><select value={issue.prio} onChange={(e) => patch(issue.id, { prio: e.target.value })} aria-label="Priority">{PRIOS.map((p) => <option key={p}>{p}</option>)}</select></Row>
              <Row label="Story point estimate"><select value={issue.pts} onChange={(e) => patch(issue.id, { pts: +e.target.value })} aria-label="Story points">{[1, 2, 3, 5, 8, 13].map((n) => <option key={n}>{n}</option>)}</select></Row>
              <Row label="Watchers"><div className="iv-as"><Eye size={16} strokeWidth={1.75} aria-hidden="true" /><span>{(issue.watchers || []).length || 'No one'} watching</span><button type="button" onClick={() => patch(issue.id, { watchers: (issue.watchers || []).includes(me) ? issue.watchers.filter((n) => n !== me) : [...(issue.watchers || []), me] })}>{(issue.watchers || []).includes(me) ? 'Stop watching' : 'Watch'}</button></div></Row>
              <Row label="Reporter"><div className="iv-as"><Av name={me} /><span>{me}</span></div></Row>
            </section>

            <section className="iv-card">
              <h3>Time tracking</h3>
              <div className="iv-tt" role="img" aria-label={`${fmtDur(logged)} logged of ${est ? fmtDur(est) : 'no estimate'}`}><i className={logged > est && est ? 'over' : ''} style={{ width: `${est ? Math.min(100, (logged / est) * 100) : logged ? 100 : 0}%` }} /></div>
              <div className="iv-ttn"><span><b>{fmtDur(logged)}</b> logged</span><span>{est ? <><b>{fmtDur(remaining)}</b> remaining</> : 'No estimate'}</span></div>
              <Row label="Original estimate"><input placeholder="e.g. 2d 4h" aria-label="Original estimate" onBlur={(e) => { const m = parseDur(e.target.value); if (m !== null) patch(issue.id, { est: m }); else if (!e.target.value) patch(issue.id, { est: 0 }) }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} defaultValue={est ? fmtDur(est) : ''} key={est} /></Row>
              <button type="button" className="iv-logbtn" onClick={() => setLog(true)}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Log work</button>
              {(issue.worklog || []).length > 0 && <ul className="iv-wl">{issue.worklog.slice(0, 4).map((w, i) => <li key={i}><b>{fmtDur(w.min)}</b><span>{w.who.split(' ')[0]} · {w.date}</span></li>)}</ul>}
            </section>

            <section className="iv-card">
              <button type="button" className="iv-ch" aria-expanded={openBlocks.dev} onClick={() => setOpenBlocks((o) => ({ ...o, dev: !o.dev }))}><ChevronDown size={16} strokeWidth={1.75} className={openBlocks.dev ? '' : 'shut'} aria-hidden="true" />Development</button>
              {openBlocks.dev && (
                <ul className="iv-links">
                  <li><button type="button" onClick={() => toast({ title: 'Connect development tools', text: 'Link GitHub or GitLab from Space settings.', duration: 2600 })}><Plug size={16} strokeWidth={1.75} aria-hidden="true" />Connect development tools</button></li>
                  <li><button type="button" onClick={() => toast({ title: 'Open in coding tool', text: `Opening ${issue.id} in your editor…`, duration: 2000 })}><SquareTerminal size={16} strokeWidth={1.75} aria-hidden="true" />Open in coding tool</button></li>
                  <li><button type="button" onClick={() => { const b = `feature/${issue.id}-${slug(issue.title)}`; navigator.clipboard?.writeText(b); toast({ title: 'Branch name copied', text: b, duration: 3000 }) }}><GitBranch size={16} strokeWidth={1.75} aria-hidden="true" />Create branch</button></li>
                  <li><button type="button" onClick={() => { const m = `${issue.id} ${issue.title}`; navigator.clipboard?.writeText(m); toast({ title: 'Commit message copied', text: m, duration: 3000 }) }}><GitCommitHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />Create commit</button></li>
                </ul>
              )}
            </section>
            <section className="iv-card">
              <button type="button" className="iv-ch" aria-expanded={openBlocks.auto} onClick={() => setOpenBlocks((o) => ({ ...o, auto: !o.auto }))}><ChevronDown size={16} strokeWidth={1.75} className={openBlocks.auto ? '' : 'shut'} aria-hidden="true" />Automation<Bot size={14} strokeWidth={1.75} aria-hidden="true" /></button>
              {openBlocks.auto && <div className="iv-runs"><div><b>Recent rule runs</b><button type="button" onClick={() => toast({ title: 'No new runs', duration: 1600 })}><RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />Refresh</button></div><p>Refresh to see recent runs.</p></div>}
            </section>
            <p className="iv-meta">Created {issue.created || 'today'} · Updated just now</p>
          </aside>
        </div>
      </div>
      {log && <LogWorkDialog issue={issue} project={project} who={me} onSave={saveLog} onClose={() => setLog(false)} />}
    </div>
  )
}
