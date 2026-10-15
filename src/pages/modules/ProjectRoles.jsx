import { useState } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import Checkbox from '@/components/Checkbox'
import { toast } from '@/components/toast'

const ROLES = ['Owner', 'Admin', 'Member', 'Viewer']
const GROUPS = [
  ['Issues', [['View issues', 'Admin Member Viewer'], ['Create issues', 'Admin Member'], ['Edit issues', 'Admin Member'], ['Delete issues', 'Admin']]],
  ['Members', [['Add members', 'Admin Member'], ['Change member roles', 'Admin'], ['Remove members', 'Admin']]],
  ['Project', [['Edit project settings', 'Admin'], ['Manage boards and sprints', 'Admin Member'], ['Archive project', '']]],
]
const initial = () => Object.fromEntries(GROUPS.flatMap(([, rows]) => rows.map(([name, who]) => [name, new Set(who.split(' ').filter(Boolean))])))
const same = (a, b) => Object.keys(a).every((k) => a[k].size === b[k].size && [...a[k]].every((r) => b[k].has(r)))

// Roles and permissions matrix: collapsible groups, tri-state group checkboxes, Owner locked on, unsaved-change bar.
export default function ProjectRoles({ project }) {
  const [saved, setSaved] = useState(initial)
  const [perm, setPerm] = useState(initial)
  const [open, setOpen] = useState({ Issues: true, Members: true, Project: true })
  const dirty = !same(saved, perm)

  const toggle = (name, role) => setPerm((p) => { const n = new Set(p[name]); if (n.has(role)) n.delete(role); else n.add(role); return { ...p, [name]: n } })
  const toggleGroup = (rows, role, on) => setPerm((p) => { const n = { ...p }; rows.forEach(([name]) => { const s = new Set(p[name]); if (on) s.add(role); else s.delete(role); n[name] = s }); return n })

  return (
    <section className="pm rl" aria-label="Roles and permissions">
      <header className="pm-head">
        <div><h2>Roles and permissions</h2><p>{project.name} · what each role can do in this project.</p></div>
        <div className="rl-actions">
          <button type="button" className="mp-btn" disabled={!dirty} onClick={() => setPerm(saved)}>Reset</button>
          <button type="button" className="mp-btn primary" disabled={!dirty} onClick={() => { setSaved(perm); toast({ title: 'Permissions saved', text: `Changes apply to everyone in ${project.name}.` }) }}>Save changes</button>
        </div>
      </header>
      <div className="rl-scroll">
        <table className="rl-table">
          <thead>
            <tr>
              <th scope="col">Permission</th>
              {ROLES.map((r) => <th key={r} scope="col">{r === 'Owner' && <Lock size={12} strokeWidth={1.75} aria-hidden="true" />}{r}</th>)}
            </tr>
          </thead>
          {GROUPS.map(([g, rows]) => (
            <tbody key={g}>
              <tr className="rl-group">
                <th scope="row">
                  <button type="button" aria-expanded={open[g]} onClick={() => setOpen((o) => ({ ...o, [g]: !o[g] }))}><ChevronDown size={16} strokeWidth={1.75} className={open[g] ? '' : 'shut'} aria-hidden="true" />{g}<em>{rows.length}</em></button>
                </th>
                {ROLES.map((r) => {
                  const n = rows.filter(([name]) => r === 'Owner' || perm[name].has(r)).length
                  return (
                    <td key={r}><Checkbox aria-label={`${g}: ${r}`} checked={n === rows.length} indeterminate={n > 0 && n < rows.length} disabled={r === 'Owner'} onChange={(e) => toggleGroup(rows, r, e.target.checked)} /></td>
                  )
                })}
              </tr>
              {open[g] && rows.map(([name]) => (
                <tr key={name} className="rl-row">
                  <th scope="row">{name}</th>
                  {ROLES.map((r) => <td key={r}><Checkbox aria-label={`${name}: ${r}`} checked={r === 'Owner' || perm[name].has(r)} disabled={r === 'Owner'} onChange={() => toggle(name, r)} /></td>)}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <footer className="pm-foot rl-foot"><span><Lock size={14} strokeWidth={1.75} aria-hidden="true" />Owners always have every permission</span>{dirty && <span className="rl-dirty"><i />Unsaved change</span>}</footer>
    </section>
  )
}
