import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Boxes, CalendarCheck, CalendarDays, ChevronDown, Clock, Link2, Mail, MapPin, MessageCircle, Phone, Plus, Star, UserRound, X } from 'lucide-react'
import { DIRECTORY } from './person'
import { toast } from './toast'
import ComposeMessage from './ComposeMessage'
import ActivityFeed, { afLink } from './ActivityFeed'
import './overlays.css'

const COVER = {
  'Aasritha Samudrala': ['#1D4ED8', '#2563EB'], 'Kalyani Devarapalli': ['#FACC15', '#FDE047'], 'Anita Rao': ['#7C3AED', '#A78BFA'],
  'Mohan Pillai': ['#0E9384', '#2DD4BF'], 'Vinod Pasupuleti': ['#EA580C', '#FB923C'], 'IT Support': ['#334155', '#64748B'],
}
const SKILLS = {
  'Aasritha Samudrala': ['Asset management', 'Procurement', 'Helpdesk'], 'Kalyani Devarapalli': ['Team leadership', 'Campaigns', 'Hiring'], 'Anita Rao': ['Test automation', 'Accessibility', 'QA'],
  'Mohan Pillai': ['React', 'Node.js', 'Payroll'], 'Vinod Pasupuleti': ['APIs', 'Reporting', 'SQL'], 'IT Support': ['Laptops', 'Access', 'Software'],
}
// [attendance %, paid leave left, assets held, manager, shift]
const WORK = {
  'Aasritha Samudrala': [96, 9, 3, 'Kalyani Devarapalli', 'General · 9:30–6:30'], 'Kalyani Devarapalli': [98, 12, 2, 'Founder', 'General · 9:30–6:30'], 'Anita Rao': [93, 4.5, 2, 'Kalyani Devarapalli', 'General · 9:30–6:30'],
  'Mohan Pillai': [90, 6, 2, 'Kalyani Devarapalli', 'Late · 11:00–8:00'], 'Vinod Pasupuleti': [88, 3, 2, 'Kalyani Devarapalli', 'General · 9:30–6:30'], 'IT Support': [100, 0, 14, 'Aasritha Samudrala', 'Desk · 9:00–7:00'],
}
const TILES = ['#FEF0C7|#B54708', '#E0EAFF|#1D4ED8', '#D1FADF|#067647']

function Mini({ icon: Ico, label, value, sub }) {
  return <div className="pm-mini"><span><Ico size={16} strokeWidth={1.75} aria-hidden="true" /></span><div><small>{label}</small><b>{value}</b>{sub && <em>{sub}</em>}</div></div>
}

// Wide side drawer: details card on the LEFT, written sections on the RIGHT.
export default function PersonHost() {
  const [name, setName] = useState(null)
  const [saved, setSaved] = useState(false)
  const [compose, setCompose] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    const on = (e) => { setName(e.detail.name); setSaved(false) }
    window.addEventListener('hrms-person', on)
    return () => window.removeEventListener('hrms-person', on)
  }, [])
  useEffect(() => {
    if (!name) return undefined
    box.current?.focus()
    const key = (e) => { if (e.key === 'Escape') setName(null) }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [name])

  if (!name) return null
  const p = DIRECTORY[name] || { ini: name.split(' ').map((x) => x[0]).join('').slice(0, 2), tone: 'blue', handle: '', role: 'Employee', dept: '', email: '', phone: '', loc: '', code: '', about: 'No profile details yet.', stats: [], exp: [] }
  const [c1, c2] = COVER[name] || ['#334155', '#64748B']
  const [att, leave, assets, manager, shift] = WORK[name] || [95, 6, 1, '—', 'General · 9:30–6:30']
  const first = name.split(' ')[0]
  const copy = (v, label) => { navigator.clipboard?.writeText(v).catch(() => {}); toast({ title: 'Copied', text: `${label}: ${v}`, duration: 2000 }) }

  return (
    <div className="ov-scrim ov-slide-scrim" onMouseDown={() => setName(null)}>
      <section className="pd" role="dialog" aria-modal="true" aria-label={`${name} profile`} tabIndex={-1} ref={box} onMouseDown={(e) => e.stopPropagation()}>
        <aside className="pd-l">
          <div className="pd-cover" style={{ background: `linear-gradient(125deg, ${c1}, ${c2})` }} aria-hidden="true"><i /><i /></div>
          <div className={`pd-av ${p.tone}`}><span>{p.ini}</span><BadgeCheck size={22} strokeWidth={2} className="vb" aria-label="Verified" /></div>
          <h2>{name} <Star size={15} strokeWidth={1.75} fill="#FACC15" color="#FACC15" aria-label="Key contact" /></h2>
          <p className="pd-role">{p.role}<i aria-hidden="true" />{p.dept}</p>
          {p.stats.length > 0 && <dl className="pd-stats">{p.stats.slice(0, 3).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
          <div className="pd-btns">
            <button type="button" className="ov-pbtn" onClick={() => setCompose(true)}><MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />Message</button>
            <button type="button" className="ov-pbtn" onClick={() => { window.location.href = `mailto:${p.email}` }}><Mail size={16} strokeWidth={1.75} aria-hidden="true" />Email</button>
            <button type="button" className={saved ? 'ov-pbtn on' : 'ov-pbtn'} aria-pressed={saved} onClick={() => { setSaved((s) => !s); toast({ title: saved ? 'Removed from favourites' : 'Saved to favourites', duration: 2000 }) }}>{saved ? 'Saved' : 'Save'}<ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" /></button>
          </div>
          <hr />
          <h4>Contact</h4>
          <ul className="pm-contact" style={{ borderTop: 0, paddingTop: 0 }}>
            {p.loc && <li><MapPin size={16} strokeWidth={1.75} aria-hidden="true" />{p.loc}</li>}
            {p.email && <li><Mail size={16} strokeWidth={1.75} aria-hidden="true" /><button type="button" onClick={() => copy(p.email, 'Email')}>{p.email}</button></li>}
            {p.phone && <li><Phone size={16} strokeWidth={1.75} aria-hidden="true" /><button type="button" onClick={() => copy(p.phone, 'Phone')}>{p.phone}</button></li>}
            {p.code && <li><UserRound size={16} strokeWidth={1.75} aria-hidden="true" />Employee code {p.code}</li>}
          </ul>
          <div className="ov-skills">{(SKILLS[name] || []).map((s) => <span key={s}>{s}</span>)}<button type="button" aria-label="Add skill"><Plus size={12} strokeWidth={2} /></button></div>
          {p.exp.length > 0 && (
            <>
              <hr />
              <h4>Work experience</h4>
              <ul className="pd-work">
                {p.exp.map(([t, c, d], i) => {
                  const [bg, fg] = TILES[i % TILES.length].split('|')
                  return <li key={t + c}><span style={{ background: bg, color: fg }}>{c[0]}</span><div><b>{t}</b><small>{c}</small><small>{d}</small></div></li>
                })}
              </ul>
            </>
          )}
        </aside>

        <div className="pd-r">
          <div className="pd-bar">
            <h3>Profile</h3>
            <div>
              <button type="button" aria-label="Copy profile link" onClick={() => copy(`hrms.voltuswave.com/people/${p.handle.replace('@', '')}`, 'Link')}><Link2 size={16} strokeWidth={1.75} /></button>
              <button type="button" aria-label="Close profile" onClick={() => setName(null)}><X size={18} strokeWidth={1.75} /></button>
            </div>
          </div>
          <div className="pd-body">
            <section><h3>Introduction</h3><p className="pd-sub">A short introduction shown in search results.</p><p className="pd-box">{p.about}</p></section>
            <section>
              <h3>Main bio</h3><p className="pd-sub">A brief description of {first}&apos;s role and work.</p>
              <div className="pd-box rich">
                <p>{first} works as {p.role.toLowerCase()} in {p.dept}. {p.about}</p>
                <p>Reports to <button type="button" className="person-link" onClick={() => window.dispatchEvent(new CustomEvent('hrms-person', { detail: { name: manager } }))}><b>{manager}</b></button> and is based in {p.loc || 'the main office'}. Employee code {p.code}.</p>
              </div>
            </section>
            <section>
              <h3>Work snapshot</h3><p className="pd-sub">How things look for {first} right now.</p>
              <div className="pd-grid">
                <Mini icon={CalendarCheck} label="Attendance" value={`${att}%`} sub="this month" />
                <Mini icon={CalendarDays} label="Paid leave left" value={`${leave} days`} sub="of 18" />
                <Mini icon={Boxes} label="Assets held" value={assets} sub="items" />
                <Mini icon={Clock} label="Shift" value={shift.split(' · ')[0]} sub={shift.split(' · ')[1]} />
              </div>
            </section>
            <section>
              <h3>Recent activity</h3><p className="pd-sub">The latest things {first} has done in the portal.</p>
              <div className="pd-box pd-feed"><ActivityFeed items={[
                { id: 1, name: first, ini: p.ini, tone: p.tone, status: 'online', time: 'Just now', text: <>Approved 3 requests in {afLink('Asset explorer')}</>, unread: true },
                { id: 2, name: first, ini: p.ini, tone: p.tone, time: 'Yesterday', text: <>Updated the profile photo</>, file: { type: 'pdf', name: 'ID-card-update.pdf', size: '720 KB' } },
                { id: 3, name: first, ini: p.ini, tone: p.tone, time: '3 days ago', text: <>Applied for {afLink('Paid leave')} · 2 days</>, tags: [['Leave', 'violet'], ['Approved', 'green']] },
              ]} /></div>
            </section>
          </div>
          <div className="pd-foot"><button type="button" className="ov-pbtn" onClick={() => toast({ title: 'Full profile', text: `${name}'s full profile opens in the directory.`, tone: 'info', duration: 2500 })}>View full profile</button></div>
        </div>
      </section>
      <ComposeMessage open={compose} onClose={() => setCompose(false)} to={p.email ? [p.email] : []} />
    </div>
  )
}
