import { useEffect, useRef, useState } from 'react'

// Arc "Hold to confirm": a risky action needs a deliberate 1.2s press (pointer or Space/Enter) instead of one click.
export default function HoldButton({ children, onConfirm, hold = 1200, className = '', ...rest }) {
  const [p, setP] = useState(0)
  const raf = useRef(0)
  const t0 = useRef(0)
  const stop = () => { cancelAnimationFrame(raf.current); t0.current = 0; setP(0) }
  const tick = () => {
    const v = Math.min(1, (performance.now() - t0.current) / hold)
    setP(v)
    if (v >= 1) { t0.current = 0; setP(0); onConfirm?.(); return }
    raf.current = requestAnimationFrame(tick)
  }
  const start = () => { if (t0.current) return; t0.current = performance.now(); raf.current = requestAnimationFrame(tick) }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])
  return (
    <button
      type="button" className={`${className} hold`} {...rest}
      onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); start() } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') stop() }}
      onBlur={stop}
    >
      <i className="hold-fill" style={{ transform: `scaleX(${p})` }} aria-hidden="true" />
      <span className="hold-in">{p > 0 ? 'Keep holding…' : children}</span>
    </button>
  )
}
