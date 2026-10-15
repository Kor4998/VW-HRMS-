import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fs from 'node:fs'
import path from 'node:path'
import Dashboard from '@/pages/Dashboard'
import ToastHost from '@/components/ToastHost'
import { toast } from '@/components/toast'
import CreateIssue from '@/pages/modules/CreateIssue'
import ProjectMembers from '@/pages/modules/ProjectMembers'
import { Credentials } from '@/pages/modules/ProjectOps2'
import { PROJECT_LIST } from '@/pages/modules/ProjectsPages'

const project = PROJECT_LIST[0]
const wait = (ms = 380) => act(() => new Promise((r) => setTimeout(r, ms)))

describe('accessibility contract', () => {
  it('has a skip link as the first focusable element, and it moves focus to the page heading', async () => {
    const user = userEvent.setup()
    render(<Dashboard onLogout={() => {}} />)
    await wait()
    await user.tab()
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(skip).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(document.activeElement.closest('.page')).toBeTruthy()
    expect(['H1', 'H2']).toContain(document.activeElement.tagName)
  })

  it('the default sidebar marks the current page with aria-current', async () => {
    render(<Dashboard onLogout={() => {}} />)
    await wait()
    const current = document.querySelectorAll('.sidebar [aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveAttribute('aria-label', 'Dashboard')
  })

  it('errors are announced assertively, everything else politely', () => {
    render(<ToastHost />)
    act(() => { toast({ title: 'Saved', duration: 0 }); toast({ title: 'Upload failed', tone: 'error', duration: 0 }) })
    expect(screen.getByText('Saved').closest('.ov-toast')).toHaveAttribute('role', 'status')
    expect(screen.getByText('Upload failed').closest('.ov-toast')).toHaveAttribute('role', 'alert')
  })
})

describe('Tier 0 destructive actions: act now, offer Undo', () => {
  it('removing a project member shows an Undo toast that restores them in place', async () => {
    const user = userEvent.setup()
    render(<><ToastHost /><ProjectMembers project={project} /></>)
    const names = () => screen.getAllByRole('button', { name: /^Open .*’s profile|^Open .*'s profile/ }).map((b) => b.getAttribute('aria-label'))
    const before = names()
    const target = screen.getAllByRole('button', { name: /^Remove / })[0]
    const who = target.getAttribute('aria-label').replace('Remove ', '')
    await user.click(target)
    expect(names().length).toBe(before.length - 1)
    await user.click(await screen.findByRole('button', { name: 'Undo' }))
    expect(names()).toEqual(before)
    expect(screen.getByRole('button', { name: `Remove ${who}` })).toBeInTheDocument()
  })

  it('deleting a credential can be undone', async () => {
    const user = userEvent.setup()
    render(<><ToastHost /><Credentials /></>)
    await user.click(screen.getByRole('button', { name: /Add credential|New credential|Add/ }))
    await user.type(screen.getByPlaceholderText('e.g. Production database'), 'Prod DB')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await user.click(screen.getByRole('button', { name: 'Delete Prod DB' }))
    const table = () => document.querySelector('.wl-table')
    expect(table()).toBeNull() // the list is empty again
    await user.click(await screen.findByRole('button', { name: 'Undo' }))
    expect(within(table()).getByText('Prod DB')).toBeInTheDocument()
  })
})

describe('unsaved-changes guard on the Create dialog', () => {
  const setup = () => {
    const onClose = vi.fn()
    render(<CreateIssue open onClose={onClose} project={project} people={['Anita Rao']} epics={[]} sprints={['Sprint 1', '']} onCreate={() => ({ id: 'HRM-1' })} />)
    return { onClose, user: userEvent.setup() }
  }
  it('a clean form closes without asking', async () => {
    const { onClose, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
  it('a dirty form asks first; Keep editing is the focused default and nothing is lost', async () => {
    const { onClose, user } = setup()
    await user.type(screen.getByLabelText('Summary'), 'Payroll export bug')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    const guard = screen.getByRole('alertdialog', { name: 'Leave this work item?' })
    expect(within(guard).getByRole('button', { name: 'Keep editing' })).toHaveFocus()
    expect(onClose).not.toHaveBeenCalled()
    await user.keyboard('{Escape}') // Esc keeps editing
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByLabelText('Summary')).toHaveValue('Payroll export bug')
  })
  it('Discard changes closes; Esc on a dirty form asks instead of closing', async () => {
    const { onClose, user } = setup()
    await user.type(screen.getByLabelText('Summary'), 'x')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('voice', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.jsx$/.test(e.name) && !/test|preview/.test(e.name) ? [path.join(d, e.name)] : []))
  const files = walk(path.resolve(__dirname, '..'))
  it('has no filler or vague copy in the interface text', () => {
    const banned = /Something went wrong|Are you sure|\bOops\b|Success!|>No data<|>Submit<|Please try again|Please select|Please enter/
    const hits = files.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').map((l, i) => [f, i + 1, l]).filter(([, , l]) => banned.test(l)).map(([f2, n]) => `${path.basename(f2)}:${n}`))
    expect(hits).toEqual([])
  })
  it('uses sentence case on the sign-in button', async () => {
    const { default: Login } = await import('@/pages/Login')
    render(<Login onLogin={() => {}} />)
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })
})
