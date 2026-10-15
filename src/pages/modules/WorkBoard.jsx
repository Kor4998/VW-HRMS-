import { useState } from 'react'
import { ArrowLeft, ArrowRight, MessageCircle, Plus } from 'lucide-react'
import { toast } from '@/components/toast'
import Avatar, { AvatarGroup } from '@/components/Avatar'

const COLS = [['planned', 'Planned'], ['doing', 'In progress'], ['review', 'Review'], ['done', 'Done']]
const ME = 'Venkatesh Korlapati'

const SEED = [
  ['HRMS', 'Map the first-run journey', 'planned', 'Today', ME, 3],
  ['VoltusFreight', 'Refine shipment tracking tokens', 'doing', 'Thu', 'Charla Venkatesh', 5],
  ['Wehouse', 'Prototype pick-list motion', 'doing', 'Fri', 'Saisaankhya Katari', 2],
  ['HRMS', 'Accessibility pass', 'review', 'Today', ME, 7],
  ['SAP Test Assurance', 'Publish test summary notes', 'done', 'Oct 14', 'Diviti Tejesh', 2],
  ['BlueLine', 'Write empty state copy', 'done', 'Tomorrow', 'Diviti Tejesh', 1],
].map(([project, title, col, due, who, c], i) => ({ id: i, project, title, col, due, who, c }))

// Cross-project kanban: planned → in progress → review → done, move with the arrows, All work / My work, add a task.
export default function WorkBoard() {
  const [tasks, setTasks] = useState(SEED)
  const [mine, setMine] = useState(false)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const move = (id, d) => setTasks((l) => l.map((t) => { if (t.id !== id) return t; const i = COLS.findIndex(([k]) => k === t.col) + d; return COLS[i] ? { ...t, col: COLS[i][0] } : t }))
  const add = () => {
    if (draft.trim()) { setTasks((l) => [...l, { id: Date.now(), project: 'HRMS', title: draft.trim(), col: 'planned', due: 'This week', who: ME, c: 0 }]); toast({ title: 'Task added', text: 'It is in Planned.' }) }
    setDraft(''); setAdding(false)
  }
  const shown = tasks.filter((t) => !mine || t.who === ME)
  const done = tasks.filter((t) => t.col === 'done').length
  const people = [...new Set(tasks.map((t) => t.who))].slice(0, 3)

  return (
    <section className="wb" aria-label="Product work board">
      <header className="wb-head">
        <div><h2>Product work</h2><p>{done} of {tasks.length} done this sprint</p></div>
        <div className="wb-tools">
          <AvatarGroup names={people} max={4} size={28} onAdd={() => toast({ title: 'Invite people', text: 'Pick teammates from the directory to add them to this board.', duration: 2400 })} addLabel="Add people to this board" />
          <div className="su-seg" role="group" aria-label="Scope">{[[false, 'All work'], [true, 'My work']].map(([v, l]) => <button key={l} type="button" aria-pressed={mine === v} className={mine === v ? 'on' : ''} onClick={() => setMine(v)}>{l}</button>)}</div>
          <button type="button" className="mp-btn" onClick={() => setAdding(true)}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />Add task</button>
        </div>
      </header>
      <div className="wb-prog" role="img" aria-label={`${done} of ${tasks.length} done`}><i style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} /></div>
      <div className="wb-cols">
        {COLS.map(([k, label], ci) => {
          const col = shown.filter((t) => t.col === k)
          return (
            <div key={k} className="wb-col" role="group" aria-label={label}>
              <h3>{label}<em>{col.length}</em></h3>
              <div className="wb-lane">
                {k === 'planned' && adding && <input className="pj-new" autoFocus value={draft} placeholder="What needs doing?" aria-label="New task" onChange={(e) => setDraft(e.target.value)} onBlur={add} onKeyDown={(e) => { if (e.key === 'Enter') add(); if (e.key === 'Escape') { setDraft(''); setAdding(false) } }} />}
                {col.map((t) => (
                  <article key={t.id} className="wb-card">
                    <div className="wb-top"><span>{t.project}</span><time className={t.due === 'Today' ? 'hot' : ''}>{t.due}</time></div>
                    <b>{t.title}</b>
                    <div className="wb-bot">
                      <Avatar name={t.who} size={24} />
                      <span><MessageCircle size={14} strokeWidth={1.75} aria-hidden="true" />{t.c}</span>
                      <span className="wb-mv">
                        <button type="button" aria-label={`Move “${t.title}” back`} disabled={ci === 0} onClick={() => move(t.id, -1)}><ArrowLeft size={14} strokeWidth={1.75} /></button>
                        <button type="button" aria-label={`Move “${t.title}” forward`} disabled={ci === COLS.length - 1} onClick={() => move(t.id, 1)}><ArrowRight size={14} strokeWidth={1.75} /></button>
                      </span>
                    </div>
                  </article>
                ))}
                {col.length === 0 && !(k === 'planned' && adding) && <p className="wb-none">Nothing here</p>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
