import { FileText } from 'lucide-react'
import './activity.css'

// Untitled UI "Activity feed": avatar with status dot, name + time, action text with brand links, optional
// file card, message bubble, tag chips and an unread dot. items: [{ id, name, ini, tone, status, time, text(JSX), file, message, tags, unread }]
export default function ActivityFeed({ items, connector = false }) {
  return (
    <ul className={connector ? 'af af-conn' : 'af'}>
      {items.map((it) => (
        <li key={it.id}>
          <span className={`af-av ${it.tone || 'blue'}`}>{it.ini}<i className={it.status === 'online' ? 'on' : ''} /></span>
          <div className="af-b">
            <p><b>{it.name}</b><small>{it.time}</small></p>
            <p className="af-t">{it.text}</p>
            {it.file && <div className="af-file"><span className="af-fi"><FileText size={32} strokeWidth={1} /><em className={it.file.type}>{it.file.type.toUpperCase()}</em></span><div><b>{it.file.name}</b><small>{it.file.size}</small></div></div>}
            {it.message && <div className="af-msg">{it.message}</div>}
            {it.tags && <div className="af-tags">{it.tags.map(([t, c]) => <span key={t} className={c}>{t}</span>)}</div>}
          </div>
          {it.unread && <i className="af-dot" aria-label="Unread" />}
        </li>
      ))}
    </ul>
  )
}
export const afLink = (t) => <a className="af-l" href="#" onClick={(e) => e.preventDefault()}>{t}</a>
