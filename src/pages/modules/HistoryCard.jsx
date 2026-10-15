import { AlertTriangle, CalendarOff, Clock, House, Plane, Timer, UserCheck, Briefcase } from 'lucide-react'

const HIST_STATS = [
  ['22', 'Working days', 'out of 30 days', 'blue', Briefcase],
  ['20', 'Present', '91% of working days', 'green', UserCheck],
  ['0', 'WFH', 'of 20 present days', 'teal', House],
  ['0', 'Comp Off', 'earned in this period', 'violet', Timer],
  ['6', 'Week off', 'Saturdays & Sundays', 'grey', CalendarOff],
  ['1', 'Leave', '3% of total days', 'amber', Plane],
  ['9h 47m', 'Avg. gross', 'per day with punches', 'blue', Clock],
  ['1', 'Missing punch', 'day', 'rose', AlertTriangle],
]
const HIST_LEGEND = [['green', 'Present (Office)'], ['teal', 'Work from home'], ['amber', 'Leave'], ['blue', 'Holiday'], ['grey', 'Week off'], ['rose', 'Missing clock-out']]

// Attendance history calendar (7 Sep – 6 Oct 2026)
function buildHistory() {
  const cells = []
  const start = new Date(2026, 8, 7)
  const end = new Date(2026, 9, 7)
  const holidays = { '2026-9-14': 'Holiday', '2026-10-2': 'Holiday' }
  const pad = (n) => String(n).padStart(2, '0')
  for (let i = 0; i <= Math.round((end - start) / 864e5); i++) {
    const d = new Date(start.getTime() + i * 864e5)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    const dow = d.getDay()
    const cell = { day: d.getDate(), key, type: 'present' }
    if (i === 0) {
      for (let k = 0; k < dow; k++) cells.push({ key: `b${k}`, type: 'blank' })
    }
    if (holidays[key]) cell.type = 'holiday'
    else if (dow === 0 || dow === 6) cell.type = 'off'
    else if (key === '2026-9-21') cell.type = 'leave'
    else if (key === '2026-10-7') cell.type = 'missing'
    else {
      const inMin = 9 * 60 + 15 + ((d.getDate() * 13) % 45)
      const gross = 9 * 60 + ((d.getDate() * 37) % 130)
      const outMin = inMin + gross + 60
      const hm = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`
      cell.range = `${hm(inMin)}–${hm(outMin)}`
      cell.hours = `${Math.floor(gross / 60)}h ${pad(gross % 60)}m`
    }
    cells.push(cell)
  }
  return cells
}
const HISTORY = buildHistory()
const STATUS_LABEL = { present: 'WFO', off: 'Off', holiday: 'Holiday', leave: 'Leave', missing: 'Missing' }

// Eight stat tiles for the history period; shown at the top of the page.
export function HistoryStats() {
  return (
    <div className="hist-stats">
      {HIST_STATS.map(([v, l, n, tone, Ico]) => (
        <div className={tone} key={l}><Ico size={16} className="hs-ic" aria-hidden="true" /><b>{v}</b><span>{l}</span><small>{n}</small></div>
      ))}
    </div>
  )
}

// Calendar body of the attendance history (stat tiles, legend, month grid). Lives inside the shared frame.
export default function HistoryBody() {
  return (
    <div className="ah-cal">
      <div className="hist-legend">
        {HIST_LEGEND.map(([tone, label]) => (<span key={label}><i className={tone} />{label}</span>))}
        <em>8 Sep 2026 – 7 Oct 2026</em>
      </div>
      <div className="cal" style={{ '--weeks': Math.ceil(HISTORY.length / 7) }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span className="cal-h" key={d}>{d}</span>)}
        {HISTORY.map((c) => c.type === 'blank' ? (
          <div className="cell blank" key={c.key} />
        ) : (
          <div className={`cell c-${c.type}`} key={c.key}>
            <div className="cell-top"><b>{c.day}</b><em>{STATUS_LABEL[c.type]}</em></div>
            {c.range && <span className="cell-range">{c.range}</span>}
            {c.hours && <span className="cell-gross">{c.hours} worked</span>}
            {c.range && <span className="cell-shift">Shift 09:30–18:30</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
