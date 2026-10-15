import { useMemo, useState } from 'react'
import Avatar from '@/components/Avatar'
import {
  ArrowLeftRight, Boxes, Copy, Eye, Headphones, Keyboard, Monitor, Mouse, MoreVertical, Package, PackageOpen, Ticket, Undo2, Cpu, Pin, Search,
} from 'lucide-react'
import { ActionCards, Empty, PageHead, Pager, PopMenu, TableCard, Tag } from './ModuleKit'
import DatePicker from '@/components/DatePicker'
import FilterMenu from '@/components/FilterMenu'
import Slideout from '@/components/Slideout'
import { toast } from '@/components/toast'
import { openPerson } from '@/components/person'

const CAT_ICON = { CPU: Cpu, Headset: Headphones, Mouse, Keyboard, Monitor, 'Extension Box': Package }
const KIND = { asset: ['Asset', 'violet'], request: ['Request', 'info'], transfer: ['Transfer', 'warn'], ticket: ['Ticket', 'err'] }
const TONE = { Approved: 'ok', Pending: 'warn', Rejected: 'err', Open: 'info', Resolved: 'ok', 'In use': 'ok' }
const TABS = [['all', 'View all'], ['asset', 'My assets'], ['request', 'Requests'], ['transfer', 'Transfers'], ['ticket', 'Tickets']]
const PEOPLE = {
  aas: { name: 'Aasritha Samudrala', email: 'aasritha@voltuswave.com', ini: 'AS', tone: 'pink' },
  kal: { name: 'Kalyani Devarapalli', email: 'kalyani@voltuswave.com', ini: 'KD', tone: 'amber' },
  it: { name: 'IT Support', email: 'it@voltuswave.com', ini: 'IT', tone: 'blue' },
}

const ASSETS = [
  ['cooler master', '00003', 'CPU'], ['Fingers', '00465', 'Headset'], ['logitech', '00393', 'Mouse'], ['logitech', '00033', 'Keyboard'],
  ['Stone - Extension Box', '01160', 'Extension Box'], ['ViewSonic', '00979', 'Monitor'], ['ViewSonic', '00928', 'Monitor'],
].map(([name, code, cat], i) => ({ id: `a${i}`, kind: 'asset', name, sub: `${code} · ${cat}`, cat, code, status: 'In use', by: PEOPLE.aas, date: '03-09-2026' }))
const REQS = [
  ['Stone - Extension Box', '03-09-2026'], ['Fingers', '03-09-2026'], ['ViewSonic', '03-09-2026'], ['ViewSonic', '03-09-2026'], ['logitech', '03-09-2026'], ['logitech', '03-09-2026'], ['cooler master', '03-09-2026'],
].map(([name, date], i) => ({ id: `r${i}`, kind: 'request', name, sub: 'Asset request', status: 'Approved', by: PEOPLE.aas, date }))

function Who({ p }) {
  return (
    <button type="button" className="ex-who person-link" onClick={() => openPerson(p.name)} aria-label={`Open ${p.name} profile`}>
      <Avatar name={p.name} size={36} />
      <span><b>{p.name}</b><small>{p.email}</small></span>
    </button>
  )
}

function ItemIcon({ it }) {
  const Ico = it.kind === 'asset' ? CAT_ICON[it.cat] || Boxes : it.kind === 'request' ? Package : it.kind === 'transfer' ? ArrowLeftRight : Ticket
  return <span className="ex-ic"><Ico size={18} strokeWidth={1.75} aria-hidden="true" /></span>
}

function Field({ label, children }) { return <label className="ov-field"><span>{label}</span>{children}</label> }

export default function AssetPage({ initial = 'all' }) {
  const [items, setItems] = useState([...REQS, ...ASSETS])
  const [tab, setTab] = useState(TABS.some(([k]) => k === initial) ? initial : 'all')
  const [q, setQ] = useState('')
  const [stSel, setStSel] = useState([])
  const [dates, setDates] = useState({ from: null, to: null })
  const [pg, setPg] = useState(0)
  const [per, setPer] = useState(20)
  const [panel, setPanel] = useState(null)
  const [form, setForm] = useState({})
  const [picked, setPicked] = useState({})
  const open = (k, init = {}) => { setForm(init); setPanel(k) }
  const set = (k) => (e) => setForm((x) => ({ ...x, [k]: e.target.value }))
  const today = '10-10-2026'
  const assetNames = ASSETS.map((a) => `${a.name} (${a.code})`)

  const add = (it) => setItems((l) => [{ id: `n${Date.now()}`, by: PEOPLE.it, date: today, ...it }, ...l])
  const submit = () => {
    if (panel === 'req') { add({ kind: 'request', name: form.asset, sub: 'Asset request', status: 'Pending' }); toast({ title: 'Asset requested', text: `${form.asset} is waiting for approval.` }) }
    if (panel === 'tr') { add({ kind: 'transfer', name: form.asset, sub: `${form.kind} to ${form.to}`, status: 'Pending', by: PEOPLE.kal }); toast({ title: 'Transfer raised', text: `${form.kind} request sent to ${form.to}.` }) }
    if (panel === 'tk') { add({ kind: 'ticket', name: form.asset, sub: form.issue, status: 'Open' }); toast({ title: 'Ticket raised', text: 'IT support will get back to you shortly.' }) }
    setPanel(null)
  }

  const counts = useMemo(() => Object.fromEntries(TABS.map(([k]) => [k, k === 'all' ? items.length : items.filter((i) => i.kind === k).length])), [items])
  const dOf = (it) => { const [d, m, y] = it.date.split('-').map(Number); return new Date(y, m - 1, d) }
  const statusOpts = [...new Set(items.map((i) => i.status))].map((v) => ({ value: v, label: v, count: items.filter((i) => i.status === v).length }))
  const shown = items.filter((i) => (tab === 'all' || i.kind === tab) && (!stSel.length || stSel.includes(i.status)) && (!dates.from || (dOf(i) >= dates.from && dOf(i) <= dates.to)) && (!q || `${i.name} ${i.sub} ${i.by.name}`.toLowerCase().includes(q.toLowerCase())))
  const view = shown.slice(pg * per, pg * per + per)
  const recent = ASSETS.slice(0, 3)
  const allPicked = view.length > 0 && view.every((r) => picked[r.id])

  const rowMenu = (it) => [
    { label: 'View details', icon: Eye, run: () => toast({ title: it.name, text: it.sub, tone: 'info', duration: 3000 }) },
    ...(it.code ? [{ label: 'Copy asset code', icon: Copy, run: () => { navigator.clipboard?.writeText(it.code).catch(() => {}); toast({ title: 'Copied', text: `Asset code ${it.code}`, duration: 2000 }) } }] : []),
    ...(it.kind === 'asset' ? [{ label: 'Raise ticket', icon: Ticket, run: () => open('tk', { asset: `${it.name} (${it.code})`, issue: '' }) }, { label: 'Return asset', icon: Undo2, run: () => open('tr', { asset: `${it.name} (${it.code})`, kind: 'Return', to: 'IT Support' }) }] : []),
  ]

  const footer = (label, ok) => (<><button type="button" className="ov-btn" onClick={() => setPanel(null)}>Cancel</button><button type="button" className="ov-btn primary" disabled={!ok} onClick={submit}>{label}</button></>)

  return (
    <div className="mp">
      <PageHead title="Assets" desc="Request equipment, see what you hold, and raise transfers or tickets." />

      <ActionCards items={[
        { icon: Package, label: 'Request asset', onClick: () => open('req', { asset: '' }) },
        { icon: Ticket, label: 'Raise ticket', onClick: () => open('tk', { asset: assetNames[0], issue: '' }) },
        { icon: ArrowLeftRight, label: 'Transfer asset', onClick: () => open('tr', { asset: assetNames[0], kind: 'Transfer', to: 'Anita Rao' }) },
        { icon: Undo2, label: 'Return asset', onClick: () => open('tr', { asset: assetNames[0], kind: 'Return', to: 'IT Support' }) },
      ]} />

      <section className="ex-sec">
        <h2>Recently assigned</h2>
        <div className="ex-pins">
          {recent.map((a) => (
            <div key={a.id} className="ex-pin">
              <ItemIcon it={a} />
              <div><b>{a.name}</b><small>{a.code} <i /> {a.cat}</small></div>
              <Pin size={16} strokeWidth={1.75} className="ex-pinic" aria-hidden="true" />
            </div>
          ))}
        </div>
      </section>

      <section className="ex-sec">
        <h2>Asset explorer</h2>
        <div className="mp-tabs" role="tablist" aria-label="Asset views" style={{ alignSelf: 'flex-start' }}>
          {TABS.map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setPg(0) }}>{l}<em>{counts[k]}</em></button>
          ))}
        </div>

        <TableCard
          title={TABS.find((t) => t[0] === tab)[1]} count={shown.length} unit="items" desc="Everything issued to you, requested by you or handled for you."
          toolbar={(
            <>
              <label className="mp-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => { setQ(e.target.value); setPg(0) }} placeholder="Search" aria-label="Search assets" /></label>
              <DatePicker value={dates} onApply={(v) => { setDates(v); setPg(0) }} />
              <FilterMenu label="Filters" options={statusOpts} value={stSel} onChange={(v) => { setStSel(v); setPg(0) }} />
            </>
          )}
          footer={shown.length > 0 ? <Pager total={shown.length} page={pg} setPage={setPg} perPage={per} setPerPage={setPer} options={[10, 20, 50]} /> : null}
        >
          {shown.length === 0 ? (
            <Empty icon={PackageOpen} title="No items found" text={q ? `Your search “${q}” did not match any item. Clear the search to see all assets.` : 'There is nothing here yet.'}>
              <div className="mp-empty-a">{(q || stSel.length || dates.from) && <button type="button" className="mp-btn" onClick={() => { setQ(''); setStSel([]); setDates({ from: null, to: null }) }}>Clear filters</button>}<button type="button" className="mp-btn primary" onClick={() => open('req', { asset: '' })}>Request asset</button></div>
            </Empty>
          ) : (
            <div className="ex-table-wrap" style={{ minHeight: Math.min(per, shown.length) * 63 + 41 }}>
              <table className="ex-table">
                <colgroup><col style={{ width: 44 }} /><col />{tab === 'all' && <col style={{ width: 110 }} />}<col style={{ width: 130 }} /><col style={{ width: 280 }} /><col style={{ width: 120 }} /><col style={{ width: 52 }} /></colgroup>
                <thead><tr>
                  <th><input type="checkbox" aria-label="Select all" checked={allPicked} onChange={() => setPicked((p) => { const n = { ...p }; view.forEach((r) => { n[r.id] = !allPicked }); return n })} /></th>
                  <th>Name</th>{tab === 'all' && <th>Type</th>}<th>Status</th><th>Handled by</th><th>Date</th><th />
                </tr></thead>
                <tbody>
                  {view.map((it) => (
                    <tr key={it.id}>
                      <td><input type="checkbox" aria-label={`Select ${it.name}`} checked={!!picked[it.id]} onChange={() => setPicked((p) => ({ ...p, [it.id]: !p[it.id] }))} /></td>
                      <td><span className="ex-name"><ItemIcon it={it} /><span><b>{it.name}</b><small>{it.sub}</small></span></span></td>
                      {tab === 'all' && <td><Tag tone={KIND[it.kind][1]}>{KIND[it.kind][0]}</Tag></td>}
                      <td><Tag tone={TONE[it.status]}>{it.status}</Tag></td>
                      <td><Who p={it.by} /></td>
                      <td className="ex-date">{it.date}</td>
                      <td className="ex-kebab"><PopMenu label={`Actions for ${it.name}`} trigger={<MoreVertical size={16} strokeWidth={1.75} />} items={rowMenu(it)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TableCard>
      </section>

      <Slideout open={panel === 'req'} title="Request an asset" desc="Tell us what you need and why." onClose={() => setPanel(null)} footer={footer('Send request', !!form.asset)}>
        <Field label="Asset"><input value={form.asset || ''} onChange={set('asset')} placeholder="e.g. 27-inch monitor" /></Field>
        <Field label="Reason"><textarea rows={4} value={form.reason || ''} onChange={set('reason')} /></Field>
      </Slideout>
      <Slideout open={panel === 'tr'} title={`${form.kind || 'Transfer'} an asset`} desc="Hand an asset back or to a teammate." onClose={() => setPanel(null)} footer={footer('Raise request', !!form.asset)}>
        <Field label="Asset"><select value={form.asset || ''} onChange={set('asset')}>{assetNames.map((a) => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Type"><select value={form.kind || 'Transfer'} onChange={set('kind')}>{['Transfer', 'Return', 'Swap'].map((a) => <option key={a}>{a}</option>)}</select></Field>
        <Field label="To"><select value={form.to || 'Anita Rao'} onChange={set('to')}>{['Anita Rao', 'Vinod Pasupuleti', 'Mohan Pillai', 'IT Support'].map((a) => <option key={a}>{a}</option>)}</select></Field>
      </Slideout>
      <Slideout open={panel === 'tk'} title="Raise a ticket" desc="Describe the problem with your asset." onClose={() => setPanel(null)} footer={footer('Raise ticket', !!form.issue)}>
        <Field label="Asset"><select value={form.asset || ''} onChange={set('asset')}>{assetNames.map((a) => <option key={a}>{a}</option>)}</select></Field>
        <Field label="What is wrong?"><textarea rows={5} value={form.issue || ''} onChange={set('issue')} placeholder="e.g. Screen flickers after startup" /></Field>
      </Slideout>
    </div>
  )
}
