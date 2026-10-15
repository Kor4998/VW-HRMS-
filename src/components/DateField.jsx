import DatePicker from './DatePicker'

// A single-date field built on the app's own date picker (the native browser calendar is not used anywhere).
// value / onChange use ISO strings (yyyy-mm-dd), like <input type="date">.
const toDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null }
export const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const show = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export default function DateField({ value, onChange, empty = 'Select a date', className = '' }) {
  const d = toDate(value)
  return (
    <DatePicker
      single
      className={`df ${className}`}
      value={d ? { from: d, to: d } : null}
      label={d ? show(d) : empty}
      onApply={(r) => r?.from && onChange(toIso(r.from))}
    />
  )
}
