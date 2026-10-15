import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IssueView from './IssueView'
import { Timesheets } from './ProjectOps2'
import { Reports } from './ProjectJira'

const project = { id: 'p1', key: 'HRM', name: 'HRMS', lead: 'Venkatesh Korlapati', members: 4, type: 'Scrum', tone: 'blue' }
const cols = [['todo', 'To do'], ['prog', 'In progress'], ['done', 'Done']]
const today = new Date().toLocaleDateString('en-CA')
const mk = (over = {}) => ({
  id: 'HRM-113', title: 'Payroll export bug', type: 'task', col: 'todo', who: 'Venkatesh Korlapati', prio: 'Medium', pts: 3, sprint: 'Sprint 1',
  labels: [], comments: [], desc: '', est: 480, logged: 0, worklog: [], ...over,
})

const renderIssue = (issue, extra = {}) => {
  const patch = vi.fn()
  render(
    <IssueView issue={issue} project={project} cols={cols} clsOf={() => ''} people={['Venkatesh Korlapati']} issues={[issue]} sprints={['Sprint 1', '']}
      me="Venkatesh Korlapati" patch={patch} onClose={() => {}} onOpen={() => {}} onAddChild={() => {}} onAddStatus={() => {}} onRenameStatus={() => {}} {...extra} />,
  )
  return { patch, user: userEvent.setup() }
}

describe('ticket Timesheet section', () => {
  it('starts empty with estimate and full remaining time', () => {
    renderIssue(mk())
    const sec = screen.getByRole('region', { name: 'Timesheet' })
    expect(within(sec).getByText('No time logged on this work item yet.')).toBeInTheDocument()
    expect(within(sec).getByText('Original estimate').nextSibling).toHaveTextContent('1d')
    expect(within(sec).getByText('Remaining').nextSibling).toHaveTextContent('1d')
  })

  it('lists logged entries and the anchor link points at the section', () => {
    const issue = mk({ logged: 180, worklog: [{ id: 'w1', who: 'Venkatesh Korlapati', min: 180, date: today, text: 'Fixed the export' }] })
    renderIssue(issue)
    const sec = screen.getByRole('region', { name: 'Timesheet' })
    expect(within(sec).getByText('Fixed the export')).toBeInTheDocument()
    expect(within(sec).getByText('Remaining').nextSibling).toHaveTextContent('5h')
    const link = screen.getAllByRole('link', { name: /Timesheet/ })[0]
    expect(link).toHaveAttribute('href', '#ts-HRM-113')
    expect(sec).toHaveAttribute('id', 'ts-HRM-113')
  })

  it('Log work opens the dialog and saves the entry on the ticket', async () => {
    const { patch, user } = renderIssue(mk())
    await user.click(within(screen.getByRole('region', { name: 'Timesheet' })).getByRole('button', { name: /Log work/ }))
    const dlg = screen.getByRole('dialog', { name: /log work on HRM-113/i })
    await user.type(within(dlg).getByLabelText(/time spent/i), '3h')
    await user.click(within(dlg).getByRole('button', { name: 'Save' }))
    expect(patch).toHaveBeenCalledWith('HRM-113', expect.objectContaining({
      logged: 180,
      worklog: [expect.objectContaining({ who: 'Venkatesh Korlapati', min: 180, date: today })],
    }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Timesheets page', () => {
  it('shows time logged on tickets in the grid for that person and day', async () => {
    const issue = mk({ logged: 180, worklog: [{ id: 'w1', who: 'Venkatesh Korlapati', min: 180, date: today, text: 'x' }] })
    const user = userEvent.setup()
    render(<Timesheets project={project} issues={[issue]} />)
    await user.click(screen.getByRole('button', { name: 'Grid' }))
    expect(screen.getByLabelText(new RegExp(`Venkatesh Korlapati ${today}`))).toHaveValue('3h')
  })
})

describe('Reports page', () => {
  it('keeps its cards: burndown, velocity, work by status and sprint report', () => {
    render(<Reports issues={[mk({ col: 'done', pts: 2 }), mk({ id: 'HRM-114', col: 'prog', pts: 5 })]} cols={cols} />)
    for (const name of ['Burndown chart', 'Velocity chart', 'Work by status', 'Sprint report']) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0)
    }
    expect(screen.getByRole('img', { name: 'Burndown chart' })).toBeInTheDocument()
  })
})
