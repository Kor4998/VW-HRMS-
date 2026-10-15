import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleCheck, Copy, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, Building2, ShieldCheck, Smartphone, TriangleAlert } from 'lucide-react'
import { DEMO_SECRET, STEP, groupKey, secondsLeft, totp, verifyTotp } from '@/lib/totp'

// Mock sign-in flows, modelled on the product's own: password sign-in, "Sign-in options" (organisation email, email OTP, mobile OTP),
// then a 6-box code screen. Nothing leaves the browser: the demo code is 123456 and any valid email + 8-character password signs in.
export const DEMO_CODE = '123456'
const RESEND_SECONDS = 57
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const maskEmail = (e) => { const [u, d] = String(e).split('@'); return `${u.slice(0, 1)}${'*'.repeat(Math.max(3, u.length - 1))}@${d}` }
export const maskPhone = (p) => `+91 ${'*'.repeat(5)} ${String(p).replace(/\s/g, '').slice(-5)}`
export const validEmail = (e) => EMAIL_RE.test(String(e).trim())
export const validPhone = (p) => /^[6-9]\d{9}$/.test(String(p).replace(/\s/g, ''))

// 0 = nothing, 1 = weak, 2 = fair, 3 = good, 4 = strong
export function strength(pw) {
  if (!pw) return 0
  let n = 0
  if (pw.length >= 8) n++
  if (pw.length >= 12) n++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) n++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) n++
  return Math.max(1, n)
}
const STRENGTH = ['', 'Weak', 'Fair', 'Good', 'Strong']

function Field({ id, label, error, hint, children }) {
  return (
    <div className="af">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <p className="af-err" id={`${id}-e`} role="alert">{error}</p> : hint ? <p className="af-hint" id={`${id}-h`}>{hint}</p> : null}
    </div>
  )
}

function PasswordInput({ id, value, onChange, onBlur, invalid, describedBy, autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false)
  const [caps, setCaps] = useState(false)
  return (
    <>
      <div className="pw has-ic">
        <Lock size={16} strokeWidth={1.75} className="in-ic" aria-hidden="true" />
        <input id={id} name={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} onBlur={(e) => { setCaps(false); onBlur?.(e) }} autoComplete={autoComplete} aria-invalid={invalid || undefined} aria-describedby={describedBy}
          onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock') || false)} onKeyDown={(e) => setCaps(e.getModifierState?.('CapsLock') || false)} />
        <button type="button" className="pw-t" onClick={() => setShow((x) => !x)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>{show ? <EyeOff size={16} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.75} aria-hidden="true" />}</button>
      </div>
      {caps && <p className="caps" role="status"><TriangleAlert size={13} strokeWidth={2} aria-hidden="true" />Caps Lock is on</p>}
    </>
  )
}

// six boxes, one digit each: typing moves forward, Backspace moves back, arrows move, a pasted code fills all boxes
export function OtpBoxes({ value, onChange, invalid, describedBy, autoFocus }) {
  const refs = useRef([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '')
  useEffect(() => { if (autoFocus) refs.current[0]?.focus() }, [autoFocus])
  const set = (i, d) => { const a = [...digits]; a[i] = d; onChange(a.join('').slice(0, 6)) }
  return (
    <div className="otp" role="group" aria-label="6-digit code">
      {digits.map((d, i) => (
        <input
          key={i} ref={(el) => { refs.current[i] = el }} value={d} inputMode="numeric" pattern="[0-9]*" maxLength={1} autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1} of 6`} aria-invalid={invalid || undefined} aria-describedby={describedBy}
          onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); if (!v) return set(i, ''); set(i, v.slice(-1)); refs.current[Math.min(5, i + 1)]?.focus() }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d) { e.preventDefault(); set(Math.max(0, i - 1), ''); refs.current[Math.max(0, i - 1)]?.focus() }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); refs.current[Math.max(0, i - 1)]?.focus() }
            else if (e.key === 'ArrowRight') { e.preventDefault(); refs.current[Math.min(5, i + 1)]?.focus() }
          }}
          onPaste={(e) => { const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (t) { e.preventDefault(); onChange(t); refs.current[Math.min(5, t.length)]?.focus() } }}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
}

function Btn({ busy, busyText, children, ...rest }) {
  return <button type={rest.type || 'submit'} className="btn solid" aria-busy={busy || undefined} disabled={busy} {...rest}>{busy ? <><Loader2 size={16} strokeWidth={2} className="spin" aria-hidden="true" />{busyText}</> : children}</button>
}
// what an operator needs to add the account to Google Authenticator, plus a demo of the code their app would show right now
function AuthenticatorHelp({ now, email }) {
  const [copied, setCopied] = useState(false)
  const left = secondsLeft(now)
  const copy = () => { try { navigator.clipboard?.writeText(DEMO_SECRET) } catch { /* clipboard unavailable */ } setCopied(true); setTimeout(() => setCopied(false), 1800) }
  const code = totp(DEMO_SECRET, now)
  return (
    <div className="setup-slot"><details className="setup">
      <summary>Set up or preview the authenticator</summary>
      <ol>
        <li>Open Google Authenticator and choose <b>Add a code</b>, then <b>Enter a setup key</b>.</li>
        <li>Account: <b>{email || 'your work email'}</b>. Key (time based): <code>{groupKey(DEMO_SECRET)}</code>
          <button type="button" className="copy" onClick={copy} aria-label="Copy setup key"><Copy size={13} strokeWidth={1.75} aria-hidden="true" />{copied ? 'Copied' : 'Copy'}</button></li>
      </ol>
      <div className="app-demo" aria-label="Demo authenticator">
        <small>Demo of your app</small>
        <b aria-label={`Current code ${code}`}>{code.slice(0, 3)} {code.slice(3)}</b>
        <i style={{ '--p': `${(left / STEP) * 100}%` }} aria-hidden="true" />
        <small>Refreshes in 0:{String(left).padStart(2, '0')}</small>
      </div>
    </details></div>
  )
}

const Privacy = () => (<p className="privacy">By clicking continue, you agree to our <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.</p>)

export default function AuthPanel({ logo, onLogin, startView = 'signin', speed = 1 }) {
  // signin | options | org | email | mobile | verify | newpass | done | signedout
  const [view, setView] = useState(startView)
  const [purpose, setPurpose] = useState('signin') // what the code is for: signin | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [via, setVia] = useState('email') // how the code was sent: email | mobile
  const [dest, setDest] = useState('') // masked destination
  const [code, setCode] = useState('')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [touched, setTouched] = useState({})
  const [err, setErr] = useState('')
  const [left, setLeft] = useState(0)
  const [tries, setTries] = useState(0)
  const [busy, setBusy] = useState('') // which button is working: signin | verify | org | otp
  const [now, setNow] = useState(() => Date.now())
  const root = useRef(null)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const onApp = via === 'app' && view === 'verify'
  useEffect(() => { if (!onApp && view !== 'app') return undefined; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [onApp, view])
  // a short, honest loading state before anything completes (width is kept, the result is announced)
  const work = (key, fn, ms = 700) => { setBusy(key); timers.current.push(setTimeout(() => { setBusy(''); fn() }, ms * speed)) }
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }))

  useEffect(() => { if (left <= 0) return undefined; const t = setTimeout(() => setLeft((n) => n - 1), 1000); return () => clearTimeout(t) }, [left])
  // focus lands on the first control of the new view
  useEffect(() => { (root.current?.querySelector('input:not([type="hidden"])') || root.current?.querySelector('button.opt, button.btn'))?.focus() }, [view])

  const go = (v) => { setErr(''); setTouched({}); setView(v) }
  const emailErr = !email.trim() ? 'Enter your work email.' : !validEmail(email) ? 'Enter an email like name@company.com.' : ''
  const pwErr = !password ? 'Enter your password.' : password.length < 8 ? 'Passwords have at least 8 characters.' : ''
  const phoneErr = !phone.trim() ? 'Enter your mobile number.' : !validPhone(phone) ? 'Enter a 10-digit Indian mobile number.' : ''
  const p1Err = !pw1 ? 'Enter a new password.' : pw1.length < 8 ? 'Use at least 8 characters.' : ''
  const p2Err = !pw2 ? 'Re-enter the new password.' : pw1 !== pw2 ? 'The two passwords don’t match.' : ''
  const show = (k, msg) => (touched[k] ? msg : '')

  const signIn = (e) => { e.preventDefault(); setTouched({ email: true, password: true }); if (emailErr || pwErr || busy) return; work('signin', () => onLogin?.()) }
  const app = (e) => {
    e.preventDefault(); setTouched({ email: true })
    if (emailErr || busy) return
    work('otp', () => { setVia('app'); setDest('your authenticator app'); setCode(''); setTries(0); setNow(Date.now()); go('verify') }, 400)
  }
  const org = (e) => { e.preventDefault(); setTouched({ email: true }); if (emailErr || busy) return; work('org', () => onLogin?.()) } // mock single sign-on
  const getCode = (e, how) => {
    e.preventDefault()
    setTouched({ email: true, phone: true })
    if ((how === 'email' ? emailErr : phoneErr) || busy) return
    work('otp', () => { setVia(how); setDest(how === 'email' ? maskEmail(email.trim()) : maskPhone(phone)); setCode(''); setTries(0); setLeft(RESEND_SECONDS); go('verify') }, 600)
  }
  const check = (c) => {
    if (c.length < 6) { setErr('Enter all 6 digits of the code.'); return }
    if (busy) return
    work('verify', () => {
      if (via === 'app' ? !verifyTotp(DEMO_SECRET, c) : c !== DEMO_CODE) {
        const n = tries + 1
        setTries(n); setCode('')
        setErr(n >= 5 ? 'Too many wrong codes. Send a new code to try again.' : 'That code isn’t right. Check the 6 digits or send a new code.')
        root.current?.querySelector('.otp input')?.focus()
        return
      }
      if (purpose === 'reset') go('newpass'); else onLogin?.()
    }, 650)
  }
  const verify = (e) => { e.preventDefault(); check(code) }
  // the sixth digit verifies on its own, so nobody has to find the button
  const onCode = (v) => { setCode(v); setErr(''); if (v.length === 6 && v !== code) { timers.current.push(setTimeout(() => check(v), 250 * speed)) } }
  const resend = () => { setCode(''); setTries(0); setErr(''); setLeft(RESEND_SECONDS); root.current?.querySelector('.otp input')?.focus() }
  const setPass = (e) => { e.preventDefault(); setTouched({ pw1: true, pw2: true }); if (p1Err || p2Err) return; go('done') }

  // the page heading is kept for screen readers; the screens themselves stay clean, like the product's own sign-in
  const H = ({ children }) => <h1 className="sr-only">{children}</h1>
  const Back = ({ to, label = 'Back', reset }) => (<button type="button" className="back" onClick={() => { if (reset) setPurpose('signin'); go(to) }}><ChevronLeft size={14} strokeWidth={2} aria-hidden="true" /><span>{label}</span></button>)
  const emailField = (
    <Field id="email" label="Email" error={show('email', emailErr)}>
      <div className="has-ic"><Mail size={16} strokeWidth={1.75} className="in-ic" aria-hidden="true" />
        <input id="email" name="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={(e) => e.target.value.trim() && touch('email')} autoComplete="email" aria-invalid={!!show('email', emailErr) || undefined} aria-describedby={show('email', emailErr) ? 'email-e' : undefined} />
      </div>
    </Field>
  )
  const phoneField = (
    <Field id="phone" label="Mobile number" error={show('phone', phoneErr)} hint="Indian mobile number, 10 digits.">
      <div className="phone"><span aria-hidden="true">+91</span>
        <input id="phone" name="phone" type="tel" inputMode="numeric" placeholder="98765 43210" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 11))} onBlur={(e) => e.target.value.trim() && touch('phone')} autoComplete="tel-national" aria-label="Mobile number, after +91" aria-invalid={!!show('phone', phoneErr) || undefined} aria-describedby={show('phone', phoneErr) ? 'phone-e' : 'phone-h'} />
      </div>
    </Field>
  )

  return (
    <div className="form" ref={root}>
      <img src={logo} alt="Voltuswave AI Development Platform" className="logo" />
      <div className="view" key={view}>

      {view === 'signin' && (
        <form onSubmit={signIn} noValidate aria-label="Sign in">
          <H>Sign in</H>
          {emailField}
          <Field id="password" label="Password" error={show('password', pwErr)}>
            <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={(e) => e.target.value && touch('password')} invalid={!!show('password', pwErr)} describedBy={show('password', pwErr) ? 'password-e' : undefined} />
          </Field>
          <button type="button" className="forgot" onClick={() => { setPurpose('reset'); go('email') }}>Forgot password?</button>
          <Btn busy={busy === 'signin'} busyText="Signing in…">Sign in</Btn>
          <button type="button" className="btn outline opts" onClick={() => { setPurpose('signin'); go('options') }}><KeyRound size={16} strokeWidth={1.75} aria-hidden="true" />Sign-in options</button>
          <p className="demo">Demo: any valid email with an 8+ character password, or the code {DEMO_CODE}.</p>
        </form>
      )}

      {view === 'options' && (
        <div>
          <H>Sign-in options</H>
          <ul className="opts-list">
            {[['org', Building2, 'Continue using your organisation email', 'Single sign-on with your company address'], ['email', Mail, 'Continue with email OTP', 'We email you a 6-digit code'], ['mobile', Smartphone, 'Continue with mobile OTP', 'We text a 6-digit code to your phone'], ['app', ShieldCheck, 'Continue with authenticator app', 'Use the code from Google Authenticator']].map(([to, Ico, label, desc]) => (
              <li key={to}><button type="button" className="opt" onClick={() => go(to)}><span className="opt-ic"><Ico size={18} strokeWidth={1.75} aria-hidden="true" /></span><span className="opt-t"><b>{label}</b><small>{desc}</small></span><ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" /></button></li>
            ))}
          </ul>
          <Back to="signin" />
        </div>
      )}

      {view === 'org' && (
        <form onSubmit={org} noValidate aria-label="Continue with your organisation email">
          <H>Continue with your organisation email</H>
          {emailField}
          <Btn busy={busy === 'org'} busyText="Redirecting…">Continue</Btn>
          <Back to="options" />
        </form>
      )}

      {view === 'email' && (
        <form onSubmit={(e) => getCode(e, 'email')} noValidate aria-label={purpose === 'reset' ? 'Reset your password' : 'Email OTP'}>
          <H>{purpose === 'reset' ? 'Reset your password' : 'Continue with email OTP'}</H>
          {emailField}
          <Btn busy={busy === 'otp'} busyText="Sending code…">Get OTP</Btn>
          <Back to={purpose === 'reset' ? 'signin' : 'options'} reset={purpose === 'reset'} />
        </form>
      )}

      {view === 'mobile' && (
        <form onSubmit={(e) => getCode(e, 'mobile')} noValidate aria-label="Mobile OTP">
          <H>Continue with mobile OTP</H>
          {phoneField}
          <Btn busy={busy === 'otp'} busyText="Sending code…">Get OTP</Btn>
          <Back to="options" />
        </form>
      )}

      {view === 'app' && (
        <form onSubmit={app} noValidate aria-label="Authenticator app">
          <H>Continue with authenticator app</H>
          {emailField}
          <Btn busy={busy === 'otp'} busyText="Continuing…">Continue</Btn>
          <Back to="options" />
        </form>
      )}

      {view === 'verify' && (
        <form onSubmit={verify} noValidate aria-label="Enter your code">
          <H>Enter your code</H>
          {via === 'app'
            ? <p className="sent">Enter the 6-digit code from your authenticator app</p>
            : <p className="sent">We sent a 6-digit code to <b>{dest}</b></p>}
          <OtpBoxes value={code} onChange={onCode} invalid={!!err} describedBy={err ? 'otp-e' : 'otp-h'} autoFocus />
          {err ? <p className="af-err otp-m" id="otp-e" role="alert">{err}</p> : <p className="af-hint otp-m" id="otp-h">{via === 'app' ? 'The code in your app changes every 30 seconds.' : `Valid for 10 minutes. Demo code: ${DEMO_CODE}.`}</p>}
          <Btn busy={busy === 'verify'} busyText="Verifying…">{purpose === 'reset' ? 'Verify code' : 'Verify and sign in'}</Btn>
          {via === 'app' ? (
            <>
              <div className="resend-row">
                <span>Your app’s code refreshes in 0:{String(secondsLeft(now)).padStart(2, '0')}</span>
                <button type="button" onClick={() => go('app')}>Change email</button>
              </div>
              <AuthenticatorHelp now={now} email={email} />
            </>
          ) : (
            <div className="resend-row">
              <span aria-live="polite">{left > 0 ? `Resend code in 0:${String(left).padStart(2, '0')}` : <button type="button" onClick={resend}>Resend code</button>}</span>
              <button type="button" onClick={() => go(via === 'mobile' ? 'mobile' : 'email')}>Change {via === 'mobile' ? 'number' : 'email'}</button>
            </div>
          )}
          <Back to={via === 'app' ? 'app' : via === 'mobile' ? 'mobile' : 'email'} />
        </form>
      )}

      {view === 'newpass' && (
        <form onSubmit={setPass} noValidate aria-label="Set a new password">
          <H>Set a new password</H>
          <Field id="pw1" label="New password" error={show('pw1', p1Err)} hint="At least 8 characters.">
            <PasswordInput id="pw1" value={pw1} onChange={(e) => setPw1(e.target.value)} onBlur={(e) => e.target.value && touch('pw1')} invalid={!!show('pw1', p1Err)} describedBy={show('pw1', p1Err) ? 'pw1-e' : 'pw1-h'} autoComplete="new-password" />
          </Field>
          {pw1 && (
            <div className={`meter s${strength(pw1)}`} role="status" aria-live="polite">
              <div aria-hidden="true"><i /><i /><i /><i /></div>
              <span>Password strength: <b>{STRENGTH[strength(pw1)]}</b></span>
            </div>
          )}
          <Field id="pw2" label="Confirm new password" error={show('pw2', p2Err)}>
            <PasswordInput id="pw2" value={pw2} onChange={(e) => setPw2(e.target.value)} onBlur={(e) => e.target.value && touch('pw2')} invalid={!!show('pw2', p2Err)} describedBy={show('pw2', p2Err) ? 'pw2-e' : undefined} autoComplete="new-password" />
          </Field>
          <button type="submit" className="btn solid">Update password</button>
        </form>
      )}

      {view === 'done' && (
        <div className="state" role="status">
          <CircleCheck size={40} strokeWidth={1.5} className="state-ic" aria-hidden="true" />
          <h1>Password updated</h1><p className="sub">Sign in with your new password.</p>
          <button type="button" className="btn solid" onClick={() => { setPurpose('signin'); setPassword(''); setPw1(''); setPw2(''); go('signin') }} autoFocus>Sign in</button>
        </div>
      )}

      {view === 'signedout' && (
        <div className="state" role="status">
          <CircleCheck size={40} strokeWidth={1.5} className="state-ic" aria-hidden="true" />
          <h1>You’re signed out</h1><p className="sub">Your session has ended. Sign in again to continue.</p>
          <button type="button" className="btn solid" onClick={() => go('signin')} autoFocus>Sign in</button>
        </div>
      )}
      </div>
      {!['done', 'signedout', 'newpass'].includes(view) && <Privacy />}
    </div>
  )
}
