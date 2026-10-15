import { useEffect, useRef, useState } from 'react'

const pad = (n) => String(n).padStart(2, '0')
const NAMES = { d: 'days', h: 'hours', m: 'minutes', s: 'seconds' }

// One rolling digit: a 0-9 column that slides to the current value, feathered top and bottom.
function Wheel({ d }) {
  return (
    <span className="cd-wheel" aria-hidden="true">
      <span className="cd-col" style={{ transform: `translateY(${-d * 10}%)` }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <i key={n}>{n}</i>)}
      </span>
    </span>
  )
}

function spoken(shown, val, left) {
  const one = { d: 'day', h: 'hour', m: 'minute', s: 'second' }
  return shown
    .filter((u) => !(u === 's' && left >= 60) && val[u] > 0)
    .map((u) => `${val[u]} ${one[u]}${val[u] === 1 ? '' : 's'}`)
    .join(' ') || 'less than a minute'
}

// Arc-style countdown: rolling digits to a fixed moment, then a "live" state at zero.
// target: Date | ms. units: any of d,h,m,s (the largest unit absorbs the rest). variant: 'compact' | 'large'.
export default function Countdown({ target, units = ['d', 'h', 'm', 's'], variant = 'compact', sep = ':', label = 'Time remaining', completeLabel = 'Live now', onComplete, className = '' }) {
  const end = +new Date(target)
  const [now, setNow] = useState(() => Date.now())
  const fired = useRef(false)

  useEffect(() => {
    let t
    const tick = () => { setNow(Date.now()); t = setTimeout(tick, 1000 - (Date.now() % 1000) + 5) }
    tick()
    return () => clearTimeout(t)
  }, [])

  const left = Math.max(0, Math.floor((end - now) / 1000))
  useEffect(() => {
    if (left === 0 && !fired.current) { fired.current = true; onComplete?.() }
  }, [left, onComplete])

  if (left === 0) {
    return <span className={`cd cd-${variant} cd-done ${className}`} role="timer" aria-label={label}><i className="cd-live" aria-hidden="true" />{completeLabel}</span>
  }

  let rest = left
  const val = {}
  if (units.includes('d')) { val.d = Math.floor(rest / 86400); rest -= val.d * 86400 }
  if (units.includes('h')) { val.h = Math.floor(rest / 3600); rest -= val.h * 3600 }
  if (units.includes('m')) { val.m = Math.floor(rest / 60); rest -= val.m * 60 }
  if (units.includes('s')) val.s = rest
  let shown = units.filter((u) => val[u] !== undefined)
  if (variant === 'compact') { while (shown.length > 2 && val[shown[0]] === 0) shown = shown.slice(1) }

  return (
    <span className={`cd cd-${variant} ${className}`} role="timer" aria-label={label}>
      <span className="sr-only">{spoken(shown, val, left)}</span>
      {shown.map((u, i) => {
        const s = i === 0 && sep !== ':' ? String(val[u]) : pad(val[u])
        return (
          <span key={u} className="cd-unit" aria-hidden="true">
            {i > 0 && variant === 'compact' && sep.trim() && <b className="cd-sep">{sep}</b>}
            <span className="cd-digits">{[...s].map((ch, k) => <Wheel key={k} d={+ch} />)}</span>
            <span className="cd-u">{variant === 'large' ? NAMES[u] : u}</span>
          </span>
        )
      })}
    </span>
  )
}
