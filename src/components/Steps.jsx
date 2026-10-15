import { Check } from 'lucide-react'
import './steps.css'

// Untitled UI "Progress steps · progress icons with text" (vertical): done = filled check, current = ringed dot,
// upcoming = faint dot, 2px connector. steps: [{ title, text, state: 'done' | 'current' | 'todo' }]
export default function Steps({ steps, label = 'Progress' }) {
  return (
    <ol className="st" aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.title} className={`st-${s.state}`} aria-current={s.state === 'current' ? 'step' : undefined}>
          <span className="st-ic" aria-hidden="true">{s.state === 'done' ? <Check size={14} strokeWidth={3} /> : <i />}</span>
          {i < steps.length - 1 && <span className="st-line" aria-hidden="true" />}
          <div><b>{s.title}</b><small>{s.text}</small></div>
        </li>
      ))}
    </ol>
  )
}
