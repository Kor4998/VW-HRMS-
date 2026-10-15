import { useMemo, useState } from 'react'
import Avatar from '@/components/Avatar'
import { ArrowLeftRight, CalendarX2, Check, CircleCheck, ClipboardCheck, Home, Inbox, MessageSquareText, Search, X } from 'lucide-react'
import { PageHead, Pager, Tabs, Tag } from './ModuleKit'
import { toast } from '@/components/toast'
import { openPerson } from '@/components/person'

export const APPROVALS_SEED = [
  { id: 1, kind: 'Leave', who: 'Anita Rao', ini: 'AR', title: 'Paid leave · 2 days', detail: '14 – 15 Oct 2026 · Family function', balance: '6.5 → 4.5 days', at: '2 hours ago', status: 'Pending' },
  { id: 2, kind: 'Shift swap', who: 'Mohan Pillai', ini: 'MP', title: 'Swap with Vinod Pasupuleti', detail: '12 Oct 2026 · General shift', balance: 'No coverage gap', at: '3 hours ago', status: 'Pending' },
  { id: 3, kind: 'Regularization', who: 'Vinod Pasupuleti', ini: 'VP', title: 'Missed punch · 08 Oct', detail: 'Requested out time 6:40 PM · Forgot to punch out', balance: 'Fixes 0h 40m', at: 'Yesterday', status: 'Pending' },
  { id: 4, kind: 'WFH', who: 'Kalyani Devarapalli', ini: 'KD', title: 'Work from home · 1 day', detail: '16 Oct 2026 · Plumber visit', balance: '2 WFH left this month', at: 'Yesterday', status: 'Pending' },
  { id: 5, kind: 'Leave', who: 'Anita Rao', ini: 'AR', title: 'Comp off · 1 day', detail: '03 Oct 2026 · Weekend release', balance: '1 → 0 days', at: '3 days ago', status: 'Approved' },
  { id: 6, kind: 'Regularization', who: 'Mohan Pillai', ini: 'MP', title: 'Late arrival · 05 Oct', detail: 'Reason: bus breakdown', balance: 'Fixes 0h 33m', at: '4 days ago', status: 'Rejected' },
]
const ICON = { Leave: CalendarX2, 'Shift swap': ArrowLeftRight, Regularization: ClipboardCheck, WFH: Home }
const TONE = { Pending: 'warn', Approved: 'ok', Rejected: 'err' }
const KINDS = ['All requests', 'Leave', 'Shift swap', 'Regularization', 'WFH']

export default function ApprovalsPage({ items, setItems }) {
  const [tab, setTab] = useState('Pending')
  const [kind, setKind] = useState('All requests')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState({})
  const [pg, setPg] = useState(0)
  const [per, setPer] = useState(10)
  const count = (s) => items.filter((i) => i.status === s).length

  const shown = useMemo(() => items.filter((i) => i.status === tab && (kind === 'All requests' || i.kind === kind) && (!q || `${i.who} ${i.title} ${i.detail}`.toLowerCase().includes(q.toLowerCase()))), [items, tab, kind, q])
  const view = shown.slice(pg * per, pg * per + per)
  const ids = Object.keys(picked).filter((k) => picked[k]).map(Number).filter((id) => shown.some((s) => s.id === id))

  const decide = (list, status) => {
    setItems((all) => all.map((i) => (list.includes(i.id) ? { ...i, status } : i)))
    setPicked({})
    toast({
      title: `${list.length} ${list.length === 1 ? 'request' : 'requests'} ${status.toLowerCase()}`, text: 'The employee has been notified.', tone: status === 'Approved' ? 'success' : 'warn',
      action: { label: 'Undo', run: () => setItems((all) => all.map((i) => (list.includes(i.id) ? { ...i, status: 'Pending' } : i))) },
    })
  }

  return (
    <div className="mp">
      <PageHead title="Approvals" desc="Requests from your team that are waiting for you." />
      <Tabs label="Approval status" value={tab} onChange={(t) => { setTab(t); setPg(0); setPicked({}) }} items={[['Pending', 'Pending', count('Pending')], ['Approved', 'Approved', count('Approved')], ['Rejected', 'Rejected', count('Rejected')]]} />

      <div className="sh-bar">
        <div className="sh-bar-r">
          <label className="mp-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => { setQ(e.target.value); setPg(0) }} placeholder="Search by person or request" aria-label="Search approvals" /></label>
          <div className="sh-chips" role="group" aria-label="Request type">
            {KINDS.map((k) => <button key={k} type="button" aria-pressed={kind === k} className={kind === k ? 'on' : ''} onClick={() => { setKind(k); setPg(0) }}>{k}</button>)}
          </div>
        </div>
        {tab === 'Pending' && (
          <div className={ids.length > 0 ? 'ap-bulk on' : 'ap-bulk'} aria-hidden={ids.length === 0}>
            <span>{ids.length} selected</span>
            <button type="button" tabIndex={ids.length ? 0 : -1} className="mp-btn sm" onClick={() => decide(ids, 'Rejected')}><X size={14} strokeWidth={1.75} aria-hidden="true" />Reject</button>
            <button type="button" tabIndex={ids.length ? 0 : -1} className="mp-btn sm primary" onClick={() => decide(ids, 'Approved')}><Check size={14} strokeWidth={1.75} aria-hidden="true" />Approve</button>
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="mp-card mp-pad"><div className="mp-empty"><span className="mp-empty-ic">{tab === 'Pending' ? <CircleCheck size={22} strokeWidth={1.5} aria-hidden="true" /> : <Inbox size={22} strokeWidth={1.5} aria-hidden="true" />}</span><b>{tab === 'Pending' ? 'You are all caught up' : `No ${tab.toLowerCase()} requests`}</b><p>{tab === 'Pending' ? 'New requests from your team will show up here.' : 'Nothing to show for these filters.'}</p></div></div>
      ) : (
        <>
          <ul className="ap-list">
            {view.map((i) => {
              const Ico = ICON[i.kind]
              return (
                <li key={i.id} className={picked[i.id] ? 'on' : ''}>
                  {tab === 'Pending' && <input type="checkbox" aria-label={`Select ${i.who}`} checked={!!picked[i.id]} onChange={() => setPicked((p) => ({ ...p, [i.id]: !p[i.id] }))} />}
                  <Avatar name={i.who} size={40} />
                  <div className="ap-main">
                    <b><button type="button" className="person-link" onClick={() => openPerson(i.who)}>{i.who}</button> <span>· {i.at}</span></b>
                    <p><span className="ap-k"><Ico size={14} strokeWidth={1.75} aria-hidden="true" />{i.kind}</span>{i.title}</p>
                    <small><MessageSquareText size={13} strokeWidth={1.75} aria-hidden="true" />{i.detail}</small>
                  </div>
                  <div className="ap-impact"><small>Impact</small><b>{i.balance}</b></div>
                  {tab === 'Pending' ? (
                    <div className="ap-btns">
                      <button type="button" className="mp-btn" onClick={() => decide([i.id], 'Rejected')}>Reject</button>
                      <button type="button" className="mp-btn primary" onClick={() => decide([i.id], 'Approved')}>Approve</button>
                    </div>
                  ) : <Tag tone={TONE[i.status]}>{i.status}</Tag>}
                </li>
              )
            })}
          </ul>
          <Pager total={shown.length} page={pg} setPage={setPg} perPage={per} setPerPage={setPer} options={[10, 20, 50]} />
        </>
      )}
    </div>
  )
}
