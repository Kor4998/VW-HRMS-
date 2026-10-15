import { useState } from 'react'
import { Search, UserMinus } from 'lucide-react'
import { DIRECTORY, openPerson } from '@/components/person'
import { toast } from '@/components/toast'
import Avatar from '@/components/Avatar'

const ROLES = ['Admin', 'Member', 'Viewer']
const POOL = ['Anita Rao', 'Mohan Pillai', 'Vinod Pasupuleti', 'Kalyani Devarapalli', 'Aasritha Samudrala', 'Diviti Tejesh', 'Charla Venkatesh', 'Sasi Charlespaul', 'Gaurav Bhadani', 'Saisaankhya Katari', 'Bheemachandu Anagani']
const SEATS = 12
const LAST = ['Active now', 'Active 2 hours ago', 'Active yesterday', 'Active Oct 8', 'Active Oct 3']
const TONES = ['blue', 'pink', 'amber', 'green', 'violet', 'teal']

function seed(project) {
  const names = [project.lead, ...POOL.filter((n) => n !== project.lead)].slice(0, Math.min(project.members, SEATS))
  return names.map((name, i) => ({ name, role: i === 0 ? 'Owner' : i === 1 ? 'Admin' : i % 5 === 0 ? 'Viewer' : 'Member', last: LAST[i % LAST.length], tone: TONES[i % TONES.length] }))
}

// Members tab for a project: seat meter, add people from the directory, searchable member list with role + remove, pending invites.
export default function ProjectMembers({ project }) {
  const [members, setMembers] = useState(() => seed(project))
  const [pending, setPending] = useState([{ name: 'Mohan Pillai', role: 'Member', date: 'Oct 8' }, { name: 'Anita Rao', role: 'Viewer', date: 'Oct 9' }].filter((p) => !seed(project).some((m) => m.name === p.name)))
  const [q, setQ] = useState('')
  const [pick, setPick] = useState('')
  const [role, setRole] = useState('Member')
  const free = Object.keys(DIRECTORY).concat(POOL).filter((n, i, a) => a.indexOf(n) === i && !members.some((m) => m.name === n) && !pending.some((p) => p.name === n))
  const used = members.length + pending.length
  const shown = members.filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase()))
  const full = used >= SEATS

  const invite = () => {
    if (!pick || full) return
    setPending((l) => [...l, { name: pick, role, date: 'Today' }])
    toast({ title: 'Invite sent', text: `${pick} was invited as ${role.toLowerCase()}.` })
    setPick('')
  }
  const setRoleOf = (name, r) => setMembers((l) => l.map((m) => (m.name === name ? { ...m, role: r } : m)))
  const remove = (name) => {
    const at = members.findIndex((m) => m.name === name)
    const gone = members[at]
    setMembers((l) => l.filter((m) => m.name !== name))
    toast({ title: 'Member removed', text: `${name} no longer has access to ${project.name}.`, duration: 8000, action: { label: 'Undo', run: () => setMembers((l) => (l.some((m) => m.name === name) ? l : [...l.slice(0, at), gone, ...l.slice(at)])) } })
  }

  return (
    <section className="pm" aria-label="Project members">
      <header className="pm-head">
        <div><h2>Members</h2><p>Manage who can work in {project.name}.</p></div>
        <div className="pm-seats"><span><b>{used}</b> of {SEATS} seats</span><i role="img" aria-label={`${used} of ${SEATS} seats used`}><b style={{ width: `${(used / SEATS) * 100}%` }} /></i></div>
      </header>

      <div className="pm-sec">
        <h3>Add people</h3>
        <div className="pm-invite">
          <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Person" disabled={full}>
            <option value="">{full ? 'No seats left' : 'Choose someone from the directory'}</option>
            {free.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          <button type="button" className="pm-send" disabled={!pick || full} onClick={invite}>Send invite</button>
        </div>
        <p className="pm-note">They get a notification and can start right away once they accept. Invites expire in 7 days.</p>
      </div>

      <div className="pm-sec">
        <div className="pm-sub"><h3>Members <em>{members.length}</em></h3>
          <label className="pm-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" aria-label="Search members" /></label></div>
        <ul className="pm-list">
          {shown.map((m) => {
            const d = DIRECTORY[m.name]
            const email = d?.email || `${m.name.split(' ')[0].toLowerCase()}@voltuswave.com`
            const owner = m.role === 'Owner'
            return (
              <li key={m.name}>
                <button type="button" className="pm-who" onClick={() => openPerson(m.name)} aria-label={`Open ${m.name}'s profile`}>
                  <Avatar name={m.name} size={36} online={m.last === 'Active now'} />
                  <span><b>{m.name}{m.name === 'Venkatesh Korlapati' && <small>You</small>}</b><em>{email}</em></span>
                </button>
                <span className="pm-last">{m.last}</span>
                {owner ? <span className="pm-owner">Owner</span> : <select className="pm-role" value={m.role} onChange={(e) => setRoleOf(m.name, e.target.value)} aria-label={`Role of ${m.name}`}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>}
                {owner ? <span className="pm-x" /> : <button type="button" className="pm-x" aria-label={`Remove ${m.name}`} title="Remove from project" onClick={() => remove(m.name)}><UserMinus size={16} strokeWidth={1.75} /></button>}
              </li>
            )
          })}
          {shown.length === 0 && <li className="pm-none">No members match “{q}”.</li>}
        </ul>
      </div>

      {pending.length > 0 && (
        <div className="pm-sec">
          <h3>Pending invites <em>{pending.length}</em></h3>
          <ul className="pm-list">
            {pending.map((p) => (
              <li key={p.name} className="pend">
                <span className="pm-who"><Avatar name={p.name} size={36} /><span><b>{p.name}</b><em>{p.role} · Invited {p.date}</em></span></span>
                <span /><span />
                <span className="pm-acts">
                  <button type="button" onClick={() => toast({ title: 'Invite resent', text: `${p.name} will get a fresh reminder.` })}>Resend</button>
                  <button type="button" onClick={() => setPending((l) => l.filter((x) => x.name !== p.name))}>Revoke</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <footer className="pm-foot">Changes apply right away.</footer>
    </section>
  )
}
