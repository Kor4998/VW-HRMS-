import { useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, ArrowDown, ArrowUp, Search } from 'lucide-react'
import './overlays.css'

// Untitled UI "Command bar": search row, grouped results with shortcuts, keyboard footer.
// groups: [{ title, items: [{ id, label, icon, hint, run }] }]
export default function CommandMenu({ open, onClose, groups }) {
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const input = useRef(null)
  const list = useRef(null)

  const flat = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => !needle || `${i.label} ${g.title} ${i.keywords || ''}`.toLowerCase().includes(needle)) }))
      .filter((g) => g.items.length)
  }, [groups, q])
  const items = flat.flatMap((g) => g.items)

  useEffect(() => {
    if (open) { setQ(''); setIdx(0); setTimeout(() => input.current?.focus(), 0) }
  }, [open])
  useEffect(() => { setIdx(0) }, [q])
  useEffect(() => { list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) }, [idx])

  if (!open) return null
  const run = (item) => { onClose(); item?.run?.() }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); run(items[idx]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  return (
    <div className="ov-scrim ov-cmd-scrim" onMouseDown={onClose}>
      <div className="ov-cmd" role="dialog" aria-modal="true" aria-label="Command menu" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="ov-cmd-s">
          <Search size={20} strokeWidth={1.75} aria-hidden="true" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages and actions" aria-label="Search pages and actions" role="combobox" aria-expanded="true" aria-controls="ov-cmd-list" />
          <kbd>esc</kbd>
        </div>
        <div className="ov-cmd-l" id="ov-cmd-list" role="listbox" ref={list}>
          {flat.length === 0 && <p className="ov-cmd-none">No results for “{q}”.</p>}
          {flat.map((g) => (
            <div key={g.title} role="group" aria-label={g.title}>
              <div className="ov-cmd-g">{g.title}</div>
              {g.items.map((it) => {
                const me = items.indexOf(it)
                const Ico = it.icon
                return (
                  <button key={it.id} type="button" role="option" aria-selected={idx === me} className={idx === me ? 'ov-cmd-i on' : 'ov-cmd-i'} onMouseMove={() => setIdx(me)} onClick={() => run(it)}>
                    {Ico && <Ico size={18} strokeWidth={1.75} aria-hidden="true" />}
                    <span>{it.label}</span>
                    {it.hint && <kbd>{it.hint}</kbd>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="ov-cmd-f">
          <span><kbd><ArrowUp size={12} strokeWidth={2} /></kbd><kbd><ArrowDown size={12} strokeWidth={2} /></kbd>to navigate</span>
          <span><kbd><CornerDownLeft size={12} strokeWidth={2} /></kbd>to select</span>
          <span><kbd>esc</kbd>to close</span>
        </div>
      </div>
    </div>
  )
}
