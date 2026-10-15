import { useEffect, useRef, useState } from 'react'
import { CircleCheck, CloudUpload, FileText, Trash2, X } from 'lucide-react'
import './overlays.css'

const OK = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx']
const MAX = 5 * 1024 * 1024
const kb = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
const ext = (name) => (name.split('.').pop() || '').toLowerCase()

function Badge({ name }) {
  const e = ext(name)
  const tone = e === 'pdf' ? 'pdf' : e.startsWith('doc') ? 'doc' : 'img'
  return <span className="ov-file-ic"><FileText size={34} strokeWidth={1.25} aria-hidden="true" /><em className={tone}>{e.toUpperCase().slice(0, 4)}</em></span>
}

// Untitled UI "File upload": drag-and-drop base + file items with progress bar / complete / failed states.
// Uploads are simulated (no network); onComplete(file) fires when an item reaches 100%.
export default function FileUpload({ onComplete, onRemove, label = 'PDF, PNG, JPG or DOCX (max. 5 MB)' }) {
  const [items, setItems] = useState([])
  const [drag, setDrag] = useState(false)
  const input = useRef(null)

  useEffect(() => {
    const t = setInterval(() => {
      setItems((list) => list.map((it) => {
        if (it.status !== 'uploading') return it
        const progress = Math.min(100, it.progress + 8 + Math.random() * 14)
        if (progress >= 100) return { ...it, progress: 100, status: 'complete' }
        return { ...it, progress }
      }))
    }, 280)
    return () => clearInterval(t)
  }, [])

  // fire onComplete once per finished file, outside the state updater
  const told = useRef(new Set())
  useEffect(() => {
    items.forEach((it) => {
      if (it.status === 'complete' && !told.current.has(it.id)) { told.current.add(it.id); onComplete?.(it) }
    })
  }, [items, onComplete])

  const add = (files) => {
    const next = [...files].map((f) => {
      const bad = !OK.includes(ext(f.name)) || f.size > MAX
      return { id: Date.now() + Math.random(), name: f.name, size: f.size, progress: bad ? 0 : 4, status: bad ? 'failed' : 'uploading', reason: !OK.includes(ext(f.name)) ? 'File type not supported.' : f.size > MAX ? 'File is larger than 5 MB.' : '' }
    })
    setItems((l) => [...next, ...l])
  }
  const retry = (id) => setItems((l) => l.map((x) => (x.id === id ? { ...x, status: x.reason ? 'failed' : 'uploading', progress: x.reason ? 0 : 4 } : x)))
  const drop = (e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.length) add(e.dataTransfer.files) }

  return (
    <div className="ov-fu">
      <div
        className={drag ? 'ov-drop on' : 'ov-drop'} role="button" tabIndex={0}
        onClick={() => input.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click() } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={drop}
      >
        <span className="ov-fi"><CloudUpload size={20} strokeWidth={1.75} aria-hidden="true" /></span>
        <p><b>Click to upload</b> or drag and drop</p>
        <small>{label}</small>
        <input ref={input} type="file" multiple hidden aria-label="Upload files" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => { if (e.target.files?.length) add(e.target.files); e.target.value = '' }} />
      </div>

      {items.map((it) => (
        <div key={it.id} className={`ov-fitem ${it.status}`}>
          <Badge name={it.name} />
          <div className="ov-fitem-b">
            <b>{it.name}</b>
            <span>
              {it.status === 'uploading' && <>{kb((it.size * it.progress) / 100)} of {kb(it.size)} · Uploading…</>}
              {it.status === 'complete' && <>{kb(it.size)} · <i className="ok"><CircleCheck size={14} strokeWidth={1.75} aria-hidden="true" /> Complete</i></>}
              {it.status === 'failed' && <i className="bad"><X size={14} strokeWidth={1.75} aria-hidden="true" /> Failed{it.reason ? ` · ${it.reason}` : ''}</i>}
            </span>
            {it.status !== 'failed' && (
              <div className="ov-bar"><i style={{ '--w': `${it.progress}%` }} /><em>{Math.round(it.progress)}%</em></div>
            )}
            {it.status === 'failed' && !it.reason && <button type="button" className="ov-retry" onClick={() => retry(it.id)}>Try again</button>}
          </div>
          <button type="button" className="ov-x" aria-label={`Remove ${it.name}`} onClick={() => { setItems((l) => l.filter((x) => x.id !== it.id)); onRemove?.(it) }}><Trash2 size={16} strokeWidth={1.75} /></button>
        </div>
      ))}
    </div>
  )
}
