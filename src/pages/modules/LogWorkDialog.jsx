import { useEffect, useRef, useState } from 'react'
import { Clock, X } from 'lucide-react'
import { ISSUE_TYPES } from './CreateIssue'
import { parseDur, fmtDur } from './issueTime'
import DateField from '@/components/DateField'
import '@/components/modal.css'

const today = () => new Date().toLocaleDateString('en-CA')
// the work is placed on the timesheet timeline at this time; by default the last quarter hour, kept inside the 08:00 - 19:00 grid
const defaultStart = () => { const n = new Date(); const m = Math.floor((n.getHours() * 60 + n.getMinutes()) / 15) * 15; return Math.min(19 * 60, Math.max(8 * 60, m)) }
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const TIMES = Array.from({ length: 96 }, (_, i) => { const m = i * 15; const h = Math.floor(m / 60); return [toHHMM(m), `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`] })
const fromHHMM = (t) => { const [h, m] = String(t).split(':').map(Number); return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null }
const CHIPS = ['30m', '1h', '2h', '4h', '1d']

// Jira-style "Log time" dialog: names the work item at the top, asks how long the person worked, and hands the entry back
// to be saved on the work item (and therefore on the timesheet).
export default function LogWorkDialog({ issue, project, onSave, onClose, skipLabel = 'Cancel' }) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState(today)
  const [startAt, setStartAt] = useState(() => toHHMM(defaultStart()))
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const box = useRef(null)
  const [tl, TI] = ISSUE_TYPES[issue.type] || ISSUE_TYPES.task
  const est = issue.est || 0
  const logged = issue.logged || 0
  const min = parseDur(time)
  const after = est ? Math.max(0, est - logged - (min || 0)) : null

  useEffect(() => {
    const prev = document.activeElement
    box.current?.querySelector('input')?.focus()
    const key = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); prev?.focus?.() }
  }, [onClose])

  const save = () => {
    if (!min) { setErr('Enter the time you worked, like 2h 30m, 1d or 45m'); return }
    onSave({ min, date, text: text.trim(), start: fromHHMM(startAt) ?? undefined })
  }

  return (
    <div className="ov-scrim md-scrim" onMouseDown={onClose}>
      <div className="md ci lw" role="dialog" aria-modal="true" aria-label={`Log work on ${issue.id}`} tabIndex={-1} ref={box} onMouseDown={(e) => e.stopPropagation()} style={{ width: 560 }}>
        <div className="ci-top">
          <span className="ci-proj">{project?.key}</span>
          <span className="ci-sep" />
          <span className="lw-title"><Clock size={16} strokeWidth={1.75} aria-hidden="true" />Log work</span>
          <button type="button" className="ov-x" aria-label="Close" onClick={onClose}><X size={20} strokeWidth={1.75} /></button>
        </div>
        <div className="ci-body">
          <div className="lw-issue"><TI size={16} strokeWidth={1.75} className={`ty-${issue.type}`} aria-hidden="true" /><b>{issue.id}</b><span>{issue.title}</span><em>{tl}</em></div>
          <div className="lw-sum"><span>Estimate <b>{est ? fmtDur(est) : 'Not set'}</b></span><span>Logged <b>{fmtDur(logged)}</b></span><span>Remaining <b>{est ? fmtDur(Math.max(0, est - logged)) : '—'}</b></span></div>
          <label className="lw-f"><span>Time spent <i>*</i></span>
            <input value={time} onChange={(e) => { setTime(e.target.value); setErr('') }} name="timeSpent" autoComplete="off" spellCheck={false} placeholder="e.g. 2h 30m…" aria-invalid={!!err} onKeyDown={(e) => { if (e.key === 'Enter') save() }} />
          </label>
          <div className="lw-chips">{CHIPS.map((c) => <button key={c} type="button" onClick={() => { setTime(c); setErr('') }}>{c}</button>)}</div>
          {err && <em className="ci-err" role="alert">{err}</em>}
          <div className="lw-row">
            <div className="lw-f" role="group" aria-label="Date started"><span aria-hidden="true">Date started</span><DateField value={date} onChange={setDate} /></div>
            <label className="lw-f"><span>Started at</span><select name="startedAt" value={startAt} onChange={(e) => setStartAt(e.target.value)}>{TIMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          </div>
          <label className="lw-f"><span>Work description</span><textarea name="workDescription" autoComplete="off" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you work on?" /></label>
          <p className="ci-hint">{min ? (est ? <>Remaining estimate will become <b>{fmtDur(after)}</b>. </> : null) : null}Saved on {issue.id}, shown on the project timesheet at {startAt}.</p>
        </div>
        <footer className="ci-foot">
          <button type="button" className="ci-ghost" onClick={onClose}>{skipLabel}</button>
          <button type="button" className="ci-btn" onClick={save}>Save</button>
        </footer>
      </div>
    </div>
  )
}
