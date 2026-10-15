import { useState } from 'react'
import { toast } from '@/components/toast'
import { Camera, Check, ChevronDown } from 'lucide-react'
import SecuritySection from './SecuritySection'
import BrandingSection from './BrandingSection'
import { SIDEBAR_TYPES } from './sidebarMenus'
import ProfileEditor from '@/pages/modules/ProfileEditor'
import './SettingsPage.css'

const TABS = [
  ['profile', 'My details'],
  ['public', 'Public profile'],
  ['appearance', 'Appearance'],
  ['notifications', 'Notifications'],
  ['security', 'Security'],
  ['branding', 'Branding'],
  ['menu', 'App menu'],
]

const ACCENTS = [
  ['zinc', 'Zinc', '#27272A'], ['red', 'Red', '#EF4444'], ['orange', 'Orange', '#F97316'],
  ['yellow', 'Yellow', '#EAB308'], ['green', 'Green', '#22C55E'], ['violet', 'Violet', '#8B5CF6'],
  ['rose', 'Rose', '#F43F5E'], ['blue', 'Blue', '#3B82F6'], ['blueline', 'Blueline', '#0EA5E9'],
]

const FONTS = [
  ['inter', 'Inter', "'Inter', system-ui, sans-serif", 'Clean and neutral. The default.'],
  ['inter-tight', 'Inter Tight', "'Inter Tight', 'Inter', system-ui, sans-serif", 'Inter with tighter spacing.'],
  ['geist', 'Geist', "'Geist', 'Inter', system-ui, sans-serif", 'Sharp and modern.'],
]

const HEADS = {
  public: ['Public profile', 'What your teammates see on your My Profile page. Edit it here.'],
  profile: ['Personal info', 'Update your photo and personal details here.'],
  appearance: ['Appearance', 'Choose how the portal looks and reads for you.'],
  notifications: ['Notification settings', 'We may still send you important notifications about your account outside of your notification settings.'],
  security: ['Security', 'Keep your account safe and review where you are signed in.'],
  menu: ['App menu', 'How the application side menu is laid out for you.'],
  branding: ['Branding', 'Your logo, favicon and the login banners. They are used on the login page, in the header and in the browser tab.'],
}

const GROUPS = [
  ['comments', 'Comments', 'These are notifications for comments on your posts and replies to your comments.'],
  ['approvals', 'Leave and requests', 'When a leave, WFH or regularization request of yours is approved or declined.'],
  ['announce', 'Announcements', 'Company news and HR announcements posted to the community feed.'],
  ['reminders', 'Reminders', 'These are notifications to remind you of updates you might have missed.'],
  ['activity', 'More activity about you', 'These are notifications for birthdays, work anniversaries and other reactions to your profile.'],
]
const CHANNELS = [['push', 'Push'], ['email', 'Email'], ['sms', 'SMS']]

function Row({ title, desc, children, top }) {
  return (
    <div className={top ? 'sp-row top' : 'sp-row'}>
      <div className="sp-row-l"><b>{title}</b>{desc && <p>{desc}</p>}</div>
      <div className="sp-row-r">{children}</div>
    </div>
  )
}

function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={checked ? 'sp-switch on' : 'sp-switch'} onClick={() => onChange(!checked)}>
      <i />
    </button>
  )
}

function Select({ defaultValue, options, label }) {
  return (
    <span className="sp-select">
      <select defaultValue={defaultValue} aria-label={label}>{options.map((o) => <option key={o}>{o}</option>)}</select>
      <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
    </span>
  )
}

export default function SettingsPage({ sidebarType = 'default', setSidebarType = () => {}, profile, onProfileSave, tab, setTab, theme, setTheme, accent, setAccent, font, setFont, time24, setTime24, onBack }) {
  const [prefs, setPrefs] = useState({
    'comments-push': true, 'comments-email': true,
    'approvals-push': true, 'approvals-email': true,
    'announce-email': true,
    'reminders-push': false,
  })
  const [title, desc] = HEADS[tab] || HEADS.profile

  return (
    <div className="sp">
      <h1 className="sp-title">Settings</h1>

      <div className="sp-tabs" role="tablist" aria-label="Settings sections">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <section className="sp-section" role="tabpanel">
        <header className="sp-sec-head">
          <div><h2>{title}</h2><p>{desc}</p></div>
          {tab !== 'public' && tab !== 'branding' && tab !== 'menu' && (
            <div className="sp-actions">
              <button type="button" className="sp-btn" onClick={onBack}>Cancel</button>
              <button type="button" className="sp-btn primary" onClick={() => { toast({ title: 'Settings saved', text: 'Your preferences have been updated.' }); onBack() }}>Save changes</button>
            </div>
          )}
        </header>

        {tab === 'public' && <ProfileEditor profile={profile} onSave={onProfileSave} />}

        {tab === 'profile' && (
          <>
            <Row title="Name"><div className="sp-two"><input className="sp-input" defaultValue="Venkatesh Aravind" aria-label="First name" /><input className="sp-input" defaultValue="Korlapati" aria-label="Last name" /></div></Row>
            <Row title="Email address" desc="Managed by your administrator."><input className="sp-input" defaultValue="korlapati.venkatesh@voltuswave.com" readOnly aria-label="Email address" /></Row>
            <Row title="Your photo" desc="This will be displayed on your profile." top>
              <div className="sp-photo"><span className="sp-av">VK</span><button type="button" className="sp-btn"><Camera size={16} strokeWidth={1.75} aria-hidden="true" />Change photo</button></div>
            </Row>
            <Row title="Phone number"><input className="sp-input" defaultValue="+91 98765 43210" aria-label="Phone number" /></Row>
            <Row title="Role and department" desc="Set by HR."><div className="sp-two"><input className="sp-input" defaultValue="Software Engineer" readOnly aria-label="Role" /><input className="sp-input" defaultValue="Engineering" readOnly aria-label="Department" /></div></Row>
            <Row title="Location"><Select defaultValue="Hyderabad, India" label="Location" options={['Hyderabad, India', 'Bengaluru, India', 'Remote']} /></Row>
            <Row title="Bio" desc="A short introduction for your teammates." top><textarea className="sp-input sp-area" rows={4} defaultValue="Software engineer building internal tools, with a focus on clean interfaces and reliable delivery." aria-label="Bio" /></Row>
          </>
        )}

        {tab === 'appearance' && (
          <>
            <Row title="Theme" desc="Choose how the dashboard looks to you." top>
              <div className="sp-pvs">
                {[['light', 'Light', 'Bright and clean.'], ['dark', 'Dark', 'Easy on the eyes.']].map(([v, label, hint]) => (
                  <button key={v} type="button" className={theme === v ? 'sp-pv on' : 'sp-pv'} aria-pressed={theme === v} onClick={() => setTheme(v)}>
                    <span className={`sp-shot ${v}`} aria-hidden="true">
                      <i className="b1" /><i className="b2" /><i className="b3" /><i className="b4" />
                      {theme === v && <em><Check size={12} strokeWidth={3} /></em>}
                    </span>
                    <b>{label}</b>
                    <small>{hint}</small>
                  </button>
                ))}
              </div>
            </Row>
            <Row title="Accent color" desc="Used for selected items, tabs and switches across the portal." top>
              <div className="sp-accents" role="radiogroup" aria-label="Accent color">
                {ACCENTS.map(([key, label, hex]) => (
                  <button key={key} type="button" role="radio" aria-checked={accent === key} className={accent === key ? 'sp-ac on' : 'sp-ac'} onClick={() => setAccent(key)}>
                    <span className="sp-dot" style={{ background: hex }}>{accent === key && <Check size={12} strokeWidth={3} aria-hidden="true" />}</span>
                    {label}
                  </button>
                ))}
              </div>
            </Row>
            <Row title="Font" desc="The typeface used across the portal." top>
              <div className="sp-fonts" role="radiogroup" aria-label="Font">
                {FONTS.map(([key, label, stack, note]) => (
                  <button key={key} type="button" role="radio" aria-checked={font === key} className={font === key ? 'sp-fo on' : 'sp-fo'} onClick={() => setFont(key)}>
                    <span className="sp-fo-aa" style={{ fontFamily: stack }}>Aa</span>
                    <b style={{ fontFamily: stack }}>{label}</b>
                    <small style={{ fontFamily: stack }}>{note}</small>
                    {font === key && <em><Check size={12} strokeWidth={3} aria-hidden="true" /></em>}
                  </button>
                ))}
              </div>
            </Row>
            <Row title="Time format" desc="Applies to the clock on your dashboard.">
              <div className="sp-seg" role="group" aria-label="Time format">
                <button type="button" aria-pressed={!time24} className={!time24 ? 'on' : ''} onClick={() => setTime24(false)}>12-hour</button>
                <button type="button" aria-pressed={time24} className={time24 ? 'on' : ''} onClick={() => setTime24(true)}>24-hour</button>
              </div>
            </Row>
            <Row title="Language" desc="Default language for the portal."><Select defaultValue="English (UK)" label="Language" options={['English (UK)', 'English (US)', 'हिन्दी', 'తెలుగు']} /></Row>
            <Row title="Date format"><Select defaultValue="DD/MM/YYYY" label="Date format" options={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} /></Row>
          </>
        )}

        {tab === 'notifications' && GROUPS.map(([key, name, text]) => (
          <Row key={key} title={name} desc={text} top>
            <div className="sp-channels">
              {CHANNELS.map(([ch, label]) => {
                const id = `${key}-${ch}`
                return (
                  <div key={ch} className="sp-ch">
                    <Switch label={`${name} – ${label}`} checked={!!prefs[id]} onChange={(v) => setPrefs((p) => ({ ...p, [id]: v }))} />
                    <span>{label}</span>
                  </div>
                )
              })}
            </div>
          </Row>
        ))}

        {tab === 'security' && <SecuritySection />}

        {tab === 'branding' && <BrandingSection />}

        {tab === 'menu' && (
          <section className="sp-menu" aria-label="Side menu layout">
            <h3>Side menu layout</h3>
            <p>Applies to every app you open. The change takes effect immediately.</p>
            <label htmlFor="sidebar-type">Sidebar Type</label>
            <span className="sp-select">
              <select id="sidebar-type" name="sidebarType" value={sidebarType} onChange={(e) => { setSidebarType(e.target.value); toast({ title: 'Side menu updated', text: SIDEBAR_TYPES.find(([k]) => k === e.target.value)[1], duration: 2200 }) }}>
                {SIDEBAR_TYPES.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
              </select>
              <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <small>{SIDEBAR_TYPES.find(([k]) => k === sidebarType)?.[2]}</small>
          </section>
        )}
      </section>
    </div>
  )
}
