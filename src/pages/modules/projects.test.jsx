import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { audit, captureConsole } from '@/test/audit'
import ToastHost from '@/components/ToastHost'
import ProjectRoles from './ProjectRoles'
import ProjectMembers from './ProjectMembers'
import ProjectActivity from './ProjectActivity'
import { ProjectOverview, ProjectTeam, ScopeRequirements, ScrumBoard, SprintBoard, Defects } from './ProjectOps'
import { TestRepository, Timesheets, ProjectCalendar, Credentials, Deployments, Maintenance, Analytics } from './ProjectOps2'
import { Timeline, Reports, Releases } from './ProjectJira'
import { AllProjects, PROJECT_LIST, ProjectBoard } from './ProjectsPages'
import WorkBoard from './WorkBoard'
import ForYou from './ForYou'
import WeekTimeline from './WeekTimeline'

const project = PROJECT_LIST[0]
const COLS = [['todo', 'To do'], ['prog', 'In progress'], ['rev', 'In review'], ['done', 'Done']]
const mk = (id, over = {}) => ({ id, title: `Work ${id}`, type: 'task', col: 'todo', who: 'Anita Rao', prio: 'Medium', pts: 3, sprint: 'Sprint 1', labels: [], comments: [], desc: '', est: 480, logged: 120, worklog: [], created: 'Today', ...over })
const ISSUES = [mk('HRM-101', { type: 'epic' }), mk('HRM-102', { col: 'prog', prio: 'High' }), mk('HRM-103', { type: 'bug', col: 'done' }), mk('HRM-104', { type: 'story', col: 'rev', sprint: '' })]
const clean = () => expect(audit(document.body)).toEqual([])
const noise = /not wrapped in act|ReactDOMTestUtils/

// every page below must render without console errors / warnings and pass the markup audit
const PAGES = {
  'Project overview': () => <ProjectOverview project={project} issues={ISSUES} cols={COLS} />,
  'Project team': () => <ProjectTeam project={project} issues={ISSUES} cols={COLS} />,
  'Scope & requirements': () => <ScopeRequirements project={project} />,
  'Scrum board': () => <ScrumBoard project={project} issues={ISSUES} cols={COLS} />,
  'Sprint board': () => <SprintBoard project={project} issues={ISSUES} cols={COLS} patch={() => {}} onOpen={() => {}} />,
  Defects: () => <Defects project={project} />,
  'Test repository': () => <TestRepository />,
  'Timesheets (timeline)': () => <Timesheets project={project} issues={ISSUES} />,
  Calendar: () => <ProjectCalendar issues={ISSUES} cols={COLS} />,
  Credentials: () => <Credentials />,
  Deployments: () => <Deployments project={project} />,
  Maintenance: () => <Maintenance project={project} />,
  Analytics: () => <Analytics issues={ISSUES} cols={COLS} />,
  Timeline: () => <Timeline issues={ISSUES} cols={COLS} onOpen={() => {}} />,
  Reports: () => <Reports issues={ISSUES} cols={COLS} />,
  Releases: () => <Releases issues={ISSUES} cols={COLS} setIssues={() => {}} />,
  Members: () => <ProjectMembers project={project} />,
  Roles: () => <ProjectRoles project={project} />,
  Activity: () => <ProjectActivity project={project} />,
  'All projects': () => <AllProjects onOpen={() => {}} />,
  'Work board': () => <WorkBoard />,
  'For you': () => <ForYou projects={PROJECT_LIST} onOpen={() => {}} onAll={() => {}} />,
  'Weekly timeline': () => <WeekTimeline issues={ISSUES} setIssues={() => {}} me="Anita Rao" />,
  'Backlog / board / list': () => <ProjectBoard project={project} tab="backlog" setTab={() => {}} />,
}

describe('every project page renders cleanly', () => {
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

describe('Roles and permissions', () => {
  it('lists Owner, Admin, Member, Viewer and keeps the Owner column locked on', () => {
    render(<ProjectRoles project={project} />)
    for (const r of ['Owner', 'Admin', 'Member', 'Viewer']) expect(screen.getByRole('columnheader', { name: new RegExp(r) })).toBeInTheDocument()
    const owner = screen.getByRole('checkbox', { name: 'View issues: Owner' })
    expect(owner).toBeChecked(); expect(owner).toBeDisabled()
  })
  it('a change enables Save and Reset, Save confirms it, Reset undoes it', async () => {
    const user = userEvent.setup()
    render(<><ToastHost /><ProjectRoles project={project} /></>)
    const save = screen.getByRole('button', { name: 'Save changes' })
    const reset = screen.getByRole('button', { name: 'Reset' })
    expect(save).toBeDisabled(); expect(reset).toBeDisabled()
    const box = screen.getByRole('checkbox', { name: 'Delete issues: Viewer' })
    const before = box.checked
    await user.click(box)
    expect(box.checked).toBe(!before)
    expect(save).toBeEnabled(); expect(screen.getByText('Unsaved change')).toBeInTheDocument()
    await user.click(reset)
    expect(box.checked).toBe(before); expect(save).toBeDisabled()
    await user.click(box); await user.click(save)
    expect(await screen.findByText('Permissions saved')).toBeInTheDocument()
    expect(save).toBeDisabled()
  })
  it('a group row sets every permission in the group, and groups collapse', async () => {
    const user = userEvent.setup()
    render(<ProjectRoles project={project} />)
    const group = screen.getByRole('checkbox', { name: 'Issues: Viewer' })
    await user.click(group)
    for (const n of ['View issues', 'Create issues', 'Edit issues', 'Delete issues']) expect(screen.getByRole('checkbox', { name: `${n}: Viewer` })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /^Issues/ }))
    expect(screen.queryByRole('checkbox', { name: 'View issues: Viewer' })).toBeNull()
  })
})

describe('Project members', () => {
  it('searches, changes a role and removes a member', async () => {
    const user = userEvent.setup()
    render(<ProjectMembers project={project} />)
    const rows = () => screen.getAllByRole('button', { name: /Open .* profile/ }).length
    const total = rows()
    await user.type(screen.getByPlaceholderText(/Search by name/), 'zzzzqq')
    expect(screen.queryAllByRole('button', { name: /Open .* profile/ })).toHaveLength(0)
    await user.clear(screen.getByPlaceholderText(/Search by name/))
    expect(rows()).toBe(total)
    const remove = screen.getAllByRole('button', { name: /^Remove / })[0]
    await user.click(remove)
    expect(rows()).toBeLessThan(total)
  })
})

describe('All projects', () => {
  it('switches between list and card views and shows an empty state when a search finds nothing', async () => {
    const user = userEvent.setup()
    render(<AllProjects onOpen={() => {}} />)
    const card = screen.getByRole('button', { name: 'Card view' })
    await user.click(card)
    expect(card).toHaveAttribute('aria-pressed', 'true')
    await user.type(screen.getByRole('textbox', { name: /Search projects/i }), 'zzzzqq')
    expect(screen.getByText('No projects found')).toBeInTheDocument()
    await user.clear(screen.getByRole('textbox', { name: /Search projects/i }))
    expect(screen.queryByText('No projects found')).toBeNull()
  })
})

describe('Releases', () => {
  it('shows each release with its status', () => {
    render(<Releases issues={ISSUES} cols={COLS} setIssues={() => {}} />)
    expect(screen.getAllByText('v1.0 Launch').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Released|Unreleased/).length).toBeGreaterThan(1)
  })
})

describe('Credentials', () => {
  it('starts empty, saves a credential, hides its secret until revealed, and deletes it', async () => {
    const user = userEvent.setup()
    render(<Credentials />)
    expect(screen.getByText('No credentials yet.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Add credential|New credential|Add/ }))
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.type(screen.getByPlaceholderText('e.g. Production database'), 'Prod DB')
    await user.type(document.querySelector('input[type="password"]'), 'hunter2')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Prod DB')).toBeInTheDocument()
    expect(screen.queryByText('hunter2')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Show secret' }))
    expect(screen.getByText('hunter2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hide secret' }))
    expect(screen.queryByText('hunter2')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Delete Prod DB' }))
    expect(screen.getByText('No credentials yet.')).toBeInTheDocument()
  })
})

describe('Weekly timeline', () => {
  it('shows the week, steps to the next one and back to today', async () => {
    const user = userEvent.setup()
    render(<WeekTimeline issues={ISSUES} setIssues={() => {}} me="Anita Rao" />)
    const label = () => screen.getByText(/–/, { selector: '.wt-range, span, b' }).textContent
    const first = label()
    await user.click(screen.getByRole('button', { name: /Next week/i }))
    expect(label()).not.toBe(first)
    await user.click(screen.getByRole('button', { name: /Today/i }))
    expect(label()).toBe(first)
  })
})

describe('Weekly timeline is driven by the work items worklogs', () => {
  const today = new Date().toLocaleDateString('en-CA')
  const base = () => [mk('HRM-102', { worklog: [{ id: 'w1', who: 'Anita Rao', min: 120, date: today, start: 600, text: 'Built the export' }], logged: 120 })]
  const Harness = ({ initial }) => {
    const [issues, setIssues] = useState(initial)
    return <><WeekTimeline issues={issues} setIssues={setIssues} me="Anita Rao" /><output data-testid="state">{JSON.stringify(issues[0].worklog)}</output></>
  }
  it('shows a ticket log as a block with its time range, title and key', () => {
    render(<Harness initial={base()} />)
    const block = screen.getByRole('button', { name: /Built the export.*10 AM to 12 PM.*HRM-102/ })
    expect(block.textContent).toMatch(/10 AM – 12 PM/)
    expect(block.textContent).toMatch(/Built the export/)
    expect(block.textContent).toMatch(/HRM-102/)
  })
  it('a log without a start time is still placed on the grid, from 9 AM', () => {
    const noStart = [mk('HRM-102', { worklog: [{ id: 'w2', who: 'Anita Rao', min: 60, date: today, text: 'Quick fix' }], logged: 60 })]
    render(<Harness initial={noStart} />)
    expect(screen.getByRole('button', { name: /Quick fix.*9 AM to 10 AM/ })).toBeInTheDocument()
  })
  it('overlapping blocks sit side by side instead of on top of each other', () => {
    const two = [mk('HRM-102', { worklog: [
      { id: 'a', who: 'Anita Rao', min: 120, date: today, start: 600, text: 'One' },
      { id: 'b', who: 'Anita Rao', min: 60, date: today, start: 660, text: 'Two' },
    ], logged: 180 })]
    render(<Harness initial={two} />)
    const widths = ['One', 'Two'].map((t) => screen.getByRole('button', { name: new RegExp(t) }).style.width)
    expect(widths[0]).toContain('0.5')
    expect(widths[1]).toContain('0.5')
  })
  it('hides other people unless Everyone is chosen, and does not let you edit their blocks', async () => {
    const user = userEvent.setup()
    const others = [mk('HRM-102', { worklog: [{ id: 'x', who: 'Mohan Pillai', min: 60, date: today, start: 600, text: 'Not mine' }], logged: 60 })]
    render(<Harness initial={others} />)
    expect(screen.queryByText('Not mine')).toBeNull()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Show time logged by' }), 'all')
    const b = screen.getByText('Not mine').closest('.wt-ev')
    expect(b).not.toHaveAttribute('role', 'button')
    expect(b.className).toMatch(/other/)
  })
  it('editing a block saves back onto the ticket, deleting removes the worklog', async () => {
    const user = userEvent.setup()
    render(<Harness initial={base()} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Built the export/ }), { key: 'Enter' })
    const dlg = screen.getByRole('dialog', { name: 'Log time' })
    expect(within(dlg).getByRole('heading', { name: 'Edit time block' })).toBeInTheDocument()
    const text = within(dlg).getByRole('textbox', { name: /What did you work on/ })
    await user.clear(text); await user.type(text, 'Rewrote the export')
    await user.click(within(dlg).getByRole('button', { name: '4h' }))
    await user.click(within(dlg).getByRole('button', { name: 'Save changes' }))
    const saved = JSON.parse(screen.getByTestId('state').textContent)
    expect(saved[0]).toMatchObject({ id: 'w1', text: 'Rewrote the export', min: 240, start: 600 })
    fireEvent.keyDown(screen.getByRole('button', { name: /Rewrote the export/ }), { key: 'Enter' })
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))
    expect(JSON.parse(screen.getByTestId('state').textContent)).toEqual([])
  })
  it('switches to a single day and back, and steps through days or weeks', async () => {
    const user = userEvent.setup()
    render(<Harness initial={base()} />)
    expect(document.querySelectorAll('.wt-col')).toHaveLength(7)
    await user.click(screen.getByRole('button', { name: 'Day' }))
    expect(document.querySelectorAll('.wt-col')).toHaveLength(1)
    expect(screen.getByText('Daily timeline')).toBeInTheDocument()
    const label = () => document.querySelector('.tm-nav b').textContent
    const first = label()
    await user.click(screen.getByRole('button', { name: 'Next day' }))
    expect(label()).not.toBe(first)
    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(label()).toBe(first)
    await user.click(screen.getByRole('button', { name: 'Week' }))
    expect(document.querySelectorAll('.wt-col')).toHaveLength(7)
  })
})

describe('timeline lanes', () => {
  const today2 = new Date().toLocaleDateString('en-CA')
  it('a block that overlaps nothing keeps the full column width even when another pair overlaps elsewhere that day', () => {
    const issues = [mk('HRM-102', { worklog: [
      { id: 'a', who: 'Anita Rao', min: 120, date: today2, start: 600, text: 'One' },
      { id: 'b', who: 'Anita Rao', min: 60, date: today2, start: 660, text: 'Two' },
      { id: 'c', who: 'Anita Rao', min: 60, date: today2, start: 840, text: 'Alone' },
    ], logged: 240 })]
    render(<WeekTimeline issues={issues} setIssues={() => {}} me="Anita Rao" />)
    const w = (t) => screen.getByRole('button', { name: new RegExp(t) }).style.width
    expect(w('One')).toContain('0.5')
    expect(w('Alone')).toContain('1 *')
  })
})
