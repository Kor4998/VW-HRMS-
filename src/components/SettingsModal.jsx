import { useEffect, useRef, useState } from 'react'
import { Bell, Camera, Check, ChevronDown, KeyRound, Laptop, Moon, Palette, ShieldCheck, Smartphone, Sun, User, X } from 'lucide-react'
import './SettingsModal.css'

const TABS = [
  ['profile', 'Profile', User],
  ['appearance', 'Appearance', Palette],
  ['notifications', 'Notifications', Bell],
  ['security', 'Security', ShieldCheck],
]

const NOTIFS = [
  ['email', 'Email notifications', 'Receive updates about your account by email.'],
  ['push', 'Push notifications', 'Get alerts in the browser while you are working.'],
  ['approvals', 'Leave and request approvals', 'When a request of yours is approved or declined.'],
  ['announce', 'Announcements', 'Company news and HR announcements.'],
  ['birthdays', 'Birthdays and work anniversaries', 'Celebrate your teammates.'],
  ['weekly', 'Weekly hours summary', 'A short recap of your week every Monday.'],
]

const SESSIONS = [
  { icon: Laptop, name: 'Windows · Edge', meta: 'Hyderabad, India · Active now', current: true },
  { icon: Smartphone, name: 'iPhone 15 · Safari', meta: 'Hyderabad, India · 2 hours ago' },
  { icon: Laptop, name: 'MacBook Pro · Chrome', meta: 'Bengaluru, India · Yesterday' },
]

function Row({ title, desc, children, top }) {
  return (
    <div className={top ? 'sm-row top' : 'sm-row'}>
      <div className="sm-row-l"><b>{title}</b>{desc && <p>{desc}</p>}</div>
      <div className="sm-row-r">{children}</div>
    </div>
  )
}

function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={checked ? 'sm-switch on' : 'sm-switch'} onClick={() => onChange(!checked)}>
      <i />
    </button>
  )
}

function Select({ defaultValue, options, label }) {
  return (
    <div className="sm-select">
      <select defaultValue={defaultValue} aria-label={label}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
    </div>
  )
}

function ThemeCard({ value, label, hint, active, onPick }) {
  return (
    <button type="button" className={active ? 'sm-pv on' : 'sm-pv'} aria-pressed={active} onClick={() => onPick(value)}>
      <span className={`sm-shot ${value}`} aria-hidden="true">
        <i className="b1" /><i className="b2" /><i className="b3" /><i className="b4" />
        {active && <em><Check size={12} strokeWidth={3} /></em>}
      </span>
      <b>{label}</b>
      <small>{hint}</small>
    </button>
  )
}

export default function SettingsModal({ tab, setTab, onClose, theme, setTheme, time24, setTime24 }) {
  const dialogRef = useRef(null)
  const [prefs, setPrefs] = useState({ email: true, push: false, approvals: true, announce: true, birthdays: false, weekly: true })
  const [twofa, setTwofa] = useState(true)

  useEffect(() => {
    dialogRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sm-scrim" onMouseDown={onClose}>
      <div className="sm-dialog" role="dialog" aria-modal="true" aria-labelledby="sm-title" tabIndex={-1} ref={dialogRef} onMouseDown={(e) => e.stopPropagation()}>
        <header className="sm-head">
          <div>
            <h2 id="sm-title">Settings</h2>
            <p>Manage your profile, appearance and preferences.</p>
          </div>
          <button type="button" className="sm-x" aria-label="Close settings" onClick={onClose}><X size={18} strokeWidth={1.75} /></button>
        </header>

        <nav className="sm-tabs" role="tablist" aria-label="Settings sections">
          {TABS.map(([key, label, Ico]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
              <Ico size={16} strokeWidth={1.75} aria-hidden="true" />{label}
            </button>
          ))}
        </nav>

        <div className="sm-body" role="tabpanel">
          {tab === 'profile' && (
            <>
              <Row title="Photo" desc="This appears on your profile and in comments.">
                <div className="sm-photo">
                  <span className="sm-av">VK</span>
                  <button type="button" className="sm-btn"><Camera size={16} strokeWidth={1.75} aria-hidden="true" />Change photo</button>
                </div>
              </Row>
              <Row title="Full name"><input className="sm-input" defaultValue="Venkatesh Aravind Korlapati" aria-label="Full name" /></Row>
              <Row title="Work email" desc="Managed by your administrator.">
                <input className="sm-input" defaultValue="korlapati.venkatesh@voltuswave.com" readOnly aria-label="Work email" />
              </Row>
              <Row title="Phone"><input className="sm-input" defaultValue="+91 98765 43210" aria-label="Phone" /></Row>
              <Row title="Role and department" desc="Set by HR.">
                <div className="sm-two">
                  <input className="sm-input" defaultValue="Software Engineer" readOnly aria-label="Role" />
                  <input className="sm-input" defaultValue="Engineering" readOnly aria-label="Department" />
                </div>
              </Row>
              <Row title="Location"><Select defaultValue="Hyderabad, India" label="Location" options={['Hyderabad, India', 'Bengaluru, India', 'Remote']} /></Row>
            </>
          )}

          {tab === 'appearance' && (
            <>
              <Row title="Theme" desc="Choose how the dashboard looks to you." top>
                <div className="sm-pvs">
                  <ThemeCard value="light" label="Light" hint="Bright and clean." active={theme === 'light'} onPick={setTheme} />
                  <ThemeCard value="dark" label="Dark" hint="Easy on the eyes." active={theme === 'dark'} onPick={setTheme} />
                </div>
              </Row>
              <Row title="Language" desc="Default language for the portal.">
                <Select defaultValue="English (UK)" label="Language" options={['English (UK)', 'English (US)', 'हिन्दी', 'తెలుగు']} />
              </Row>
              <Row title="Date format"><Select defaultValue="DD/MM/YYYY" label="Date format" options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} /></Row>
              <Row title="Time format" desc="Applies to the clock on your dashboard.">
                <div className="sm-seg" role="group" aria-label="Time format">
                  <button type="button" aria-pressed={!time24} className={!time24 ? 'on' : ''} onClick={() => setTime24(false)}>12-hour</button>
                  <button type="button" aria-pressed={time24} className={time24 ? 'on' : ''} onClick={() => setTime24(true)}>24-hour</button>
                </div>
              </Row>
              <Row title="Quick switch" desc="Toggle theme without leaving this page.">
                <div className="sm-seg icons" role="group" aria-label="Theme quick switch">
                  <button type="button" aria-label="Light" aria-pressed={theme === 'light'} className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}><Sun size={16} strokeWidth={1.75} /></button>
                  <button type="button" aria-label="Dark" aria-pressed={theme === 'dark'} className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}><Moon size={16} strokeWidth={1.75} /></button>
                </div>
              </Row>
            </>
          )}

          {tab === 'notifications' && NOTIFS.map(([key, title, desc]) => (
            <Row key={key} title={title} desc={desc}>
              <Switch label={title} checked={prefs[key]} onChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} />
            </Row>
          ))}

          {tab === 'security' && (
            <>
              <Row title="Password" desc="Last changed 3 months ago.">
                <button type="button" className="sm-btn"><KeyRound size={16} strokeWidth={1.75} aria-hidden="true" />Change password</button>
              </Row>
              <Row title="Two-factor authentication" desc="Add an extra layer of security when signing in.">
                <Switch label="Two-factor authentication" checked={twofa} onChange={setTwofa} />
              </Row>
              <Row title="Active sessions" desc="Devices that are signed in to your account." top>
                <ul className="sm-sessions">
                  {SESSIONS.map(({ icon: Ico, name, meta, current }) => (
                    <li key={name}>
                      <span className="sm-sic"><Ico size={18} strokeWidth={1.75} aria-hidden="true" /></span>
                      <div><b>{name}</b><small>{meta}</small></div>
                      {current ? <em className="sm-pill">This device</em> : <button type="button" className="sm-link">Sign out</button>}
                    </li>
                  ))}
                </ul>
              </Row>
            </>
          )}
        </div>

        <footer className="sm-foot">
          <button type="button" className="sm-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="sm-btn primary" onClick={onClose}>Save changes</button>
        </footer>
      </div>
    </div>
  )
}
