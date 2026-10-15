import { useState } from 'react'
import Avatar from '@/components/Avatar'
import { BadgeCheck, BriefcaseBusiness, Building2, Check, Hash, IdCard, Mail, MapPin, MessageCircle, Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import { Empty } from './ModuleKit'
import { PROFILE_DEFAULT } from './profileData'
import FileUpload from '@/components/FileUpload'
import Slideout from '@/components/Slideout'
import { toast } from '@/components/toast'
import DateField from '@/components/DateField'

const MAX_BIO = 160
const SKILLS = ['UI design', 'Figma', 'Design systems', 'Prototyping']

function Section({ title, desc, aside, children }) {
  return (
    <section className="pr-sec">
      <header><div><h3>{title}</h3>{desc && <p>{desc}</p>}</div>{aside}</header>
      {children}
    </section>
  )
}

// One label | value row. `keys` are the data fields shown/edited together.
function Row({ label, keys, data, setData, editing, readOnly, hint }) {
  return (
    <div className="pr-row">
      <b>{label}</b>
      <div className={keys.length > 1 ? 'pr-val two' : 'pr-val'}>
        {keys.map(([k, ph]) => editing && !readOnly
          ? <input key={k} className="pr-input" value={data[k]} placeholder={ph} aria-label={ph} onChange={(e) => setData((d) => ({ ...d, [k]: e.target.value }))} />
          : <span key={k} className="pr-text">{data[k] || <i>--</i>}</span>)}
        {hint}
      </div>
    </div>
  )
}

function Static({ label, value }) {
  return <div className="pr-row"><b>{label}</b><div className="pr-val"><span className="pr-text">{value || <i>--</i>}</span></div></div>
}

function Field({ label, children }) {
  return <label className="ov-field"><span>{label}</span>{children}</label>
}

function RowItem({ icon: Ico, title, sub, meta, onRemove }) {
  return (
    <li className="pr-item">
      <span className="pr-item-ic"><Ico size={18} strokeWidth={1.75} aria-hidden="true" /></span>
      <div><div className="pr-item-t"><b>{title}</b></div><small>{sub}</small>{meta && <small>{meta}</small>}</div>
      <button type="button" className="ov-x" aria-label={`Remove ${title}`} onClick={onRemove}><Trash2 size={16} strokeWidth={1.75} /></button>
    </li>
  )
}

const BLANK_EXP = { role: '', company: '', dept: '', type: 'Full-time', from: '', to: '', about: '' }
const BLANK_NOM = { name: '', relation: 'Spouse', dob: '', share: '', phone: '' }

export default function ProfileEditor({ profile, onSave }) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(true)
  const [data, setData] = useState(profile || PROFILE_DEFAULT)
  const [draft, setDraft] = useState(profile || PROFILE_DEFAULT)
  const [exps, setExps] = useState([])
  const [noms, setNoms] = useState([])
  const [panel, setPanel] = useState(null) // 'exp' | 'nom'
  const [form, setForm] = useState(BLANK_EXP)
  const openPanel = (k) => { setForm(k === 'exp' ? BLANK_EXP : BLANK_NOM); setPanel(k) }
  const saveExp = () => { setExps((l) => [{ id: Date.now(), ...form }, ...l]); setPanel(null); toast({ title: 'Work experience added', text: `${form.role} at ${form.company} is now on your profile.` }) }
  const saveNom = () => { setNoms((l) => [{ id: Date.now(), ...form }, ...l]); setPanel(null); toast({ title: 'Nominee added', text: `${form.name} was added as ${form.relation.toLowerCase()}.` }) }
  const shown = editing ? draft : data
  const setShown = editing ? setDraft : setData
  const full = `${data.first} ${data.last}`.trim()

  const start = () => { setDraft(data); setEditing(true); setSaved(false) }
  const cancel = () => { setEditing(false); setSaved(true) }
  const save = () => { setData(draft); onSave?.(draft); setEditing(false); setSaved(true); toast({ title: 'Successfully updated profile', text: 'Your changes have been saved.' }) }
  const props = { data: shown, setData: setShown, editing }

  return (
    <div className="pr">
      <div className="pr-top">
        <div>
          <h1>{full}</h1>
          <p>UI Designer <span aria-hidden="true">|</span> Sales &amp; Marketing</p>
        </div>
        <div className="pr-top-a">
          {saved ? <span className="pr-saved"><Check size={14} strokeWidth={2.25} aria-hidden="true" />Changes saved</span> : <span className="pr-saved warn">Unsaved changes</span>}
          {editing ? (
            <>
              <button type="button" className="mp-btn" onClick={cancel}>Cancel</button>
              <button type="button" className="mp-btn primary" onClick={save}>Save changes</button>
            </>
          ) : (
            <button type="button" className="mp-btn primary" onClick={start}><Pencil size={16} strokeWidth={1.75} aria-hidden="true" />Edit profile</button>
          )}
        </div>
      </div>

      <div className="pr-layout">
        <div className="pr-main">
          <Section title="Introduction" desc="A short introduction your teammates will see.">
            {editing
              ? <textarea className="pr-area" rows={3} maxLength={MAX_BIO} value={draft.bio} aria-label="Introduction" onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))} />
              : <p className="pr-bio">{data.bio}</p>}
            {editing && <small className="pr-left">{MAX_BIO - draft.bio.length} characters left</small>}
          </Section>

          <Section title="Personal information" desc="Your name and basic details as held by HR.">
            <div className="pr-box">
              <Row label="Name" keys={[['first', 'First name'], ['last', 'Last name']]} {...props} />
              <Row label="Display name" keys={[['display', 'Display name'], ['nick', 'Nick name']]} {...props} />
              <Row label="Salutation" keys={[['salutation', 'Salutation']]} {...props} />
              <Row label="Date of birth" keys={[['dob', 'Date of birth']]} {...props} />
              <Row label="Gender" keys={[['gender', 'Gender']]} {...props} />
              <Row label="Nationality" keys={[['nation', 'Nationality']]} {...props} />
              <Row label="Marital status · Blood group" keys={[['marital', 'Marital status'], ['blood', 'Blood group']]} {...props} />
              <Row label="National ID" keys={[['nid', 'National ID']]} {...props} />
            </div>
          </Section>

          <Section title="Contact & address" desc="How we can reach you.">
            <div className="pr-box">
              <Row label="Email address" keys={[['email', 'Email']]} readOnly {...props} hint={<span className="pr-verified"><BadgeCheck size={14} strokeWidth={2} aria-hidden="true" />Verified</span>} />
              <Row label="Mobile" keys={[['mobile', 'Mobile']]} {...props} />
              <Row label="Alternate phone" keys={[['alt', 'Alternate phone']]} {...props} />
              <Row label="Present address" keys={[['present', 'Present address']]} {...props} />
              <Row label="Permanent address" keys={[['permanent', 'Permanent address']]} {...props} />
            </div>
          </Section>

          <Section title="Employment" desc="Where you sit in the company. Managed by HR.">
            <div className="pr-box">
              <Static label="Company" value="VoltusWave" />
              <Static label="Department" value="Sales & Marketing" />
              <Static label="Designation" value="UI Designer" />
              <Static label="Company level" value="Individual Contributor" />
              <Static label="Reporting manager" value="Kalyani Devarapalli" />
              <Static label="Employee status" value="Active" />
              <Static label="Employment type" value="" />
              <Static label="Date of joining" value="" />
              <Static label="CTC · Gross pay" value="" />
            </div>
          </Section>

          <Section title="Work experience" desc="Roles you held before joining." aside={<button type="button" className="mp-btn sm" onClick={() => openPanel('exp')}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Add</button>}>
            {exps.length === 0
              ? <div className="pr-empty"><Empty icon={BriefcaseBusiness} title="No work experience added" text="Add your previous roles so your profile is complete." /></div>
              : <ul className="pr-list">{exps.map((x) => <RowItem key={x.id} icon={BriefcaseBusiness} title={x.role} sub={`${x.company}${x.dept ? ` · ${x.dept}` : ''} · ${x.type}`} meta={`${x.from || '—'} to ${x.to || 'present'}`} onRemove={() => setExps((l) => l.filter((y) => y.id !== x.id))} />)}</ul>}
          </Section>

          <Section title="Documents" desc="Identity, compliance and supporting files for HR to verify.">
            <FileUpload onComplete={(f) => toast({ title: 'Document uploaded', text: `${f.name} is waiting for HR verification.` })} />
          </Section>

          <Section title="Contacts & nominees" desc="Nominee and emergency contacts." aside={<button type="button" className="mp-btn sm" onClick={() => openPanel('nom')}><Plus size={14} strokeWidth={1.75} aria-hidden="true" />Add</button>}>
            {noms.length === 0
              ? <div className="pr-empty"><Empty icon={UsersRound} title="No nominees added yet" text="Add nominee details to keep records up to date." /></div>
              : <ul className="pr-list">{noms.map((x) => <RowItem key={x.id} icon={UsersRound} title={x.name} sub={`${x.relation}${x.share ? ` · ${x.share}% share` : ''}`} meta={x.phone || undefined} onRemove={() => setNoms((l) => l.filter((y) => y.id !== x.id))} />)}</ul>}
          </Section>

          <Section title="Designation tenure" desc="History of your designations.">
            <div className="pr-empty"><Empty icon={IdCard} title="No designation tenure records found" text="Changes to your designation will be listed here." /></div>
          </Section>
        </div>

        <aside className="pr-card" aria-label="Profile summary">
          <div className="pr-cover" aria-hidden="true" />
          <div className="pr-av"><Avatar name={full} src={`${import.meta.env.BASE_URL}avatars/p8.jpg`} size={84} /><span className="pr-badge" role="img" aria-label="Verified"><BadgeCheck size={16} strokeWidth={2.25} aria-hidden="true" /></span></div>
          <div className="pr-body">
            <h2>{full}</h2>
            <p>UI Designer <span aria-hidden="true">|</span> VoltusWave</p>

            <dl className="pr-stats">
              <div><dd>6.5 d</dd><dt>Leave balance</dt></div>
              <div><dd>1</dd><dt>Comp offs</dt></div>
              <div><dd>91%</dd><dt>Attendance</dt></div>
            </dl>

            <div className="pr-btns">
              <button type="button" className="mp-btn" onClick={start}><Pencil size={16} strokeWidth={1.75} aria-hidden="true" />Edit</button>
              <button type="button" className="mp-btn"><MessageCircle size={16} strokeWidth={1.75} aria-hidden="true" />Message HR</button>
            </div>

            <div className="pr-div" />
            <h4>About</h4>
            <p className="pr-about">{data.bio}</p>
            <ul className="pr-facts">
              <li><Hash size={14} strokeWidth={1.75} aria-hidden="true" />{data.code}</li>
              <li><Mail size={14} strokeWidth={1.75} aria-hidden="true" />{data.email}</li>
              <li><MapPin size={14} strokeWidth={1.75} aria-hidden="true" />Hyderabad, India</li>
              <li><Building2 size={14} strokeWidth={1.75} aria-hidden="true" />VoltusWave · Sales &amp; Marketing</li>
            </ul>
            <div className="pr-tags">{SKILLS.map((s) => <span key={s}>{s}</span>)}</div>

            <div className="pr-div" />
            <h4>Reports to</h4>
            <div className="pr-mgr"><Avatar name="Kalyani Devarapalli" size={40} /><div><b>Kalyani Devarapalli</b><small>Reporting manager</small></div></div>
          </div>
        </aside>
      </div>
      <Slideout
        open={panel === 'exp'} title="Add work experience" desc="Tell us about a role you held before joining." onClose={() => setPanel(null)}
        footer={<><button type="button" className="ov-btn" onClick={() => setPanel(null)}>Cancel</button><button type="button" className="ov-btn primary" disabled={!form.role || !form.company} onClick={saveExp}>Add experience</button></>}
      >
        <Field label="Designation"><input value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Product Designer" /></Field>
        <Field label="Company"><input value={form.company || ''} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" /></Field>
        <div className="ov-two">
          <Field label="Department"><input value={form.dept || ''} onChange={(e) => setForm({ ...form, dept: e.target.value })} /></Field>
          <Field label="Employment type"><select value={form.type || 'Full-time'} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['Full-time', 'Part-time', 'Contract', 'Internship'].map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <div className="ov-two">
          <Field label="Start date"><DateField value={form.from || ''} onChange={(v) => setForm({ ...form, from: v })} empty="Select start date" /></Field>
          <Field label="End date"><DateField value={form.to || ''} onChange={(v) => setForm({ ...form, to: v })} empty="Select end date" /></Field>
        </div>
        <Field label="What did you do?"><textarea rows={4} value={form.about || ''} onChange={(e) => setForm({ ...form, about: e.target.value })} /></Field>
      </Slideout>
      <Slideout
        open={panel === 'nom'} title="Add nominee" desc="Who should we contact or pay benefits to?" onClose={() => setPanel(null)}
        footer={<><button type="button" className="ov-btn" onClick={() => setPanel(null)}>Cancel</button><button type="button" className="ov-btn primary" disabled={!form.name} onClick={saveNom}>Add nominee</button></>}
      >
        <Field label="Full name"><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <div className="ov-two">
          <Field label="Relationship"><select value={form.relation || 'Spouse'} onChange={(e) => setForm({ ...form, relation: e.target.value })}>{['Spouse', 'Parent', 'Child', 'Sibling', 'Other'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Date of birth"><DateField value={form.dob || ''} onChange={(v) => setForm({ ...form, dob: v })} empty="Select date of birth" /></Field>
        </div>
        <div className="ov-two">
          <Field label="Share (%)"><input type="number" min="0" max="100" value={form.share || ''} onChange={(e) => setForm({ ...form, share: e.target.value })} /></Field>
          <Field label="Phone"><input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        </div>
      </Slideout>
    </div>
  )
}
