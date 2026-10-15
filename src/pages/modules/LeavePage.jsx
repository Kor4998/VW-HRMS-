import { Fragment, useMemo, useState } from 'react'
import {
  BookOpen, CalendarClock, CalendarPlus, ChevronDown, ChevronRight, CircleHelp, CircleMinus, CirclePlus, FileDown, FileText, Inbox, PackageOpen, PartyPopper, Plus, RefreshCw, Search, Wallet,
} from 'lucide-react'
import { ArcBars, ArcRing } from '@/components/ArcCharts'
import DonutBreakdown from '@/components/DonutBreakdown'
import { ActionCards, Empty, PageHead, Pager, Section, TableCard, Tabs, Tag } from './ModuleKit'
import { Stat } from './RequestsPanel'
import Slideout from '@/components/Slideout'
import DatePicker from '@/components/DatePicker'
import FilterMenu from '@/components/FilterMenu'
import Steps from '@/components/Steps'
import { toast } from '@/components/toast'
import DateField from '@/components/DateField'

const TABS = [['overview', 'Overview'], ['requests', 'Leave requests'], ['ledger', 'Leave ledger'], ['comp', 'Comp off']]

const WEEK = [['Mon', 1], ['Tue', 1], ['Wed', 2], ['Thu', 2], ['Fri', 4], ['Sat', 0], ['Sun', 0]]
const MONTH = [['Jan', 4], ['Feb', 5], ['Mar', 3], ['Apr', 2], ['May', 1], ['Jun', 1], ['Jul', 0], ['Aug', 3], ['Sep', 0], ['Oct', 0], ['Nov', 0], ['Dec', 0]]
const BALANCES = [
  { name: 'Comp offs', color: '#7C3AED', value: 1, total: 1, label: '1 day', avail: '1 day', used: '0 day', quota: '0 day' },
  { name: 'Paid leave', color: '#3377FF', value: 6.5, total: 18, label: '6.5 days', avail: '6.5 days', used: '16 days', quota: '18 days', extra: [['Accrued so far', '13.5 days'], ['Carry-over', '6 days']] },
  { name: 'Unpaid leave', color: '#0E9384', value: 1, total: 0, label: '∞ days', avail: '∞', used: '12.5 days', quota: '∞' },
]

const REQUESTS = [
  ['2026-09-21', '2026-09-21', '1', '19-09-2026 12:33 PM'], ['2026-08-06', '2026-08-07', '2', '28-07-2026 04:40 AM'], ['2026-06-23', '2026-06-23', '1', '23-06-2026 03:05 AM'],
  ['2026-06-01', '2026-06-01', '1', '29-05-2026 03:35 AM'], ['2026-05-04', '2026-05-04', '1', '03-05-2026 12:15 AM'], ['2026-04-30', '2026-04-30', '0.5', '30-04-2026 04:16 AM'],
  ['2026-03-20', '2026-03-20', '1', '18-03-2026 07:17 PM'], ['2026-03-17', '2026-03-19', '2', '16-03-2026 02:59 PM'], ['2026-03-16', '2026-03-16', '1', '13-03-2026 08:05 PM'],
  ['2026-02-25', '2026-02-27', '3', '23-02-2026 07:56 PM'], ['2026-02-11', '2026-02-13', '3', '11-02-2026 09:02 PM'], ['2026-01-09', '2026-01-09', '0.5', '07-01-2026 02:05 AM'],
].map(([from, to, days, at], i) => ({ id: `r${i}`, type: 'Paid leave', from, to, days, status: 'Approved', at }))

// [month, opening, accrued, used, closing] (closing taken from the company ledger; expiries are not itemised)
const LEDGER = [
  ['January 2026', 0, 8.5, 0.5, 7], ['February 2026', 7, 1.5, 6, 2.5], ['March 2026', 2.5, 1.5, 4, 0], ['April 2026', 0, 1.5, 0.5, 1], ['May 2026', 1, 1.5, 1, 1.5],
  ['June 2026', 1.5, 1.5, 2, 1], ['July 2026', 1, 1.5, 0, 2.5], ['August 2026', 2.5, 4.5, 2, 5], ['September 2026', 4, 1.5, 1, 4.5],
].map(([m, open, acc, used, close]) => ({ m, open, acc, avail: open + acc, used, close }))

const COMP = [{ id: 'c0', worked: '2026-01-01', reason: 'Migrated carry-in balance - no source worked date; see hrms_leave_ledger OPENING_BALANCE', earned: '1', remaining: '1', hours: '--', kind: '--', status: 'Approved', expiry: '--', at: '09-09-2026 02:03 PM' }]
const num = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const TONE = { Approved: 'ok', Pending: 'warn', Rejected: 'err' }

function Field({ label, children }) { return <label className="ov-field"><span>{label}</span>{children}</label> }

// Untitled UI table card: header (title + count badge + description), toolbar (search, filters, dates, action), table, pager footer.
function Table({ title, desc, cols, widths, rows, render, create, onCreate, statuses, empty, dateOf, onRow }) {
  const [q, setQ] = useState('')
  const [st, setSt] = useState([])
  const [dates, setDates] = useState({ from: null, to: null })
  const [pg, setPg] = useState(0)
  const [per, setPer] = useState(10)
  const inDates = (r) => {
    if (!dates.from) return true
    const [f, t] = dateOf(r)
    return new Date(t) >= dates.from && new Date(f) <= new Date(dates.to.getFullYear(), dates.to.getMonth(), dates.to.getDate(), 23, 59)
  }
  const shown = rows.filter((r) => (!st.length || st.includes(r.status)) && inDates(r) && (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())))
  const view = shown.slice(pg * per, pg * per + per)
  const filtered = q || st.length || dates.from
  const clear = () => { setQ(''); setSt([]); setDates({ from: null, to: null }); setPg(0) }
  const opts = statuses.map((v) => ({ value: v, label: v, count: rows.filter((r) => r.status === v).length }))
  return (
    <TableCard
      title={title} count={rows.length} unit="records" desc={desc}
      toolbar={(
        <>
          <label className="mp-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => { setQ(e.target.value); setPg(0) }} placeholder="Search" aria-label={`Search ${title}`} /></label>
          <DatePicker value={dates} onApply={(v) => { setDates(v); setPg(0) }} />
          <FilterMenu label="Filters" options={opts} value={st} onChange={(v) => { setSt(v); setPg(0) }} />
          <div className="grow"><button type="button" className="mp-btn primary" onClick={onCreate}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />{create}</button></div>
        </>
      )}
      footer={shown.length > 0 ? <Pager total={shown.length} page={pg} setPage={setPg} perPage={per} setPerPage={setPer} options={[10, 20, 50]} /> : null}
    >
      {shown.length === 0 ? (
        <Empty icon={PackageOpen} title={filtered ? 'No results found' : empty} text={filtered ? 'Your filters did not match any records. Clear the filters to see them all.' : 'There is nothing here at the moment. Check back later.'}>
          <div className="mp-empty-a">{filtered && <button type="button" className="mp-btn" onClick={clear}>Clear filters</button>}<button type="button" className="mp-btn primary" onClick={onCreate}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />{create}</button></div>
        </Empty>
      ) : (
        <div className="ex-table-wrap" style={{ minHeight: Math.min(per, shown.length) * 52 + 41 }}>
          <table className="ex-table lv-table">
            <colgroup>{widths.map((w, i) => <col key={i} style={w ? { width: w } : undefined} />)}</colgroup>
            <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{view.map((r, i) => <tr key={r.id} className={onRow ? 'clk' : ''} tabIndex={onRow ? 0 : undefined} onClick={() => onRow?.(r)} onKeyDown={(e) => { if (onRow && e.key === 'Enter') onRow(r) }}>{render(r, pg * per + i + 1)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </TableCard>
  )
}

function Ledger() {
  const [open, setOpen] = useState({})
  const [kind, setKind] = useState('All types')
  const [fy, setFy] = useState('Financial Year 2026-2027')
  const [period, setPeriod] = useState('All periods')
  const rows = period === 'All periods' ? LEDGER : LEDGER.filter((r) => r.m.startsWith(period))
  const credits = LEDGER.reduce((a, r) => a + r.acc, 0)
  const debits = LEDGER.reduce((a, r) => a + r.used, 0)
  return (
    <div className="sh-panel">
      <div className="sh-bar">
        <div className="lv-head"><span className="mp-empty-ic"><Wallet size={18} strokeWidth={1.75} aria-hidden="true" /></span><div><h2>My leave ledger</h2><p>Your leave credits, usage and running balance</p></div></div>
        <div className="sh-bar-r">
          <label className="mp-sel"><select value={fy} onChange={(e) => setFy(e.target.value)} aria-label="Fiscal year">{['Financial Year 2026-2027', 'Financial Year 2025-2026'].map((x) => <option key={x}>{x}</option>)}</select><ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" /></label>
          <label className="mp-sel"><select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period"><option>All periods</option>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'].map((x) => <option key={x}>{x}</option>)}</select><ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" /></label>
          <button type="button" className="mp-btn" onClick={() => toast({ title: 'Ledger refreshed', tone: 'info', duration: 2000 })}><RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />Refresh</button>
        </div>
      </div>
      <div className="sh-stats c4">
        <Stat label="Total records" value="24" icon={FileText} tone="blue" />
        <Stat label="Credits" value={credits.toFixed(2)} icon={CirclePlus} tone="green" />
        <Stat label="Debits" value={debits.toFixed(0)} icon={CircleMinus} tone="red" />
        <Stat label="Total available" value="5.50" icon={Wallet} tone="amber" />
      </div>
      <div className="mp-card lv-act">
        <div className="lv-act-h"><b>Leave activity</b>
          <div className="sh-chips" role="group" aria-label="Leave type">
            {['All types', 'Comp off 1/1', 'Paid leave 4.5/21.5'].map((k) => <button key={k} type="button" aria-pressed={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{k}</button>)}
          </div>
        </div>
        <div className="ex-table-wrap">
          <table className="ex-table lv-table">
            <colgroup><col style={{ width: 280 }} /><col /><col /><col /><col /><col /><col /></colgroup>
            <thead><tr><th>Month</th><th className="r">Opening bal.</th><th className="r">Accrued</th><th className="r">Available</th><th className="r">Used</th><th className="r">Closing bal.</th><th className="r">Carry fwd</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <Fragment key={r.m}>
                  <tr className="lv-row" onClick={() => setOpen((o) => ({ ...o, [r.m]: !o[r.m] }))}>
                    <td><button type="button" className="lv-exp" aria-expanded={!!open[r.m]} aria-label={`Toggle ${r.m}`}><ChevronRight size={16} strokeWidth={1.75} className={open[r.m] ? 'on' : ''} /></button><b>{r.m}</b></td>
                    <td className="r">{num(r.open)}</td><td className="r pos">+{num(r.acc)}</td><td className="r avail">{num(r.avail)}</td><td className="r neg">{r.used ? `-${num(r.used)}` : '0'}</td><td className="r"><b>{num(r.close)}</b></td><td className="r">—</td>
                  </tr>
                  {open[r.m] && (
                    <tr key={`${r.m}-d`} className="lv-detail"><td colSpan={7}>
                      <div><span>Monthly accrual</span><b className="pos">+{num(r.acc)} days</b></div>
                      <div><span>Leave taken</span><b className="neg">{r.used ? `-${num(r.used)}` : '0'} days</b></div>
                      <div><span>Opening balance</span><b>{num(r.open)} days</b></div>
                    </td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function LeavePage({ initial = 'overview' }) {
  const [tab, setTab] = useState(initial)
  const [reqs, setReqs] = useState(REQUESTS)
  const [comp, setComp] = useState(COMP)
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)
  const days = (f, t) => Math.max(1, Math.round((new Date(t || f) - new Date(f)) / 864e5) + 1)
  const submit = () => {
    if (form.type === 'Comp off') setComp((l) => [{ id: `c${Date.now()}`, worked: form.from, reason: form.reason || '—', earned: '1', remaining: '1', hours: '--', kind: '--', status: 'Pending', expiry: '--', at: '10-10-2026 11:00 AM' }, ...l])
    else setReqs((l) => [{ id: `n${Date.now()}`, type: form.type, from: form.from, to: form.to || form.from, days: String(days(form.from, form.to)), status: 'Pending', at: '10-10-2026 11:00 AM' }, ...l])
    toast({ title: 'Request sent', text: `${form.type} request submitted for approval.` })
    setForm(null)
    setTab(form.type === 'Comp off' ? 'comp' : 'requests')
  }
  const newForm = (type) => setForm({ type, from: '', to: '', reason: '' })
  const AVAIL = { 'Paid leave': 6.5, 'Comp off': 1, 'Unpaid leave': Infinity }
  const ask = form ? (form.type === 'Comp off' ? 1 : form.from ? days(form.from, form.to) : 0) : 0
  const left = form ? AVAIL[form.type] - ask : 0
  const over = form && form.type !== 'Comp off' && left < 0
  const pending = useMemo(() => reqs.filter((r) => r.status === 'Pending').length, [reqs])

  return (
    <div className="mp">
      <PageHead title="Leave" desc="Balances, requests, your ledger and comp offs.">
        <button type="button" className="mp-select solid">Jan 2026 – Dec 2026 <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" /></button>
      </PageHead>

      <ActionCards items={[
        { icon: CalendarPlus, label: 'Request leave', onClick: () => newForm('Paid leave') },
        { icon: CalendarClock, label: 'Credit comp off', onClick: () => newForm('Comp off') },
        { icon: BookOpen, label: 'Leave policy', onClick: () => toast({ title: 'Leave policy', text: 'Paid leave accrues 1.5 days a month. Comp offs expire after 60 days.', tone: 'info', duration: 6000 }) },
        { icon: FileDown, label: 'Download ledger', onClick: () => toast({ title: 'Ledger downloaded', text: 'leave-ledger-2026.csv is ready.' }) },
      ]} />

      <Tabs label="Leave sections" value={tab} onChange={setTab} items={TABS.map(([k, l]) => [k, l, k === 'requests' ? reqs.length : k === 'comp' ? comp.length : undefined])} />

      {tab === 'overview' && (
        <>
          <Section title="Pending leave requests">
            {pending === 0 ? (
              <div className="mp-card mp-row-empty">
                <span className="mp-empty-ic"><PartyPopper size={20} strokeWidth={1.5} aria-hidden="true" /></span>
                <div><b>Hurray! No pending leave requests</b><p>Request leave using the button above.</p></div>
              </div>
            ) : (
              <div className="mp-card mp-row-empty"><span className="mp-empty-ic"><Inbox size={20} strokeWidth={1.5} aria-hidden="true" /></span><div><b>{pending} pending {pending === 1 ? 'request' : 'requests'}</b><p>Waiting for your manager to review.</p></div><button type="button" className="mp-btn sm" style={{ marginLeft: 'auto' }} onClick={() => setTab('requests')}>View</button></div>
            )}
          </Section>

          <Section title="My leave stats">
            <div className="mp-grid3">
              <div className="mp-card"><div className="mp-card-top"><b>Weekly pattern</b><CircleHelp size={16} strokeWidth={1.75} className="mp-faint" aria-hidden="true" /></div><ArcBars data={WEEK} unit=" days" height={250} /></div>
              <DonutBreakdown className="lv" title="Consumed leave types" centerLabel="Days taken" ranges={[{ key: 'y', label: 'Year', subtitle: 'This leave year', items: [{ label: 'Paid', note: 'Paid leave', value: 16, color: '#6AA8FF' }, { label: 'Unpaid', note: 'Loss of pay', value: 12.5, color: '#14B8A6' }] }]} />
              <div className="mp-card"><div className="mp-card-top"><b>Monthly stats</b><CircleHelp size={16} strokeWidth={1.75} className="mp-faint" aria-hidden="true" /></div><ArcBars data={MONTH} unit=" days" color="#7C5CFA" height={250} /></div>
            </div>
          </Section>

          <Section title="Leave balances">
            <div className="mp-grid3">
              {BALANCES.map((b) => (
                <div key={b.name} className="mp-card mp-bal">
                  <div className="mp-card-top"><b>{b.name}</b><a href="#" onClick={(e) => { e.preventDefault(); setTab('ledger') }}>View ledger</a></div>
                  <div className="mp-center"><ArcRing value={b.value} total={b.total} color={b.color} title={b.label} /></div>
                  <dl className="mp-kv">
                    <div><dt>Available</dt><dd>{b.avail}</dd></div>
                    <div><dt>Consumed</dt><dd>{b.used}</dd></div>
                    {(b.extra || []).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                    <div><dt>Annual quota</dt><dd>{b.quota}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {tab === 'requests' && (
        <Table
          title="Leave requests" desc="Every leave you have asked for. Select a row to see its approval progress." create="Create leave" onCreate={() => newForm('Paid leave')} statuses={['Approved', 'Pending']} rows={reqs} empty="No leave requests found" dateOf={(r) => [r.from, r.to]} onRow={setDetail}
          cols={['S.No.', 'Type', 'From date', 'To date', 'Total days', 'Status', 'Created at']} widths={['6%', '16%', '16%', '16%', '12%', '16%', '18%']}
          render={(r, n) => (<><td>{n}</td><td><b>{r.type}</b></td><td>{r.from}</td><td>{r.to}</td><td>{r.days}</td><td><Tag tone={TONE[r.status]}>{r.status}</Tag></td><td className="ex-date">{r.at}</td></>)}
        />
      )}

      {tab === 'ledger' && <Ledger />}

      {tab === 'comp' && (
        <Table
          title="Compensatory off requests" desc="Extra days you earned by working on a week off or holiday." create="Create request" onCreate={() => newForm('Comp off')} statuses={['Approved', 'Pending']} rows={comp} empty="No comp off requests found" dateOf={(r) => [r.worked, r.worked]}
          cols={['S.No.', 'Worked on', 'Reason', 'Days earned', 'Days remaining', 'Worked hours', 'Work type', 'Status', 'Expiry', 'Created at']} widths={['5%', '9%', '25%', '8%', '9%', '9%', '8%', '9%', '7%', '11%']}
          render={(r, n) => (<><td>{n}</td><td>{r.worked}</td><td title={r.reason}>{r.reason}</td><td>{r.earned}</td><td>{r.remaining}</td><td>{r.hours}</td><td>{r.kind}</td><td><Tag tone={TONE[r.status]}>{r.status}</Tag></td><td>{r.expiry}</td><td className="ex-date">{r.at}</td></>)}
        />
      )}

      <Slideout
        open={!!form} title={form?.type === 'Comp off' ? 'Credit comp off' : 'Request leave'} desc="Your manager will review this request." onClose={() => setForm(null)}
        footer={<><button type="button" className="ov-btn" onClick={() => setForm(null)}>Cancel</button><button type="button" className="ov-btn primary" disabled={!form?.from || over} onClick={submit}>Submit request</button></>}
      >
        {form && (
          <>
            <Field label="Leave type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['Paid leave', 'Unpaid leave', 'Comp off'].map((t) => <option key={t}>{t}</option>)}</select></Field>
            <div className="ov-two">
              <Field label={form.type === 'Comp off' ? 'Worked on' : 'From'}><DateField value={form.from} onChange={(v) => setForm({ ...form, from: v })} empty="Select a date" /></Field>
              {form.type !== 'Comp off' && <Field label="To"><DateField value={form.to} onChange={(v) => setForm({ ...form, to: v })} empty="Select a date" /></Field>}
            </div>
            {form.type !== 'Comp off' && form.from && (
              <p className={over ? 'lv-note warn' : 'lv-note'} role="status">
                {form.type === 'Unpaid leave' ? `${ask} ${ask === 1 ? 'day' : 'days'} will be deducted from pay.` : over ? `You only have ${AVAIL[form.type]} days available. Pick fewer days or another type.` : `${ask} ${ask === 1 ? 'day' : 'days'} requested. You will have ${left} days left.`}
              </p>
            )}
            <Field label="Reason"><textarea rows={4} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
          </>
        )}
      </Slideout>
      <Slideout open={!!detail} title={detail ? `${detail.type} · ${detail.days} ${detail.days === '1' ? 'day' : 'days'}` : ''} desc={detail ? `${detail.from} to ${detail.to}` : ''} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <div className="lv-sum"><span>Status</span><Tag tone={TONE[detail.status]}>{detail.status}</Tag><span>Created</span><b>{detail.at}</b></div>
            <h3 className="lv-h3">Approval progress</h3>
            <Steps label="Approval progress" steps={[
              { title: 'Request submitted', text: detail.at, state: 'done' },
              { title: 'Manager review', text: detail.status === 'Pending' ? 'Waiting for Kalyani Devarapalli' : 'Approved by Kalyani Devarapalli', state: detail.status === 'Pending' ? 'current' : 'done' },
              { title: 'HR confirmation', text: detail.status === 'Pending' ? 'Starts after your manager approves' : 'Confirmed by HR', state: detail.status === 'Pending' ? 'todo' : 'done' },
              { title: 'Balance updated', text: detail.status === 'Pending' ? 'Applied once approved' : `${detail.days} ${detail.days === '1' ? 'day' : 'days'} deducted from Paid leave`, state: detail.status === 'Pending' ? 'todo' : 'done' },
            ]} />
          </>
        )}
      </Slideout>
    </div>
  )
}
