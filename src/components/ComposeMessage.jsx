import { useRef, useState } from 'react'
import { Clock, Paperclip, Save, Trash2, X } from 'lucide-react'
import Modal from './Modal'
import { toast } from './toast'

const ini = (s) => s.replace(/@.*/, '').split(/[.\s_-]/).map((x) => x[0] || '').join('').slice(0, 2).toUpperCase()

// Untitled UI "Modal · New message": TO / CC chip inputs, subject, body, attachment chips, Send later + Send.
function Chips({ label, chips, setChips, auto }) {
  const [v, setV] = useState('')
  const add = () => { const t = v.trim().replace(/,$/, ''); if (t && /\S+@\S+/.test(t) && !chips.includes(t)) setChips([...chips, t]); setV('') }
  return (
    <div className="cm-row">
      <span>{label}</span>
      <div className="cm-chips">
        {chips.map((c) => <span key={c} className="cm-chip"><i>{ini(c)}</i>{c}<button type="button" aria-label={`Remove ${c}`} onClick={() => setChips(chips.filter((x) => x !== c))}><X size={12} strokeWidth={2} /></button></span>)}
        <input value={v} onChange={(e) => setV(e.target.value)} aria-label={label === 'TO' ? 'To' : 'Cc'} autoFocus={auto} onBlur={add} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } if (e.key === 'Backspace' && !v && chips.length) setChips(chips.slice(0, -1)) }} />
      </div>
    </div>
  )
}

export default function ComposeMessage({ open, onClose, to = [], from = 'Venkatesh Korlapati' }) {
  const [tos, setTos] = useState(to)
  const [ccs, setCcs] = useState([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState([])
  const pick = useRef(null)
  const reset = () => { setTos(to); setCcs([]); setSubject(''); setBody(''); setFiles([]) }
  const close = () => { reset(); onClose() }
  const send = (later) => { toast({ title: later ? 'Message scheduled' : 'Message sent', text: later ? 'It will go out tomorrow at 9:00 AM.' : `Sent to ${tos.join(', ')}.` }); close() }
  const dirty = subject || body || files.length

  return (
    <Modal open={open} title="New message" onClose={close} footer={(
      <>
        <label className="cm-from"><select value={from} aria-label="Send as" onChange={() => {}}><option>{from}</option></select></label>
        <div className="cm-ic">
          <button type="button" aria-label="Discard draft" onClick={() => { if (dirty) toast({ title: 'Draft discarded', duration: 2000 }); close() }}><Trash2 size={18} strokeWidth={1.75} /></button>
          <button type="button" aria-label="Save draft" onClick={() => toast({ title: 'Draft saved', duration: 2000 })}><Save size={18} strokeWidth={1.75} /></button>
          <button type="button" aria-label="Attach a file" onClick={() => pick.current?.click()}><Paperclip size={18} strokeWidth={1.75} /></button>
          <button type="button" aria-label="Schedule" onClick={() => send(true)} disabled={!tos.length || !subject}><Clock size={18} strokeWidth={1.75} /></button>
        </div>
        <button type="button" className="cm-later" disabled={!tos.length || !subject} onClick={() => send(true)}>Send later</button>
        <button type="button" className="mp-btn primary" disabled={!tos.length || !subject} onClick={() => send(false)}>Send</button>
        <input ref={pick} type="file" multiple hidden aria-label="Attach files" onChange={(e) => { setFiles((f) => [...f, ...[...e.target.files].map((x) => `${x.name} · ${Math.max(1, Math.round(x.size / 1024))} KB`)]); e.target.value = '' }} />
      </>
    )}>
      <Chips label="TO" chips={tos} setChips={setTos} auto />
      <Chips label="CC" chips={ccs} setChips={setCcs} />
      <input className="cm-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject" />
      <textarea className="cm-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Say hello" aria-label="Message" />
      {files.length > 0 && <div className="cm-files">{files.map((f) => <span key={f} className="cm-file"><Paperclip size={12} strokeWidth={1.75} />{f}<button type="button" aria-label={`Remove ${f}`} onClick={() => setFiles(files.filter((x) => x !== f))}><X size={12} strokeWidth={2} /></button></span>)}</div>}
    </Modal>
  )
}
