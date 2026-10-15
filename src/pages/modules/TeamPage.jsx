import { useMemo, useState } from 'react'
import Avatar from '@/components/Avatar'
import { ChevronLeft, ChevronRight, Mail, MapPin, Building2 } from 'lucide-react'
import { PageHead, Tag } from './ModuleKit'
import { openPerson } from '@/components/person'

const TYPES = [
  ['wfh', 'Work from home'], ['duty', 'On duty'], ['paid', 'Paid leave'], ['unpaid', 'Unpaid leave'],
  ['noatt', 'Leave due to no attendance'], ['woff', 'Weekly off'], ['hol', 'Holiday'],
]
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WD = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const HOLIDAYS = { '2026-9-2': 1, '2026-9-20': 1, '2026-8-8': 1 } // month is 0-based: Oct 2, Oct 20, Sep 8
const PEOPLE = [
  { name: 'Abishek Aare', ini: 'AA', tone: 'blue', role: 'Digital Growth & Events Associate', loc: 'Hyderabad', dept: 'Sales', email: 'abishek.a@voltuswave.com', status: 'NOT IN YET', leave: { '2026-9-5': 'paid', '2026-9-6': 'paid', '2026-9-21': 'noatt', '2026-9-22': 'noatt' } },
  { name: 'Venkatesh Korlapati', ini: 'VK', tone: 'blue', role: 'UI Designer', loc: 'Hyderabad', dept: 'Engineering', email: 'korlapati.venkatesh@voltuswave.com', status: 'IN', me: true, leave: { '2026-9-14': 'wfh', '2026-9-15': 'wfh' } },
  { name: 'Samudrala Aasritha', ini: 'SA', tone: 'pink', role: 'HR & Training Coordinator', loc: 'Hyderabad', dept: 'HR', email: 'aasritha.s@voltuswave.com', status: 'NOT IN YET', leave: { '2026-9-9': 'unpaid', '2026-9-13': 'duty' } },
]
const STATUS_TONE = { 'NOT IN YET': 'info', IN: 'ok', 'WEEKLY OFF': undefined }

function kindOf(person, y, m, d) {
  const k = `${y}-${m}-${d}`
  if (HOLIDAYS[k]) return 'hol'
  const dow = new Date(y, m, d).getDay()
  if (dow === 0 || dow === 6) return 'woff'
  return person.leave[k] || null
}

function Row({ person, y, m, days }) {
  const kinds = Array.from({ length: days }, (_, i) => kindOf(person, y, m, i + 1))
  return (
    <div className="tm-row">
      <span className="tm-who"><Avatar name={person.name} size={28} />{person.name}</span>
      <div className="tm-days">
        {kinds.map((k, i) => {
          const join = k && (k === 'woff' || k === 'hol' || k === 'paid' || k === 'unpaid' || k === 'noatt')
          const prev = join && kinds[i - 1] && ['woff', 'hol', 'paid', 'unpaid', 'noatt'].includes(kinds[i - 1])
          const next = join && kinds[i + 1] && ['woff', 'hol', 'paid', 'unpaid', 'noatt'].includes(kinds[i + 1])
          return <span key={i} className={`tm-d${k ? ` ${k}` : ''}${prev ? ' jl' : ''}${next ? ' jr' : ''}`} title={k ? TYPES.find((t) => t[0] === k)[1] : undefined}>{i + 1}</span>
        })}
      </div>
    </div>
  )
}

export default function TeamPage() {
  const [cur, setCur] = useState({ y: 2026, m: 9 })
  const days = new Date(cur.y, cur.m + 1, 0).getDate()
  const heads = useMemo(() => Array.from({ length: days }, (_, i) => WD[new Date(cur.y, cur.m, i + 1).getDay()]), [cur, days])
  const step = (n) => setCur(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })

  return (
    <div className="mp tmp">
      <PageHead title="My team" desc="Who is out, who is in, and how your team's month looks." />

      <div className="tm-two">
        <section className="tm-panel"><h3>Who is on leave today</h3><p className="tm-note">No employee is on leave today.</p></section>
        <section className="tm-panel"><h3>Not in yet today</h3><p className="tm-note">All employees are already in.</p></section>
      </div>

      <div className="tm-counters">
        {[['Employees on time today', 2, 'teal'], ['Late arrivals today', 0, 'rose'], ['Work from home / on duty today', 0, 'lime'], ['Remote clock-ins today', 0, 'amber']].map(([l, v, t]) => (
          <div key={l} className={`tm-c ${t}`}><span>{l}</span><b>{v}</b></div>
        ))}
      </div>

      <section className="tm-sec">
        <h2>Team calendar</h2>
        <div className="tm-cal">
          <div className="tm-head">
            <div className="tm-nav"><button type="button" aria-label="Previous month" onClick={() => step(-1)}><ChevronLeft size={16} strokeWidth={1.75} /></button><b>{MONTHS[cur.m].slice(0, 3)} {cur.y}</b><button type="button" aria-label="Next month" onClick={() => step(1)}><ChevronRight size={16} strokeWidth={1.75} /></button></div>
            <div className="tm-days tm-dow">{heads.map((h, i) => <span key={i} className="tm-d">{h}</span>)}</div>
          </div>
          {PEOPLE.slice(0, 2).concat(PEOPLE[2]).filter((p) => !p.me).map((p) => <Row key={p.name} person={p} y={cur.y} m={cur.m} days={days} />)}
          <ul className="tm-legend" aria-label="Legend">
            {TYPES.map(([k, l]) => <li key={k}><i className={k} />{l}</li>)}
          </ul>
        </div>
      </section>

      <section className="tm-sec">
        <h2>Peers <em>({PEOPLE.length})</em></h2>
        <div className="tm-peers">
          {PEOPLE.map((p) => (
            <button key={p.name} type="button" className="tm-peer" onClick={() => openPerson(p.name)} aria-label={`Open ${p.name}'s profile`}>
              <Avatar name={p.name} size={64} />
              <span className="tm-info">
                <b>{p.name}{p.me && <small>You</small>}</b>
                <em>{p.role}</em>
                <span><MapPin size={14} strokeWidth={1.75} aria-hidden="true" />Location: {p.loc}</span>
                <span><Building2 size={14} strokeWidth={1.75} aria-hidden="true" />Department: {p.dept}</span>
                <span className="tm-mail"><Mail size={14} strokeWidth={1.75} aria-hidden="true" />{p.email}</span>
              </span>
              <span className="tm-tags"><Tag tone={STATUS_TONE[p.status]}>{p.status}</Tag></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
