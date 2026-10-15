import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import './modal.css'

// Untitled UI "Modal": fixed-width card (640, radius 2xl) over a dimmed overlay, header + content + footer actions.
export default function Modal({ open, title, onClose, children, footer, width = 640 }) {
  const box = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const prev = document.activeElement
    box.current?.focus()
    const key = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); prev?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="ov-scrim md-scrim" onMouseDown={onClose}>
      <div className="md" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={box} style={{ width }} onMouseDown={(e) => e.stopPropagation()}>
        <header><h2>{title}</h2><button type="button" className="ov-x" aria-label="Close" onClick={onClose}><X size={20} strokeWidth={1.75} /></button></header>
        <div className="md-b">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  )
}
