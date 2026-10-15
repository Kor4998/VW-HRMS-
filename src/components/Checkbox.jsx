import { useEffect, useRef } from 'react'
import './checkbox.css'

// Untitled UI "Checkbox with text": 16px box + label (14/500) + optional supporting text (14/400).
// Supports checked, indeterminate and disabled; focus ring and press spring come from the styles.
export default function Checkbox({ label, supporting, indeterminate = false, className = '', ...rest }) {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate }, [indeterminate])
  return (
    <label className={`cbf ${className}`}>
      <input ref={ref} type="checkbox" {...rest} />
      {label && <span className="cbf-t"><b>{label}</b>{supporting && <small>{supporting}</small>}</span>}
    </label>
  )
}
