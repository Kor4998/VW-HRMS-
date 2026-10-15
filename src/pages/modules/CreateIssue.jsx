import { useEffect, useRef, useState } from 'react'
import { Bug, BookOpen, CalendarDays, Clock, Flag, GitBranch, Layers, ListChecks, SquareCheck, Tag as TagIcon, UserRound, X, Zap, Users } from 'lucide-react'
import { parseDur, fmtDur } from './issueTime'
import { SpaceGlyph } from '@/components/spaceIcons'
import '@/components/modal.css'
import DateField from '@/components/DateField'

export const ISSUE_TYPES = {
  epic: ['Epic', Zap, 'Big chunk of work that groups related stories and tasks.'],
  story: ['Story', BookOpen, 'A feature or requirement written from the user’s point of view.'],
  task: ['Task', SquareCheck, 'A piece of work that needs to be done.'],
  bug: ['Bug', Bug, 'Something that is broken and needs fixing.'],
  subtask: ['Subtask', GitBranch, 'A smaller step of a larger work item.'],
}
const PRIOS = ['Highest', 'High', 'Medium', 'Low']
const TEAMS = ['Engineering', 'Design', 'QA', 'Product', 'Support']

function Pill({ icon: I, label, children, active }) {
  return <label className={`ci-pill${active ? ' on' : ''}`}><I size={14} strokeWidth={1.75} aria-hidden="true" /><span className="sr-only">{label}</span>{children}</label>
}

// Jira-style "Create work item": project + type, summary, description, then field pills for
// assignee, labels, parent, sprint, due date, priority, estimate, points and team.
export default function CreateIssue({ open, onClose, project, people, epics, sprints, defaults, onCreate }) {
  const blank = { type: 'task', summary: '', desc: '', who: '', labels: [], parent: '', sprint: 'Sprint 1', due: '', prio: 'Medium', est: '', pts: 1, team: '', col: '' }
  const [f, setF] = useState(blank)
  const [lab, setLab] = useState('')
  const [another, setAnother] = useState(false)
  const [err, setErr] = useState('')
  const [ask, setAsk] = useState(false) // unsaved-changes guard
  const box = useRef(null)
  const stateRef = useRef({})
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))

  useEffect(() => {
    if (!open) return undefined
    setF({ ...blank, ...(defaults || {}) }); setErr(''); setLab('')
    box.current?.querySelector('.ci-sum')?.focus()
    const key = (e) => { if (e.key === 'Escape') { if (stateRef.current.ask) setAsk(false); else stateRef.current.close() } }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null
  // guard on leave ONLY when something was typed; "Keep editing" is the focused default
  const dirty = !!(f.summary.trim() || f.desc.trim() || f.labels.length || f.est || f.parent || f.due || f.who)
  const requestClose = () => (dirty ? setAsk(true) : onClose())
  stateRef.current = { ask, close: requestClose }
  const [tl, TI] = ISSUE_TYPES[f.type]
  const addLabel = () => { const v = lab.trim().replace(/\s+/g, '-'); if (v && !f.labels.includes(v)) set('labels', [...f.labels, v]); setLab('') }
  const estMin = parseDur(f.est)
  const submit = () => {
    if (!f.summary.trim()) { setErr('Summary is required'); return }
    if (f.est && estMin === null) { setErr('Estimate looks like 2h 30m, 1d or 1w 2d'); return }
    const made = onCreate({ ...f, summary: f.summary.trim(), est: estMin || 0, who: f.who || project.lead })
    if (another) { setF({ ...blank, type: f.type, sprint: f.sprint, who: f.who, team: f.team }); setErr(''); box.current?.querySelector('.ci-sum')?.focus(); return made }
    onClose()
    return made
  }

  return (
    <div className="ov-scrim md-scrim" onMouseDown={requestClose}>
      <div className="md ci" role="dialog" aria-modal="true" aria-label="Create work item" tabIndex={-1} ref={box} onMouseDown={(e) => e.stopPropagation()} style={{ width: 800 }}>
        <div className="ci-top">
          <span className="ci-proj"><i className={`pj-ic ${project.tone}`} style={{ width: 20, height: 20 }}><SpaceGlyph p={project} size={11} /></i>{project.key}</span>
          <span className="ci-sep" />
          <label className="ci-type"><TI size={16} strokeWidth={1.75} className={`ty-${f.type}`} aria-hidden="true" />
            <select value={f.type} aria-label="Work type" onChange={(e) => set('type', e.target.value)}>{Object.entries(ISSUE_TYPES).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
          </label>
          <button type="button" className="ov-x" aria-label="Close" onClick={requestClose}><X size={20} strokeWidth={1.75} /></button>
        </div>
        <div className="ci-body">
          <input className="ci-sum" value={f.summary} onChange={(e) => { set('summary', e.target.value); setErr('') }} placeholder={`What needs to be done? (${tl.toLowerCase()})`} aria-label="Summary" aria-invalid={!!err} onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
          {err && <em className="ci-err" role="alert">{err}</em>}
          <textarea className="ci-desc" rows={5} value={f.desc} onChange={(e) => set('desc', e.target.value)} placeholder="Add a description" aria-label="Description" />
          <p className="ci-hint">{ISSUE_TYPES[f.type][2]}</p>
          <div className="ci-pills">
            <Pill icon={UserRound} label="Assignee" active={!!f.who}><select value={f.who} onChange={(e) => set('who', e.target.value)}><option value="">Automatic</option>{people.map((n) => <option key={n}>{n}</option>)}</select></Pill>
            <Pill icon={Flag} label="Priority"><select value={f.prio} onChange={(e) => set('prio', e.target.value)}>{PRIOS.map((p) => <option key={p}>{p}</option>)}</select></Pill>
            <Pill icon={Layers} label="Sprint" active><select value={f.sprint} onChange={(e) => set('sprint', e.target.value)}>{sprints.map((s) => <option key={s} value={s}>{s || 'Backlog'}</option>)}</select></Pill>
            <Pill icon={Zap} label="Parent" active={!!f.parent}><select value={f.parent} onChange={(e) => set('parent', e.target.value)} disabled={f.type === 'epic'}><option value="">Parent</option>{epics.map((x) => <option key={x.id} value={x.id}>{x.id} {x.title}</option>)}</select></Pill>
            <Pill icon={Users} label="Team" active={!!f.team}><select value={f.team} onChange={(e) => set('team', e.target.value)}><option value="">Team</option>{TEAMS.map((t) => <option key={t}>{t}</option>)}</select></Pill>
            <Pill icon={CalendarDays} label="Due date" active={!!f.due}><DateField value={f.due} onChange={(v) => set('due', v)} empty="Due date" className="in-pill" /></Pill>
            <Pill icon={Clock} label="Original estimate" active={!!f.est}><input className="ci-est" value={f.est} onChange={(e) => set('est', e.target.value)} placeholder="Estimate (2h 30m)" /></Pill>
            <Pill icon={ListChecks} label="Story points" active><select value={f.pts} onChange={(e) => set('pts', +e.target.value)}>{[1, 2, 3, 5, 8, 13].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'point' : 'points'}</option>)}</select></Pill>
            <span className="ci-pill ci-lab"><TagIcon size={14} strokeWidth={1.75} aria-hidden="true" />{f.labels.map((l) => <span key={l} className="ci-tag">{l}<button type="button" aria-label={`Remove ${l}`} onClick={() => set('labels', f.labels.filter((x) => x !== l))}><X size={10} strokeWidth={2.5} /></button></span>)}
              <input value={lab} onChange={(e) => setLab(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addLabel() } }} onBlur={addLabel} placeholder={f.labels.length ? '' : 'Labels'} aria-label="Labels" /></span>
          </div>
          {estMin ? <p className="ci-hint">Original estimate: <b>{fmtDur(estMin)}</b> (1d = 8h, 1w = 5d)</p> : null}
        </div>
        {ask && (
          <div className="ci-guard" role="alertdialog" aria-modal="true" aria-labelledby="ci-guard-t" aria-describedby="ci-guard-d">
            <b id="ci-guard-t">Leave this work item?</b>
            <p id="ci-guard-d">Your changes to “{f.summary.trim() || 'this draft'}” will be discarded.</p>
            <div>
              <button type="button" className="ci-ghost" onClick={() => { setAsk(false); onClose() }}>Discard changes</button>
              <button type="button" className="ci-btn" autoFocus onClick={() => setAsk(false)}>Keep editing</button>
            </div>
          </div>
        )}
        <footer className="ci-foot">
          <label className="ci-another"><input type="checkbox" checked={another} onChange={(e) => setAnother(e.target.checked)} />Create another</label>
          <button type="button" className="ci-btn" onClick={submit}>Create</button>
        </footer>
      </div>
    </div>
  )
}
