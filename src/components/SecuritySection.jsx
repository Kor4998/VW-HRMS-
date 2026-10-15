import { useMemo, useRef, useState } from 'react'
import { CircleCheck, Globe, Laptop, Lock, MapPin, Smartphone, Trash2, TriangleAlert } from 'lucide-react'

const APPS = [
  ['google', 'Google Authenticator'],
  ['microsoft', 'Microsoft Authenticator'],
]

const DEVICES = [
  { id: 1, icon: Globe, name: 'Edge on Windows', where: 'Hyderabad, India', status: 'Current session', current: true, online: true },
  { id: 2, icon: Smartphone, name: 'Safari on iPhone 15', where: 'Hyderabad, India', status: '2 hours ago', online: true },
  { id: 3, icon: Laptop, name: 'Chrome on MacBook Pro', where: 'Bengaluru, India', status: 'Yesterday' },
  { id: 4, icon: Globe, name: 'Chrome on Windows', where: 'Mumbai, India', status: '2 months ago' },
]

// Mock QR: three finder squares plus a stable pseudo-random fill. Purely visual.
function MockQR({ seed }) {
  const cells = useMemo(() => {
    const N = 25
    let s = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
    const out = []
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rnd() > 0.52) out.push([x, y])
    return out
  }, [seed])
  const finder = (x, y) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="currentColor" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="var(--sec-qr-bg)" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" />
    </g>
  )
  return (
    <svg viewBox="0 0 25 25" className="sec-qr" role="img" aria-label="QR code (demo)" shapeRendering="crispEdges">
      <rect width="25" height="25" fill="var(--sec-qr-bg)" />
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />)}
      {finder(0, 0)}{finder(18, 0)}{finder(0, 18)}
    </svg>
  )
}

function CodeBoxes({ value, onChange }) {
  const refs = useRef([])
  const set = (i, ch) => {
    const arr = value.padEnd(6, ' ').split('')
    arr[i] = ch || ' '
    onChange(arr.join('').trimEnd())
  }
  return (
    <div className="sec-code" role="group" aria-label="6-digit verification code">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          placeholder="0"
          aria-label={`Digit ${i + 1}`}
          value={(value[i] || '').trim()}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, '').slice(-1)
            set(i, ch)
            if (ch && i < 5) refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus() }}
          onPaste={(e) => {
            const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
            if (d) { e.preventDefault(); onChange(d); refs.current[Math.min(d.length, 5)]?.focus() }
          }}
        />
      ))}
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={checked ? 'sp-switch on' : 'sp-switch'} onClick={() => onChange(!checked)}>
      <i />
    </button>
  )
}

// 0-4: length, lower+upper, digit, symbol
function strengthOf(pw) {
  let n = 0
  if (pw.length >= 8) n++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) n++
  if (/\d/.test(pw)) n++
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 10) n++
  return n
}
const STRENGTH = ['Too weak', 'Weak', 'Fair', 'Good', 'Very secure']

export default function SecuritySection() {
  const [on, setOn] = useState({ app: true, okta: false, sms: false, email: false })
  const [pending, setPending] = useState('app') // 'app' | 'okta' while the QR set-up panel is open
  const [provider, setProvider] = useState('google')
  const [code, setCode] = useState('')
  const [note, setNote] = useState('')
  const [guide, setGuide] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [flash, setFlash] = useState(false)
  const [devices, setDevices] = useState(DEVICES)
  const [editing, setEditing] = useState(false)
  const [pw, setPw] = useState({ cur: '', next: '', again: '' })
  const [pwDone, setPwDone] = useState('17 July 2026')
  const twofaRef = useRef(null)

  const methods = Object.values(on).filter(Boolean).length
  const score = Math.min(100, 50 + (methods > 0 ? 30 : 0) + (methods > 1 ? 10 : 0) + 10)
  const strength = strengthOf(pw.next)
  const pwValid = pw.cur.length > 0 && strength >= 3 && pw.next === pw.again && pw.next !== pw.cur

  const toggle = (key, v) => {
    setNote('')
    if (!v) {
      setOn((o) => ({ ...o, [key]: false }))
      if (pending === key) setPending(null)
      return
    }
    if (key === 'app' || key === 'okta') { setPending(key); setCode(''); return }
    setOn((o) => ({ ...o, [key]: true }))
  }
  const verify = () => {
    setOn((o) => ({ ...o, [pending]: true }))
    setNote(pending === 'okta' ? 'Okta Verify is now enabled.' : `${APPS.find((a) => a[0] === provider)[1]} is now enabled.`)
    setPending(null)
    setCode('')
  }
  const review = () => {
    twofaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlash(true)
    setTimeout(() => setFlash(false), 1600)
  }
  const savePassword = () => {
    setPwDone('just now')
    setEditing(false)
    setPw({ cur: '', next: '', again: '' })
    setNote('Password updated. Other devices will be asked to sign in again.')
  }

  const appName = pending === 'okta' ? 'Okta Verify' : APPS.find((a) => a[0] === provider)[1]
  const showToggle = (key) => on[key] || pending === key
  const others = devices.filter((d) => !d.current)

  return (
    <div className="sec">
      {!dismissed && (
        <div className="sec-banner">
          {score >= 90 ? <Lock size={18} strokeWidth={1.75} aria-hidden="true" /> : <TriangleAlert size={18} strokeWidth={1.75} aria-hidden="true" />}
          <div className="sec-banner-t">
            <b>Your account security is {score}%</b>
            <p>Review your security settings regularly and update your password when anything looks off.</p>
          </div>
          <div className="sec-banner-a">
            <button type="button" className="sp-btn" onClick={() => setDismissed(true)}>Dismiss</button>
            <button type="button" className="sp-btn primary" onClick={review}>Review security</button>
          </div>
        </div>
      )}

      <h3 className="sec-h">Basics</h3>

      <div className={editing ? 'sec-row top' : 'sec-row'}>
        <div className="sec-l"><b>Password</b><p>Last updated {pwDone}.</p></div>
        <div className="sec-r">
          {!editing ? (
            <div className="sec-pw">
              <span className="sec-dots" aria-label="Password hidden">••••••••••••••••••</span>
              <span className="sec-ok"><CircleCheck size={16} strokeWidth={1.75} aria-hidden="true" />Very secure</span>
              <button type="button" className="sp-btn" onClick={() => { setEditing(true); setNote('') }}>Edit</button>
            </div>
          ) : (
            <form className="sec-pwform" onSubmit={(e) => { e.preventDefault(); if (pwValid) savePassword() }}>
              <label><span>Current password</span><input className="sp-input" type="password" autoComplete="current-password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} /></label>
              <label><span>New password</span><input className="sp-input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
              <div className="sec-meter" aria-live="polite">
                <span className="bars">{[1, 2, 3, 4].map((n) => <i key={n} className={pw.next && strength >= n ? `on s${strength}` : ''} />)}</span>
                <small>{pw.next ? STRENGTH[strength] : 'Use 10+ characters with upper and lower case, a number and a symbol.'}</small>
              </div>
              <label><span>Confirm new password</span><input className="sp-input" type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} aria-invalid={!!pw.again && pw.again !== pw.next} /></label>
              {pw.again && pw.again !== pw.next && <small className="sec-err">Passwords do not match.</small>}
              <div className="sec-setup-foot">
                <button type="button" className="sp-btn" onClick={() => { setEditing(false); setPw({ cur: '', next: '', again: '' }) }}>Cancel</button>
                <button type="submit" className="sp-btn primary" disabled={!pwValid}>Update password</button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className={flash ? 'sec-row top flash' : 'sec-row top'} ref={twofaRef}>
        <div className="sec-l"><b>Two-step verification</b><p>We recommend requiring a verification code in addition to your password.</p></div>
        <div className="sec-r">
          <ul className="sec-methods">
            <li><Toggle label="Authenticator app" checked={showToggle('app')} onChange={(v) => toggle('app', v)} /><span>Authenticator app<small>Google Authenticator or Microsoft Authenticator</small></span></li>
            <li><Toggle label="Okta Verify" checked={showToggle('okta')} onChange={(v) => toggle('okta', v)} /><span>Okta Verify<small>Push or code from the Okta Verify app</small></span></li>
            <li><Toggle label="Phone number" checked={on.sms} onChange={(v) => toggle('sms', v)} /><span>Phone number<small>Text message to +91 ••••• ••210</small></span></li>
            <li><Toggle label="Email address" checked={on.email} onChange={(v) => toggle('email', v)} /><span>Email address<small>k•••••••.v•••••••@voltuswave.com</small></span></li>
          </ul>

          {note && <p className="sec-note" role="status"><CircleCheck size={16} strokeWidth={1.75} aria-hidden="true" />{note}</p>}

          {pending && (
            <div className="sec-setup">
              <div className="sec-setup-top">
                {pending === 'app' ? (
                  <div className="sp-seg" role="group" aria-label="Authenticator app">
                    {APPS.map(([k, label]) => (
                      <button key={k} type="button" aria-pressed={provider === k} className={provider === k ? 'on' : ''} onClick={() => setProvider(k)}>{label}</button>
                    ))}
                  </div>
                ) : <span />}
                <button type="button" className="sp-btn" aria-expanded={guide} onClick={() => setGuide((g) => !g)}>View guide</button>
              </div>
              <div className="sec-setup-body">
                <MockQR seed={`${pending}-${provider}`} />
                <div className="sec-setup-t">
                  <b>Enable 2FA</b>
                  <p>
                    {pending === 'okta'
                      ? 'In Okta Verify choose Add account, then Organization, and scan this QR code. Enter the 6-digit code it shows.'
                      : `Scan this QR code from ${appName} and enter the 6-digit verification code.`}
                  </p>
                  <CodeBoxes value={code} onChange={setCode} />
                </div>
              </div>
              {guide && (
                <ol className="sec-guide">
                  <li>Install {appName} on your phone from the App Store or Google Play.</li>
                  <li>{pending === 'okta' ? 'Tap Add account and choose Organization.' : 'Tap the plus button and choose Scan a QR code.'}</li>
                  <li>Point the camera at the QR code, then type the 6 digits the app shows.</li>
                </ol>
              )}
              <div className="sec-setup-foot">
                <button type="button" className="sp-btn" onClick={() => { setPending(null); setCode('') }}>Cancel</button>
                <button type="button" className="sp-btn primary" disabled={code.length < 6} onClick={verify}>Verify and enable</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sec-dev-head">
        <div>
          <h3 className="sec-h2">Browsers and devices</h3>
          <p className="sec-sub">These browsers and devices are currently signed in to your account. Remove any you do not recognise.</p>
        </div>
        {others.length > 0 && (
          <button type="button" className="sp-btn" onClick={() => setDevices((d) => d.filter((x) => x.current))}>Sign out all other devices</button>
        )}
      </div>
      <ul className="sec-devices">
        {devices.map(({ id, icon: Ico, name, where, status, current, online }) => (
          <li key={id}>
            <span className="sp-sic"><Ico size={18} strokeWidth={1.75} aria-hidden="true" /></span>
            <b>{name}</b>
            <span className="where"><MapPin size={14} strokeWidth={1.75} aria-hidden="true" />{where}</span>
            <span className={online ? 'dev-tag on' : 'dev-tag'}><i aria-hidden="true" />{online ? 'Online' : 'Offline'}</span>
            <span className={current ? 'st cur' : 'st'}>{status}</span>
            {current
              ? <span className="trash-gap" />
              : <button type="button" className="sec-trash" aria-label={`Remove ${name}`} onClick={() => setDevices((d) => d.filter((x) => x.id !== id))}><Trash2 size={16} strokeWidth={1.75} /></button>}
          </li>
        ))}
        {devices.length === 1 && <li className="empty">No other devices are signed in.</li>}
      </ul>
    </div>
  )
}
