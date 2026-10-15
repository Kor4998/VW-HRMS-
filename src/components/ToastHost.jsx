import { useEffect, useState } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import './overlays.css'

const ICONS = { success: CircleCheck, info: Info, brand: Info, warn: TriangleAlert, error: CircleAlert }

// Untitled UI "Alert - Floating": featured icon, title, supporting text, Dismiss + optional action.
export default function ToastHost() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const on = (e) => {
      const id = Date.now() + Math.random()
      setItems((l) => [...l.slice(-2), { id, tone: 'success', ...e.detail }])
      // duration 0 keeps the toast until it is dismissed
      if (e.detail.duration !== 0) setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), e.detail.duration ?? 5000)
    }
    window.addEventListener('hrms-toast', on)
    return () => window.removeEventListener('hrms-toast', on)
  }, [])

  const close = (id) => setItems((l) => l.filter((x) => x.id !== id))

  return (
    <div className="ov-toasts" aria-live="polite">
      {items.map((t) => {
        const Ico = ICONS[t.tone] || Info
        return (
          <div key={t.id} className={`ov-toast ${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
            <span className="ov-fi"><Ico size={20} strokeWidth={1.75} aria-hidden="true" /></span>
            <div className="ov-toast-b">
              <b>{t.title}</b>
              {t.text && <p>{t.text}</p>}
              <div className="ov-toast-a">
                <button type="button" onClick={() => close(t.id)}>Dismiss</button>
                {t.action && <button type="button" className="link" onClick={() => { t.action.run?.(); close(t.id) }}>{t.action.label}</button>}
              </div>
            </div>
            <button type="button" className="ov-x" aria-label="Close" onClick={() => close(t.id)}><X size={18} strokeWidth={1.75} /></button>
          </div>
        )
      })}
    </div>
  )
}
