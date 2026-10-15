import { useState } from 'react'
import Avatar from '@/components/Avatar'
import { ArrowUpRight, BadgeCheck, Boxes, CalendarCheck, CalendarDays, FileText, MapPin, Mail, MoreHorizontal, Pencil, UserRound } from 'lucide-react'
import { PopMenu } from './ModuleKit'
import { toast } from '@/components/toast'
import { openPerson } from '@/components/person'

const CARDS = [
  { key: 'leave', group: 'Leave', icon: CalendarDays, title: 'Paid leave', stat: '6.5 days', sub: 'available of 18', go: ['Leave Management', 'overview'], tone: 'blue' },
  { key: 'comp', group: 'Leave', icon: CalendarDays, title: 'Comp offs', stat: '1 day', sub: 'available', go: ['Leave Management', 'comp'], tone: 'violet' },
  { key: 'att', group: 'Attendance', icon: CalendarCheck, title: 'Attendance', stat: '91%', sub: 'present this month', go: ['Attendance', 'history'], tone: 'green' },
  { key: 'asset', group: 'Assets', icon: Boxes, title: 'My assets', stat: '7 items', sub: 'in your name', go: ['Asset'], tone: 'amber' },
  { key: 'pol', group: 'Policies', icon: FileText, title: 'Leave policies', stat: '3 policies', sub: 'apply to you', go: ['Policies'], tone: 'pink' },
]

function Field({ label, children }) {
  return <div className="pv-f"><small>{label}</small><div>{children}</div></div>
}

// Read-only profile (editorial layout). The editable form lives in Settings → Public profile.
export default function ProfilePage({ profile, onNavigate, onEdit }) {
  const [more, setMore] = useState(false)
  const full = `${profile.first} ${profile.last}`.trim()

  return (
    <div className="pv">
      <div className="pv-cover" aria-hidden="true"><i /><i /></div>

      <div className="pv-head">
        <div className="pv-av"><Avatar name={full} src={`${import.meta.env.BASE_URL}avatars/p8.jpg`} size={128} /><span className="pv-badge" role="img" aria-label="Verified"><BadgeCheck size={20} strokeWidth={2.25} aria-hidden="true" /></span></div>
        <div className="pv-id">
          <h1>{full}</h1>
          <p>I&apos;m a UI Designer on the Sales &amp; Marketing team at VoltusWave.</p>
        </div>
        <div className="pv-act">
          <PopMenu label="More actions" trigger={<MoreHorizontal size={18} strokeWidth={1.75} />} items={[
            { label: 'Copy employee code', icon: UserRound, run: () => { navigator.clipboard?.writeText(profile.code).catch(() => {}); toast({ title: 'Copied', text: profile.code, duration: 2000 }) } },
            { label: 'Copy work email', icon: Mail, run: () => { navigator.clipboard?.writeText(profile.email).catch(() => {}); toast({ title: 'Copied', text: profile.email, duration: 2000 }) } },
          ]} />
          <button type="button" className="mp-btn" onClick={() => toast({ title: 'ID card', text: 'Your employee ID card is ready to download.', tone: 'info' })}>Download ID card</button>
          <button type="button" className="mp-btn pv-primary" onClick={onEdit}><Pencil size={16} strokeWidth={1.75} aria-hidden="true" />Edit profile</button>
        </div>
      </div>

      <section className="pv-sec">
        <h2>Overview</h2>
        <p className="pv-sub">UI design, design systems and the HRMS portal.</p>
        <hr />
        <div className="pv-about">
          <div>
            <h3>About me</h3>
            <p>{profile.bio}</p>
            {more && <p>I report to Kalyani Devarapalli and work with the product and engineering teams to ship the employee portal. Outside of work I enjoy typography and prototyping new interface ideas.</p>}
            <button type="button" className="pv-link" onClick={() => setMore((m) => !m)}>{more ? 'Show less' : 'Read more'}</button>
          </div>
          <div className="pv-facts">
            <Field label="Location"><MapPin size={16} strokeWidth={1.75} aria-hidden="true" />Hyderabad, India</Field>
            <Field label="Employee code">{profile.code}</Field>
            <Field label="Department">Sales &amp; Marketing</Field>
            <Field label="Email"><a href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" /></a></Field>
          </div>
        </div>
      </section>

      <div className="pv-roles">
        {[
          { t: 'UI Designer', s: 'VoltusWave', d: 'Current role', tone: 'violet', go: 'Policies', cta: 'View policies' },
          { t: 'Individual Contributor', s: 'Company level', d: 'Employment: Active', tone: 'green', go: 'Shift Management', cta: 'View roster' },
          { t: 'Kalyani Devarapalli', s: 'Reporting manager', d: 'Sales & Marketing', tone: 'blue', go: 'Attendance', cta: 'View attendance' },
        ].map((r) => (
          <div key={r.t} className="pv-role">
            <div className="pv-role-b">
              <span className={`pv-role-ic ${r.tone}`}><UserRound size={20} strokeWidth={1.75} aria-hidden="true" /></span>
              <div>{r.s === 'Reporting manager' ? <button type="button" className="person-link" onClick={() => openPerson(r.t)}><b>{r.t}</b></button> : <b>{r.t}</b>}<small>{r.s}</small></div>
              <p>{r.d}</p>
            </div>
            <button type="button" className="pv-role-f" onClick={() => onNavigate(r.go)}>{r.cta}</button>
          </div>
        ))}
      </div>

      <section className="pv-sec">
        <h2>My workspace</h2>
        <div className="pv-cards">
          {CARDS.map((c) => {
            const Ico = c.icon
            return (
              <button key={c.key} type="button" className="pv-card" onClick={() => onNavigate(c.go[0], c.go[1])}>
                <span className={`pv-thumb ${c.tone}`}><Ico size={28} strokeWidth={1.5} aria-hidden="true" /><em>{c.stat}</em></span>
                <b>{c.title}</b><small>{c.sub}</small>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
