import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Moon, Sun } from 'lucide-react'
import { useBranding } from '@/components/branding'
import AuthPanel from './AuthPanel'
import './Login.css'

function getInitialTheme() {
  try {
    const v = localStorage.getItem('hrms-theme') || localStorage.getItem('theme')
    return v === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export default function Login({ onLogin, startView = 'signin' }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const toggleTheme = () =>
    setTheme((cur) => {
      const next = cur === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('hrms-theme', next); localStorage.setItem('theme', next); localStorage.setItem('hrms-theme-mode', 'manual') } catch { /* ignore */ }
      return next
    })
  const brand = useBranding()
  const slides = brand.slides
  const [index, setIndex] = useState(0)
  const cur = Math.min(index, slides.length - 1)
  const go = (d) => setIndex((i) => (Math.min(i, slides.length - 1) + d + slides.length) % slides.length)

  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (!brand.autoplay || paused || slides.length < 2) return undefined
    const t = setInterval(() => go(1), brand.interval * 1000)
    return () => clearInterval(t)
  }, [brand.autoplay, brand.interval, paused, slides.length, index]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="login-page" data-theme={theme} data-layout={brand.layout}>
      <div className="login-shell" data-layout={brand.layout}>
        <section className="hero" aria-label="Login banner" data-transition={brand.transition} onMouseEnter={() => brand.pauseOnHover && setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => brand.pauseOnHover && setPaused(true)} onBlur={() => setPaused(false)}>
          <div className="stage">
            {slides.map((src, i) => (
              <img key={`${i}-${src.slice(-24)}`} src={src} alt={i === cur ? `Banner ${i + 1} of ${slides.length}` : ''} className={i === cur ? 'hero-img active' : 'hero-img'} />
            ))}
            {slides.length > 1 && (
              <div className="hero-content">
                <div className="dots" role="tablist" aria-label="Banner slides">
                  {slides.map((_, i) => (
                    <button key={i} type="button" role="tab" aria-selected={i === cur} aria-label={`Banner ${i + 1}`} className={i === cur ? 'dot active' : 'dot'} onClick={() => setIndex(i)} />
                  ))}
                </div>
                <div className="arrows">
                  <button type="button" aria-label="Previous banner" onClick={() => go(-1)}><ArrowLeft size={28} strokeWidth={1.5} aria-hidden="true" /></button>
                  <button type="button" aria-label="Next banner" onClick={() => go(1)}><ArrowRight size={28} strokeWidth={1.5} aria-hidden="true" /></button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="form-side">
          <AuthPanel logo={theme === 'dark' ? brand.logoDark : brand.logoLight} onLogin={onLogin} startView={startView} />
        </section>
      </div>

      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun size={20} strokeWidth={1.75} aria-hidden="true" /> : <Moon size={20} strokeWidth={1.75} aria-hidden="true" />}
      </button>
    </main>
  )
}
