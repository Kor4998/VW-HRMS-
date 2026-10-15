import { useState } from 'react'
import { ChevronDown, Download, PackageOpen, Plus, RefreshCw, Search } from 'lucide-react'
import { Empty, Pager, Tag } from './ModuleKit'

// Untitled UI "Metric item": icon box, label, number, optional trend badge (green up / red down) in the corner.
export function Stat({ label, value, icon: Ico, tone, trend }) {
  return (
    <div className={`sh-stat ${tone}`}>
      <div><span>{label}</span><b>{value}</b></div>
      <Ico size={20} strokeWidth={1.5} aria-hidden="true" />
      {trend && <em className={`sh-trend ${trend.bad ? 'bad' : 'good'}`} title={trend.title}>{trend.dir === 'down' ? '↓' : '↑'} {trend.v}</em>}
    </div>
  )
}

export function Requests({ title, stats, kind, rows, onCreate, columns, statuses, types, emptyTitle, emptyText, search, createLabel, children }) {
  const [status, setStatus] = useState('All statuses')
  const [type, setType] = useState(types ? types[0] : '')
  const [when, setWhen] = useState('All dates')
  const [q, setQ] = useState('')
  const [pg, setPg] = useState(0)
  const [perPage, setPerPage] = useState(5)
  const shown = rows.filter((r) => (status === 'All statuses' || r.status === status) && (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())))

  return (
    <div className="sh-panel">
      <div className={`sh-stats c${stats.length}`}>{stats.map((s) => <Stat key={s.label} {...s} />)}</div>
      <div className="sh-bar">
        <div className="sh-title"><h2>{title}</h2><span className="sh-rec">{shown.length} {shown.length === 1 ? 'record' : 'records'}</span></div>
        <div className="sh-bar-r">
          {search && (
            <label className="mp-search"><Search size={16} strokeWidth={1.75} aria-hidden="true" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label={`Search ${title}`} /></label>
          )}
          {createLabel && <button type="button" className="mp-btn primary" onClick={onCreate}><Plus size={16} strokeWidth={1.75} aria-hidden="true" />{createLabel}</button>}
        </div>
      </div>
      <div className="mp-filters">
        {statuses && (
          <label className="mp-sel"><select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option>All statuses</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select><ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" /></label>
        )}
        {types && (
          <label className="mp-sel"><select value={type} onChange={(e) => setType(e.target.value)} aria-label="Request type">{types.map((s) => <option key={s}>{s}</option>)}</select><ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" /></label>
        )}
        <div className="sh-chips" role="group" aria-label="Date range">
          {['All dates', 'Year', 'Last month', 'Last 30 days', 'Last 7 days', 'Today'].map((d) => (
            <button key={d} type="button" aria-pressed={when === d} className={when === d ? 'on' : ''} onClick={() => setWhen(d)}>{d}</button>
          ))}
        </div>
        <button type="button" className="mp-btn sm" aria-label="Refresh"><RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" /></button>
        <button type="button" className="mp-btn sm"><Download size={14} strokeWidth={1.75} aria-hidden="true" />Export</button>
      </div>
      {children}
      {shown.length === 0 ? (
        <div className="mp-card mp-pad"><Empty icon={PackageOpen} title={emptyTitle} text={emptyText} /></div>
      ) : (
        <>
        <div className="mp-table-wrap">
          <table className="mp-table">
            <thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {shown.slice(pg * perPage, pg * perPage + perPage).map((r) => (
                <tr key={r.id}><td><b>{r.requested}</b></td><td>{r.mine}</td><td>{r.with}</td><td>{r.theirs}</td><td className="note">{r.reason}</td><td><Tag tone="warn">{r.status}</Tag></td></tr>
              ))}
            </tbody>
          </table>
        </div>
          <Pager total={shown.length} page={pg} setPage={setPg} perPage={perPage} setPerPage={setPerPage} />
        </>
      )}
      <span hidden>{kind}</span>
    </div>
  )
}
