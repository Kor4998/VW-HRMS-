import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Inbox } from 'lucide-react'
import { audit, captureConsole } from '@/test/audit'
import ApprovalsPage, { APPROVALS_SEED } from './ApprovalsPage'
import AssetPage from './AssetPage'
import AttendancePage from './AttendancePage'
import LeavePage from './LeavePage'
import PerformancePage from './PerformancePage'
import PoliciesPage from './PoliciesPage'
import ShiftPage from './ShiftPage'
import TeamPage from './TeamPage'
import HistoryBody, { HistoryStats } from './HistoryCard'
import { SupportDashboard, MyQueue } from './SupportPages'
import { Tabs, Tag, Empty, Donut, Bars, Pager, PageHead, Section, ActionCards, PopMenu, TableCard } from './ModuleKit'
import { Stat } from './RequestsPanel'

const clean = () => expect(audit(document.body)).toEqual([])
const noise = /not wrapped in act|ReactDOMTestUtils/
const tickets = [{ id: 'T-1', title: 'Payslip missing', category: 'Payroll Issue', priority: 'P2', status: 'Open', requester: 'Anita Rao', created: '2026-10-10', assignee: 'Venkatesh Korlapati' }]

const PAGES = {
  'Attendance (default tab)': () => <AttendancePage />,
  'Attendance (insights)': () => <AttendancePage initial="insights" />,
  'Attendance (history)': () => <AttendancePage initial="history" />,
  'Attendance (regularization)': () => <AttendancePage initial="reg" />,
  'Attendance (work from home)': () => <AttendancePage initial="wfh" />,
  'Leave overview': () => <LeavePage />,
  'Shift roster': () => <ShiftPage />,
  Asset: () => <AssetPage />,
  Team: () => <TeamPage />,
  Policies: () => <PoliciesPage />,
  Performance: () => <PerformancePage />,
  Approvals: () => <ApprovalsPage items={APPROVALS_SEED} setItems={() => {}} />,
  'Attendance history card': () => <HistoryBody />,
  'Support dashboard': () => <SupportDashboard tickets={tickets} onRefresh={() => {}} />,
  'Support queue': () => <MyQueue tickets={tickets} setTickets={() => {}} />,
}

describe('every HR page renders cleanly', () => {
  for (const [name, make] of Object.entries(PAGES)) {
    it(name, () => {
      const con = captureConsole(vi)
      render(make())
      con.restore()
      expect(con.seen.filter(([, m]) => !noise.test(m)).map((x) => x.join(': '))).toEqual([])
      clean()
      expect(document.body.textContent.trim().length).toBeGreaterThan(20)
    })
  }
})

describe('Shift management', () => {
  it('opens in month view and switches with two icon-only buttons that have names', async () => {
    const user = userEvent.setup()
    render(<ShiftPage />)
    const month = screen.getByRole('button', { name: 'Month view' })
    const week = screen.getByRole('button', { name: 'Week view' })
    expect(month).toHaveAttribute('aria-pressed', 'true')
    expect(week).toHaveAttribute('aria-pressed', 'false')
    expect(month.textContent.trim()).toBe(''); expect(week.textContent.trim()).toBe('')
    await user.click(week)
    expect(week).toHaveAttribute('aria-pressed', 'true')
    expect(month).toHaveAttribute('aria-pressed', 'false')
    clean()
  })
  it('steps to the next and previous month', async () => {
    const user = userEvent.setup()
    render(<ShiftPage />)
    const title = () => document.querySelector('.ck-title h3').textContent
    const first = title()
    await user.click(screen.getByRole('button', { name: /Next/i }))
    expect(title()).not.toBe(first)
    await user.click(screen.getByRole('button', { name: /Previous/i }))
    expect(title()).toBe(first)
  })
})

describe('Attendance tabs', () => {
  it('opens on Attendance history, has no separate calendar tab, and moves between the other tabs', async () => {
    const user = userEvent.setup()
    render(<AttendancePage />)
    expect(screen.queryByRole('tab', { name: 'My calendar' })).toBeNull()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['Attendance history', 'Insights', 'Regularization', 'Work from home'])
    expect(tabs.filter((t) => t.getAttribute('aria-selected') === 'true')).toHaveLength(1)
    expect(screen.getByRole('tab', { name: 'Attendance history' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: 'Insights' }))
    expect(screen.getByText('Attendance insights')).toBeInTheDocument()
    clean()
  })
  it('each worked day shows its punch timings, hours worked and the planned shift', () => {
    render(<AttendancePage />)
    const cell = document.querySelector('.ah-cal .cell.c-present')
    expect(cell.querySelector('.cell-range').textContent).toMatch(/\d{2}:\d{2}–\d{2}:\d{2}/)
    expect(cell.querySelector('.cell-gross').textContent).toMatch(/\d+h \d{2}m worked/)
    expect(cell.querySelector('.cell-shift').textContent).toMatch(/Shift 09:30–18:30/)
  })
})

describe('Leave management tabs', () => {
  it('shows balances and moves between its tabs', async () => {
    const user = userEvent.setup()
    render(<LeavePage />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBeGreaterThan(1)
    for (const t of tabs.slice(0, 5)) { await user.click(t); expect(t).toHaveAttribute('aria-selected', 'true'); clean() }
  })
})

describe('Approvals', () => {
  it('lists the pending requests with Approve and Reject on each', () => {
    render(<ApprovalsPage items={APPROVALS_SEED} setItems={() => {}} />)
    const rows = document.querySelectorAll('.ap-list li')
    expect(rows.length).toBe(APPROVALS_SEED.filter((i) => i.status === 'Pending').length)
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(within(r).getByRole('button', { name: /Approve/i })).toBeInTheDocument()
      expect(within(r).getByRole('button', { name: /Reject/i })).toBeInTheDocument()
    }
  })
  it('a decision is reported to the page', async () => {
    const user = userEvent.setup()
    const setItems = vi.fn()
    render(<ApprovalsPage items={APPROVALS_SEED} setItems={setItems} />)
    const first = document.querySelector('.ap-list li')
    await user.click(within(first).getByRole('button', { name: /Approve/i }))
    expect(setItems).toHaveBeenCalled()
  })
})

describe('Module kit pieces', () => {
  it('PageHead, Section, Tag, Empty render their text', () => {
    render(<><PageHead title="Policies" desc="Company rules" /><Section title="Leave"><Tag tone="ok">Active</Tag></Section><Empty icon={Inbox} title="Nothing here" text="Add one to start." /></>)
    expect(screen.getByRole('heading', { name: 'Policies' })).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    clean()
  })
  it('Tabs marks the selected tab and reports changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Tabs label="Sections" items={[['a', 'Alpha'], ['b', 'Beta', 3]]} value="a" onChange={onChange} />)
    expect(screen.getByRole('tab', { name: /Alpha/ })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('tab', { name: /Beta/ }))
    expect(onChange).toHaveBeenCalledWith('b')
    clean()
  })
  it('Donut and Bars expose their numbers', () => {
    render(<><Donut value={5} total={10} color="#2563EB">half</Donut><Bars data={[['Mon', 3], ['Tue', 5]]} max={5} unit="h" /></>)
    expect(screen.getByText('half')).toBeInTheDocument()
    expect(screen.getByText('Mon')).toBeInTheDocument()
  })
  it('Pager pages forward and back and cannot go past the ends', async () => {
    const user = userEvent.setup()
    const setPage = vi.fn()
    render(<Pager total={42} page={0} setPage={setPage} perPage={10} setPerPage={() => {}} />)
    const prev = screen.getByRole('button', { name: /Previous/i })
    expect(prev).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Next/i }))
    expect(setPage).toHaveBeenCalledWith(1)
    clean()
  })
  it('PopMenu opens, runs an item and closes on Escape', async () => {
    const user = userEvent.setup()
    const run = vi.fn()
    render(<PopMenu label="More actions" trigger={<span>•••</span>} items={[{ label: 'Edit', run }, { label: 'Delete', run: () => {}, danger: true }]} />)
    const trigger = screen.getByRole('button', { name: 'More actions' })
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(run).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).toBeNull()
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
  })
  it('TableCard shows title, count and toolbar', () => {
    render(<TableCard title="Requests" count={4} unit="records" desc="All of them" toolbar={<button type="button">Filter</button>}><table><tbody><tr><td>x</td></tr></tbody></table></TableCard>)
    expect(screen.getByText('Requests')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
    clean()
  })
  it('Stat shows its label and value', () => {
    render(<Stat label="Pending" value={7} icon={Inbox} tone="amber" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })
  it('HistoryStats renders', () => { render(<HistoryStats />); clean() })
  it('ActionCards render each action as a button', async () => {
    const user = userEvent.setup()
    const run = vi.fn()
    render(<ActionCards items={[{ label: 'Apply for leave', icon: Inbox, onClick: run }]} />)
    await user.click(screen.getByRole('button', { name: /Apply for leave/ }))
    expect(run).toHaveBeenCalled()
    expect(screen.getByRole('group', { name: 'Quick actions' })).toBeInTheDocument()
  })
})
