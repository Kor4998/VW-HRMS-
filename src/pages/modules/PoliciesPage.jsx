import { useState } from 'react'
import { Award, CalendarDays, CircleCheck, CircleX, Clock, FileText, Hash, Settings2, TrendingUp, Type } from 'lucide-react'
import { PageHead, Tag } from './ModuleKit'

const POLICIES = [
  { id: 'co', name: 'Compensatory Off', type: 'Compensatory Off', code: 'CO', days: '0.00', status: 'Inactive', accrual: 'N/A', from: 'Apr 1, 2026', to: 'Mar 31, 2027', carry: false, encash: false, notice: 0, consec: 'Unlimited', desc: 'No description available' },
  { id: 'paid', name: 'Paid Leaves', type: 'Paid Leaves', code: 'PAID', days: '18.00', status: 'Inactive', accrual: 'N/A', from: 'Apr 1, 2026', to: 'Mar 31, 2027', carry: false, encash: false, notice: 0, consec: 'Unlimited', desc: 'No description available' },
  { id: 'ul', name: 'Unpaid Policy', type: 'Unpaid Leave', code: 'UL', days: '0.00', status: 'Inactive', accrual: 'N/A', from: 'Apr 1, 2026', to: 'Mar 31, 2027', carry: false, encash: false, notice: 0, consec: 'Unlimited', desc: 'No description available' },
]

function Group({ icon: Ico, title, children }) {
  return (
    <section className="pol-grp">
      <h3><Ico size={16} strokeWidth={1.75} aria-hidden="true" />{title}</h3>
      <div className="pol-box">{children}</div>
    </section>
  )
}

function Row({ icon: Ico, label, children }) {
  return <div className="pol-row"><span><Ico size={15} strokeWidth={1.75} aria-hidden="true" />{label}</span><b>{children}</b></div>
}

function Yes({ on }) {
  return on
    ? <span className="pol-yn yes"><CircleCheck size={16} strokeWidth={1.75} aria-hidden="true" />Yes</span>
    : <span className="pol-yn no"><CircleX size={16} strokeWidth={1.75} aria-hidden="true" />No</span>
}

export default function PoliciesPage() {
  const [id, setId] = useState('co')
  const p = POLICIES.find((x) => x.id === id)

  return (
    <div className="mp">
      <PageHead title="Policies" desc="Your leave policies and the rules that apply to you." />

      <div className="pol-cards" role="tablist" aria-label="Policies">
        {POLICIES.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={id === x.id} className={id === x.id ? 'pol-card on' : 'pol-card'} onClick={() => setId(x.id)}>
            <span className="pol-ic"><FileText size={20} strokeWidth={1.75} aria-hidden="true" /></span>
            <span className="pol-card-b"><b>{x.name}</b><small>{x.type}</small></span>
            <span className="pol-card-r"><b>{x.days}</b><small>days / year</small></span>
          </button>
        ))}
      </div>

      <section className="pol-hero">
        <span className="pol-hero-ic"><FileText size={32} strokeWidth={1.5} aria-hidden="true" /></span>
        <div>
          <h2>{p.name}</h2>
          <p>{p.desc}</p>
          <div className="pol-chips">
            <span><CalendarDays size={14} strokeWidth={1.75} aria-hidden="true" />{p.type}</span>
            <Tag>{p.code}</Tag>
            {Number(p.days) > 0 && <span><Clock size={14} strokeWidth={1.75} aria-hidden="true" />{p.days} days/year</span>}
          </div>
        </div>
        <Tag tone="err">{p.status}</Tag>
      </section>

      <Group icon={FileText} title="Policy overview - basic information">
        <div className="pol-two">
          <div>
            <Row icon={FileText} label="Policy name">{p.name}</Row>
            <Row icon={CalendarDays} label="Days per year"><span className="pol-pill">{p.days} days</span></Row>
            <Row icon={CircleCheck} label="Status"><span className="pol-pill err">{p.status}</span></Row>
          </div>
          <div>
            <Row icon={CalendarDays} label="Leave type">{p.type}</Row>
            <Row icon={Clock} label="Accrual frequency">{p.accrual}</Row>
            <Row icon={Type} label="Leave type code"><code>{p.code}</code></Row>
          </div>
        </div>
      </Group>

      <Group icon={CalendarDays} title="Policy validity period">
        <div className="pol-two">
          <div><Row icon={CircleCheck} label="Effective from">{p.from}</Row></div>
          <div><Row icon={CircleX} label="Effective to">{p.to}</Row></div>
        </div>
      </Group>

      <Group icon={Award} title="Policy benefits summary">
        <table className="pol-table">
          <thead><tr><th>Benefit</th><th>Allowed</th><th>Maximum days</th></tr></thead>
          <tbody>
            <tr><td><TrendingUp size={15} strokeWidth={1.75} aria-hidden="true" />Carry forward</td><td><Yes on={p.carry} /></td><td>-</td></tr>
            <tr><td><Award size={15} strokeWidth={1.75} aria-hidden="true" />Encashment</td><td><Yes on={p.encash} /></td><td>-</td></tr>
          </tbody>
        </table>
      </Group>

      <Group icon={Settings2} title="Leave policy rules and constraints">
        <div className="pol-two">
          <div><Row icon={Clock} label="Minimum notice days"><span className="pol-pill">{p.notice} days</span></Row></div>
          <div><Row icon={Hash} label="Maximum consecutive days"><span className="pol-pill">{p.consec}</span></Row></div>
        </div>
      </Group>
    </div>
  )
}
