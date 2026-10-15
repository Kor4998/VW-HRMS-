import { describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '@/pages/Dashboard'
import { audit, captureConsole } from './audit'

const wait = (ms = 380) => act(() => new Promise((r) => setTimeout(r, ms)))
const HRMS_PAGES = ['Dashboard', 'My Profile', 'Shift Management', 'Attendance', 'Asset', 'Leave Management', 'My Team', 'Approvals', 'Policies']
const PROJECT_VIEWS = ['Overview', 'Backlog', 'Board', 'List', 'Timeline', 'Reports', 'Releases', 'Project Team', 'Scope & Requirements', 'Scrum Board', 'Sprint Board', 'Defects', 'Test Repository', 'Timesheets', 'Calendar', 'Credentials', 'Deployments', 'Maintenance', 'Analytics & Reports', 'Activity']

const problems = []
const note = (where) => { for (const p of audit(document.body)) problems.push(`${where}: ${p}`) }
const click = async (user, el) => { await user.click(el); await wait() }

describe('every page renders without errors and passes the markup audit', () => {
  it('HR pages and their tabs', async () => {
    const con = captureConsole(vi)
    const user = userEvent.setup()
    render(<Dashboard onLogout={() => {}} />)
    await wait()
    note('Dashboard (first paint)')
    for (const name of HRMS_PAGES) {
      const item = [...document.querySelectorAll('.sidebar .nav-item')].find((b) => b.textContent.trim().startsWith(name))
      expect(item, `sidebar item ${name}`).toBeTruthy()
      await click(user, item)
      note(`HR ${name}`)
      for (const tab of [...document.querySelectorAll('.page [role="tab"], .page .mp-tabs button')].slice(0, 8)) {
        await click(user, tab)
        note(`HR ${name} › ${tab.textContent.trim().slice(0, 20)}`)
      }
    }
    con.restore()
    const bad = con.seen.filter(([, m]) => !/not wrapped in act|ReactDOMTestUtils|inside a test was not stubbed/.test(m))
    expect({ console: [...new Set(bad.map((b) => b.join(': ')))] }).toEqual({ console: [] })
    expect(problems.filter((p) => p.startsWith('HR') || p.startsWith('Dashboard'))).toEqual([])
  }, 120000)

  it('Projects app: every project view', async () => {
    const con = captureConsole(vi)
    const user = userEvent.setup()
    render(<Dashboard onLogout={() => {}} />)
    await wait()
    await click(user, document.querySelector('[aria-label*="pps" i]'))
    const proj = [...document.querySelectorAll('button, a, [role="menuitem"]')].find((e) => e.textContent.trim() === 'Projects')
    await click(user, proj)
    note('Projects For you')
    const all = [...document.querySelectorAll('.pn-item')].find((e) => /All projects/i.test(e.textContent))
    if (all) { await click(user, all); note('Projects All') }
    const hrms = [...document.querySelectorAll('.pn-item')].find((e) => /HRMS/.test(e.textContent))
    await click(user, hrms)
    for (const v of PROJECT_VIEWS) {
      const b = [...document.querySelectorAll('.pn-views button')].find((e) => e.textContent.trim().startsWith(v))
      expect(b, `project view ${v}`).toBeTruthy()
      await click(user, b)
      note(`Projects ${v}`)
    }
    con.restore()
    const bad = con.seen.filter(([, m]) => !/not wrapped in act|ReactDOMTestUtils/.test(m))
    expect({ console: [...new Set(bad.map((b) => b.join(': ')))] }).toEqual({ console: [] })
    expect(problems.filter((p) => p.startsWith('Projects'))).toEqual([])
  }, 180000)
})
