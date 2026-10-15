import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './kit.css'

// Almost no tooltips: only icon-only delete / remove buttons. Everything else (sidebar, chevrons, bell, cards, charts, avatars, labelled
// buttons) stays quiet, and the browser's native title tooltips are dropped as soon as the pointer or focus reaches an element.
// Only icon-only buttons that destroy something (delete / remove / discard) get a tooltip, because a wrong click there costs the user.
const IMPORTANT = /^(delete|remove|discard|clear all)\b/i

export default function Tooltips() {
  const [tip, setTip] = useState(null)
  const cur = useRef(null)
  const box = useRef(null)
  const [pos, setPos] = useState(null)

  useEffect(() => {
    const hide = () => { cur.current = null; setTip(null); setPos(null) }
    const iconOnly = (n) => {
      const b = n.closest?.('button, a, [role="button"]')
      const name = b && (b.getAttribute('aria-label') || b.getAttribute('title'))
      return b && !b.textContent.trim() && name && IMPORTANT.test(name) ? b : null
    }
    const enter = (e) => {
      const named = e.target.closest?.('[title]')
      const b = iconOnly(e.target)
      const text = b && (b.getAttribute('aria-label') || b.getAttribute('title'))
      if (named) {
        // keep the accessible name when the native title goes away
        if (!named.getAttribute('aria-label') && !named.textContent.trim()) named.setAttribute('aria-label', named.getAttribute('title'))
        named.removeAttribute('title')
      }
      if (!b || cur.current === b) return
      cur.current = b
      setTip({ text, rect: b.getBoundingClientRect() })
    }
    const leave = (e) => { if (cur.current && !cur.current.contains(e.relatedTarget)) hide() }
    const focus = (e) => { if (e.target.matches?.(':focus-visible')) enter(e) }
    const esc = (e) => { if (e.key === 'Escape') hide() }
    document.addEventListener('mouseover', enter, true)
    document.addEventListener('mouseout', leave)
    document.addEventListener('focusin', focus, true)
    document.addEventListener('focusout', hide)
    document.addEventListener('mousedown', hide)
    document.addEventListener('scroll', hide, true)
    document.addEventListener('keydown', esc)
    return () => {
      hide()
      document.removeEventListener('mouseover', enter, true); document.removeEventListener('mouseout', leave)
      document.removeEventListener('focusin', focus, true); document.removeEventListener('focusout', hide)
      document.removeEventListener('mousedown', hide); document.removeEventListener('scroll', hide, true); document.removeEventListener('keydown', esc)
    }
  }, [])

  // place it once its size is known: centred on the control, flipped below when there is no room above, and always inside the viewport
  useLayoutEffect(() => {
    if (!tip || !box.current) return
    const m = 8
    const { width, height } = box.current.getBoundingClientRect()
    const r = tip.rect
    const left = Math.min(window.innerWidth - width - m, Math.max(m, r.left + r.width / 2 - width / 2))
    const above = r.top - height - 10
    const below = above < m
    setPos({ left, top: below ? Math.min(window.innerHeight - height - m, r.bottom + 10) : above, below, ax: Math.min(width - 14, Math.max(14, r.left + r.width / 2 - left)) })
  }, [tip])

  if (!tip) return null
  return <div ref={box} className={`kit-tip${pos?.below ? ' below' : ''}`} role="tooltip" style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, transform: 'none', '--ax': `${pos?.ax ?? 0}px`, visibility: pos ? 'visible' : 'hidden' }}>{tip.text}</div>
}
