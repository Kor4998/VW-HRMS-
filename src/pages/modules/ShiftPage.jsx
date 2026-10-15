import { useState } from 'react'
import { toast } from '@/components/toast'
import {
  ArrowLeftRight, Ban, Briefcase, CalendarDays, CalendarX2, CircleCheck, ClipboardCheck, Hand, CircleX, Clock, FileText,
  Phone, Sun, TriangleAlert, User, X,
} from 'lucide-react'
import { ActionCards, PageHead } from './ModuleKit'
import { Requests, Stat } from './RequestsPanel'
import CalendarKit from './CalendarKit'

const TABS = [['roster', 'My roster'], ['swap', 'Shift swap'], ['approval', 'Shift approval'], ['claim', 'Shifts claim']]

const TODAY = new Date(2026, 9, 10)
const HOLIDAY_MAP = { '2026-10-2': 'Mahatma Gandhi Jayanti', '2026-10-20': 'Dussehra' }
const dkey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6

function shiftEvents(d, view) {
  const hol = HOLIDAY_MAP[dkey(d)]
  if (hol) return [{ id: `h${dkey(d)}`, label: hol, allDay: true, tone: 'amber' }]
  if (isWeekend(d)) return [{ id: `w${dkey(d)}`, label: 'Week off', allDay: true, tone: 'grey' }]
  if (view === 'month') return [{ id: `s${dkey(d)}`, label: 'General shift', time: '9:30 AM - 6:30 PM', tone: 'blue' }]
  return [
    { id: `s${dkey(d)}`, label: 'General shift', time: '9:30 AM – 6:30 PM', start: 9.5, end: 18.5, tone: 'blue' },
    { id: `b${dkey(d)}`, label: 'Lunch break', time: '1:00 – 2:00 PM', start: 13, end: 14, tone: 'amber', overlay: true },
  ]
}

function Roster() {
  return (
    <div className="sh-panel">
      <div className="sh-stats c5">
        <Stat label="Working days" value="20" icon={Briefcase} tone="blue" />
        <Stat label="Week offs" value="9" icon={CalendarX2} tone="violet" />
        <Stat label="Holidays" value="2" icon={Sun} tone="amber" />
        <Stat label="On call" value="0" icon={Phone} tone="teal" />
        <Stat label="No shift" value="0" icon={TriangleAlert} tone="red" />
      </div>
      <CalendarKit today={TODAY} initialView="month" eventsFor={shiftEvents} isOff={isWeekend} />
    </div>
  )
}

function Swap() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ date: '12 Oct 2026', who: 'Anita Rao', reason: '' })
  const count = (s) => rows.filter((r) => r.status === s).length
  const stats = [
    { label: 'Total requests', value: rows.length, icon: FileText, tone: 'blue' },
    { label: 'Pending employee', value: count('Pending employee'), icon: User, tone: 'amber' },
    { label: 'Pending manager', value: count('Pending manager'), icon: Clock, tone: 'violet' },
    { label: 'Open', value: 0, icon: CalendarDays, tone: 'teal' },
    { label: 'Rejected', value: 0, icon: CircleX, tone: 'red' },
    { label: 'Completed', value: 0, icon: ArrowLeftRight, tone: 'green' },
    { label: 'Cancelled', value: 0, icon: Ban, tone: 'grey' },
  ]
  const submit = (e) => {
    e.preventDefault()
    setRows((r) => [{ id: Date.now(), requested: '09 Oct 2026', mine: `${form.date} · GS`, with: form.who, theirs: `${form.date} · GS`, reason: form.reason || '—', status: 'Pending employee' }, ...r])
    setOpen(false)
    toast({ title: 'Swap request sent', text: `${form.who} has been asked to swap shifts on ${form.date}.` })
    setForm({ date: '12 Oct 2026', who: 'Anita Rao', reason: '' })
  }
  return (
    <Requests
      title="Shift swap requests" stats={stats} rows={rows} createLabel="Create shift swap request" onCreate={() => setOpen((o) => !o)}
      statuses={['Pending employee', 'Pending manager', 'Rejected', 'Completed', 'Cancelled']} types={['All request types', 'Swap', 'Give away']}
      columns={['Requested on', 'My shift', 'Swap with', 'Their shift', 'Reason', 'Status']}
      emptyTitle="No shift swap requests found" emptyText="There are no shift swap requests available at the moment. Try adjusting your search criteria, modifying filters, or check back later."
    >
      {open && (
        <form className="mp-card sh-form" onSubmit={submit}>
          <div className="sh-form-h"><b>New shift swap request</b><button type="button" aria-label="Close" onClick={() => setOpen(false)}><X size={16} strokeWidth={1.75} /></button></div>
          <label><span>Shift to swap</span>
            <select value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}>{['12 Oct 2026', '13 Oct 2026', '14 Oct 2026', '15 Oct 2026', '16 Oct 2026'].map((d) => <option key={d}>{d}</option>)}</select></label>
          <label><span>Swap with</span>
            <select value={form.who} onChange={(e) => setForm({ ...form, who: e.target.value })}>{['Anita Rao', 'Vinod Pasupuleti', 'Mohan Pillai'].map((d) => <option key={d}>{d}</option>)}</select></label>
          <label className="wide"><span>Reason</span><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Why do you need this swap?" /></label>
          <div className="sh-form-f"><button type="button" className="mp-btn" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="mp-btn primary">Send request</button></div>
        </form>
      )}
    </Requests>
  )
}

export default function ShiftPage({ initial = 'roster' }) {
  const [tab, setTab] = useState(initial)
  return (
    <div className="mp">
      <PageHead title="Shift management" desc="Your roster, swaps, approvals and open shifts." />
      <ActionCards items={[
        { icon: CalendarDays, label: 'View my roster', onClick: () => setTab('roster') },
        { icon: ArrowLeftRight, label: 'Swap a shift', onClick: () => setTab('swap') },
        { icon: ClipboardCheck, label: 'Shift approvals', onClick: () => setTab('approval') },
        { icon: Hand, label: 'Claim an open shift', onClick: () => setTab('claim') },
      ]} />
      <section className="ex-sec">
        <h2>Shift explorer</h2>
        <div className="mp-tabs" role="tablist" aria-label="Shift sections">
          {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
        </div>

      {tab === 'roster' && <Roster />}
      {tab === 'swap' && <Swap />}
      {tab === 'approval' && (
        <Requests
          title="Shift approval requests" search rows={[]}
          stats={[{ label: 'Pending decisions', value: 0, icon: Clock, tone: 'amber' }, { label: 'Responded', value: 0, icon: CircleCheck, tone: 'green' }]}
          statuses={['Pending', 'Approved', 'Rejected']} types={['All request types', 'Swap', 'Roster change']}
          columns={['Requested on', 'Employee', 'Shift', 'Request', 'Reason', 'Status']}
          emptyTitle="No shift approval requests found" emptyText="There are no shift approval requests available at the moment. Try adjusting your search criteria, modifying filters, or check back later."
        />
      )}
      {tab === 'claim' && (
        <Requests
          title="Open shift pool" search rows={[]}
          stats={[{ label: 'Open shifts', value: 0, icon: FileText, tone: 'blue' }, { label: 'Available to claim', value: 0, icon: CircleCheck, tone: 'green' }, { label: 'Already claimed', value: 0, icon: Clock, tone: 'amber' }]}
          columns={['Date', 'Shift', 'Timing', 'Location', 'Slots', 'Status']}
          emptyTitle="No open shift pool found" emptyText="There are no open shifts available at the moment. Try adjusting your search criteria, modifying filters, or check back later."
        />
      )}
      </section>
    </div>
  )
}
