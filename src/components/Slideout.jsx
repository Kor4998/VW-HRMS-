import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import './overlays.css'

// Untitled UI "Slideout menu": right-hand panel with header, scrolling body and sticky footer actions.
export default function Slideout({ open, title, desc, onClose, children, footer }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const prev = document.activeElement
    ref.current?.focus()
    const key = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); prev?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="ov-scrim ov-slide-scrim" onMouseDown={onClose}>
      <aside className="ov-slide" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onMouseDown={(e) => e.stopPropagation()}>
        <header>
          <div><h2>{title}</h2>{desc && <p>{desc}</p>}</div>
          <button type="button" className="ov-x" aria-label="Close panel" onClick={onClose}><X size={20} strokeWidth={1.75} /></button>
        </header>
        <div className="ov-slide-b">{children}</div>
        {footer && <footer>{footer}</footer>}
      </aside>
    </div>
  )
}
