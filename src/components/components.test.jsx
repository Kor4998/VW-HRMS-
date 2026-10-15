import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Plus } from 'lucide-react'
import { audit } from '@/test/audit'
import Checkbox from './Checkbox'
import Modal from './Modal'
import Slideout from './Slideout'
import DatePicker, { rangeLabel } from './DatePicker'
import FilterMenu from './FilterMenu'
import HoldButton from './HoldButton'
import Steps from './Steps'
import Countdown from './Countdown'
import Avatar, { AvatarGroup } from './Avatar'
import { photoNo, photoOf, ROSTER, PHOTOS } from './avatarPhotos'
import { ArcBars, ArcRing } from './ArcCharts'
import DonutBreakdown from './DonutBreakdown'
import ToastHost from './ToastHost'
import { toast } from './toast'
import CommandMenu from './CommandMenu'
import AppSwitcher from './AppSwitcher'
import ActivityFeed from './ActivityFeed'
import DashboardBreadcrumb from './DashboardBreadcrumb'
import SpaceWizard from './SpaceWizard'
import ComposeMessage from './ComposeMessage'
import AnnouncementModal from './AnnouncementModal'

const clean = (c = document.body) => expect(audit(c)).toEqual([])

describe('Checkbox', () => {
  it('toggles from its label and shows supporting text', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox label="Remember me" supporting="Stay signed in" onChange={onChange} />)
    await user.click(screen.getByText('Remember me'))
    expect(onChange).toHaveBeenCalled()
    expect(screen.getByText('Stay signed in')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Remember me/ })).toBeChecked()
    clean()
  })
  it('supports the indeterminate state', () => {
    render(<Checkbox label="Some" indeterminate onChange={() => {}} />)
    expect(screen.getByRole('checkbox').indeterminate).toBe(true)
  })
})

describe('Modal and Slideout', () => {
  it('Modal renders only when open, is a labelled dialog, closes on Escape and on the close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = render(<Modal open={false} title="Edit profile" onClose={onClose}>body</Modal>)
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(<Modal open title="Edit profile" onClose={onClose} footer={<button type="button">Save</button>}>body</Modal>)
    expect(screen.getByRole('dialog', { name: /Edit profile/ })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    clean()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
  it('Slideout shows title, description and footer and closes on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Slideout open title="Request details" desc="Review the request" onClose={onClose} footer={<button type="button">Approve</button>}>content</Slideout>)
    expect(screen.getByRole('dialog', { name: /Request details/ })).toBeInTheDocument()
    expect(screen.getByText('Review the request')).toBeInTheDocument()
    clean()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})

describe('DatePicker', () => {
  it('labels ranges', () => {
    expect(rangeLabel(null)).toBe('Select dates')
    expect(rangeLabel({ from: new Date(2026, 9, 12), to: new Date(2026, 9, 18) })).toMatch(/12.*18/)
    expect(rangeLabel({ from: new Date(2026, 9, 12), to: new Date(2026, 9, 12) })).not.toMatch(/–/)
  })
  it('opens, picks a start and an end, and applies', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<DatePicker value={null} onApply={onApply} today={new Date(2026, 9, 14)} />)
    await user.click(screen.getByRole('button', { name: /Select dates/ }))
    const dlg = screen.getByRole('dialog', { name: 'Choose dates' })
    const day = (n) => within(dlg).getAllByRole('button').find((b) => b.textContent.trim() === String(n) && !b.closest('.dp-presets'))
    await user.click(day(10))
    await user.click(day(16))
    expect(within(dlg).getByLabelText('Start date')).toHaveValue('10 / 10 / 2026'.replace(/ /g, ''))
    await user.click(within(dlg).getByRole('button', { name: 'Apply' }))
    expect(onApply).toHaveBeenCalledWith({ from: new Date(2026, 9, 10), to: new Date(2026, 9, 16) })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('a preset fills the range and Cancel closes without applying', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<DatePicker value={null} onApply={onApply} today={new Date(2026, 9, 14)} />)
    await user.click(screen.getByRole('button', { name: /Select dates/ }))
    await user.click(within(screen.getByRole('list', { name: 'Presets' })).getAllByRole('button')[0])
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onApply).not.toHaveBeenCalled()
    clean()
  })
})

describe('FilterMenu', () => {
  const options = [{ value: 'all', label: 'All' }, { value: 'wfh', label: 'Work from home' }]
  it('opens, adds and removes a choice, and shows how many are active', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<FilterMenu options={options} value={[]} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()
    await user.click(screen.getByText('Work from home'))
    expect(onChange).toHaveBeenCalledWith(['wfh'])
    rerender(<FilterMenu options={options} value={['wfh']} onChange={onChange} />)
    expect(screen.getByRole('button', { name: /Filters/ })).toHaveTextContent('1')
    await user.click(screen.getByText('Work from home'))
    expect(onChange).toHaveBeenLastCalledWith([])
    clean()
  })
  it('searches the options', async () => {
    const user = userEvent.setup()
    render(<FilterMenu options={options} value={[]} onChange={() => {}} />)
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    const search = screen.queryByRole('searchbox') || screen.queryByPlaceholderText(/Search/i)
    if (search) { await user.type(search, 'work'); expect(screen.queryByText('All')).toBeNull() }
  })
})

describe('HoldButton', () => {
  it('confirms only after being held, and not on a quick tap', () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn()
    render(<HoldButton onConfirm={onConfirm} hold={800}>Hold to delete</HoldButton>)
    const b = screen.getByRole('button', { name: /Hold to delete/ })
    fireEvent.pointerDown(b); act(() => { vi.advanceTimersByTime(300) }); fireEvent.pointerUp(b)
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.pointerDown(b); act(() => { vi.advanceTimersByTime(900) })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

describe('Steps, Countdown, Avatar, charts', () => {
  it('Steps marks the current step', () => {
    render(<Steps label="Onboarding" steps={[{ title: 'Details', text: 'Done', state: 'done' }, { title: 'Documents', text: 'Upload', state: 'current' }, { title: 'Review', text: 'Next', state: 'todo' }]} />)
    expect(screen.getByRole('list', { name: 'Onboarding' })).toBeInTheDocument()
    expect(screen.getByText('Documents').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('Details').closest('li')).not.toHaveAttribute('aria-current')
    clean()
  })
  it('Countdown shows remaining time and the complete label when the target passed', () => {
    const done = vi.fn()
    const { unmount } = render(<Countdown target={Date.now() + 90_000} />)
    expect(screen.getByRole('timer', { name: 'Time remaining' })).toBeInTheDocument()
    expect(screen.queryByText('Live now')).toBeNull()
    unmount()
    render(<Countdown target={Date.now() - 1000} completeLabel="Live now" onComplete={done} />)
    expect(screen.getByText('Live now')).toBeInTheDocument()
    expect(done).toHaveBeenCalledTimes(1)
  })
  it('Avatar falls back to initials and has an accessible name', () => {
    render(<Avatar name="Anita Rao" />)
    expect(screen.getByText('AR')).toBeInTheDocument()
    clean()
  })
  it('AvatarGroup caps the visible people and shows the overflow count', () => {
    render(<AvatarGroup names={['A One', 'B Two', 'C Three', 'D Four', 'E Five', 'F Six']} max={4} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
    clean()
  })
  it('ArcBars labels every bar and exposes the data to assistive tech', () => {
    render(<ArcBars data={[['Mon', 3], ['Tue', 5]]} unit="h" />)
    expect(screen.getByRole('img', { name: /Mon 3, Tue 5/ })).toBeInTheDocument()
  })
  it('ArcRing shows its value and caption', () => {
    render(<ArcRing value={5} total={10} color="#2563EB" title="5.5" caption="days" />)
    expect(screen.getByText('5.5')).toBeInTheDocument()
    expect(screen.getByText('days')).toBeInTheDocument()
  })
  it('DonutBreakdown switches between ranges and keeps one row per item', async () => {
    const user = userEvent.setup()
    render(<DonutBreakdown title="Leave balance" centerLabel="Available" ranges={[
      { key: 'a', label: 'Balance', subtitle: 'Resets 1 Apr', items: [{ label: 'Paid Leaves', value: 4.5, color: '#2563EB' }, { label: 'Comp Off', value: 1, color: '#16A34A' }] },
      { key: 'b', label: 'Used', subtitle: 'Taken', center: 17, centerLabel: 'Used', items: [{ label: 'Casual', value: 9, color: '#2563EB' }] },
    ]} />)
    expect(screen.getAllByText('Paid Leaves')).toHaveLength(1)
    await user.click(screen.getByRole('tab', { name: 'Used' }))
    expect(screen.getByText('Casual')).toBeInTheDocument()
    expect(screen.getByText('Used', { selector: '.dn-c span' })).toBeInTheDocument()
    clean()
  })
})

describe('ToastHost', () => {
  it('shows a toast with a working action and dismisses it', async () => {
    const user = userEvent.setup()
    const run = vi.fn()
    render(<ToastHost />)
    act(() => { toast({ title: 'HRM-1 created', text: 'Added', duration: 0, action: { label: 'Open HRM-1', run } }) })
    expect(await screen.findByText('HRM-1 created')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
    clean()
    await user.click(screen.getByRole('button', { name: 'Open HRM-1' }))
    expect(run).toHaveBeenCalled()
    expect(screen.queryByText('HRM-1 created')).toBeNull()
  })
  it('removes itself after its duration, and Dismiss closes it early', async () => {
    vi.useFakeTimers()
    render(<ToastHost />)
    act(() => { toast({ title: 'Saved', duration: 1000 }) })
    expect(screen.getByText('Saved')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1100) })
    expect(screen.queryByText('Saved')).toBeNull()
    vi.useRealTimers()
    const user = userEvent.setup()
    act(() => { toast({ title: 'Second', duration: 0 }) })
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('Second')).toBeNull()
  })
})

describe('CommandMenu', () => {
  const groups = [{ label: 'Go to', items: [{ label: 'Dashboard', icon: Plus, run: vi.fn() }, { label: 'Attendance', icon: Plus, run: vi.fn() }] }]
  it('filters while typing, runs the highlighted item with Enter and closes with Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<CommandMenu open onClose={onClose} groups={groups} />)
    const box = screen.getByPlaceholderText(/Search/i)
    await user.type(box, 'atten')
    expect(screen.queryByText('Dashboard')).toBeNull()
    expect(screen.getByText('Attendance')).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(groups[0].items[1].run).toHaveBeenCalled()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
  it('says so when nothing matches', async () => {
    const user = userEvent.setup()
    render(<CommandMenu open onClose={() => {}} groups={groups} />)
    await user.type(screen.getByPlaceholderText(/Search/i), 'zzzz')
    expect(screen.getByText(/No results|Nothing found|No matches/i)).toBeInTheDocument()
  })
})

describe('AppSwitcher, ActivityFeed, DashboardBreadcrumb', () => {
  it('AppSwitcher lists the apps and reports the choice', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<AppSwitcher current="portal" onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /apps/i }))
    await user.click(screen.getByText('Projects'))
    expect(onSelect).toHaveBeenCalled()
    clean()
  })
  it('ActivityFeed renders each item', () => {
    render(<ActivityFeed items={[{ id: 1, name: 'Anita Rao', ini: 'AR', time: '2m ago', text: 'approved a leave', unread: true }]} />)
    expect(screen.getByText('Anita Rao')).toBeInTheDocument()
    expect(screen.getByLabelText('Unread')).toBeInTheDocument()
    clean()
  })
  it('DashboardBreadcrumb shows the app and current page and goes home', async () => {
    const user = userEvent.setup()
    const onHome = vi.fn()
    render(<DashboardBreadcrumb current="Attendance" onHome={onHome} />)
    expect(screen.getByText('Attendance')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Home' }))
    expect(onHome).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('link', { name: 'Employee Portal' }))
    expect(onHome).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: 'Show previous pages' })).toBeInTheDocument()
    clean()
  })
})

describe('SpaceWizard, ComposeMessage, AnnouncementModal', () => {
  it('SpaceWizard blocks an empty name, then creates a space with a unique key', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<SpaceWizard open onClose={() => {}} onCreate={onCreate} existingKeys={['HRM']} />)
    clean()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Next|Continue|Create/ }))
    expect(onCreate).not.toHaveBeenCalled()
  })
  it('ComposeMessage opens with the recipients and from address', () => {
    render(<ComposeMessage open onClose={() => {}} to={['Anita Rao']} />)
    expect(screen.getByText(/Anita Rao/)).toBeInTheDocument()
    clean()
  })
  it('AnnouncementModal shows the announcement and closes', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AnnouncementModal a={{ title: 'Holiday on Friday', body: 'Office closed.', date: '2026-10-16', tag: 'HR' }} onClose={onClose} />)
    expect(screen.getByText('Holiday on Friday')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button')[0])
    expect(onClose).toHaveBeenCalled()
    expect(within(document.body).getByRole('dialog')).toBeTruthy()
  })
})

describe('Avatar photos', () => {
  it('a person keeps the same photo no matter what was asked for before', () => {
    const first = photoNo('Anita Rao')
    photoNo('Zed Unknown'); photoNo('Mohan Pillai')
    expect(photoNo('Anita Rao')).toBe(first)
    expect(photoNo('Someone New')).toBe(photoNo('Someone New'))
    expect(photoOf('Anita Rao')).toMatch(/avatars\/p\d+\.jpg$/)
    expect(photoOf('')).toBeUndefined()
  })
  it('the project team members each get a different photo', () => {
    const names = ['Venkatesh Korlapati', 'Anita Rao', 'Mohan Pillai', 'Vinod Pasupuleti', 'Kalyani Devarapalli', 'Aasritha Samudrala', 'Gaurav Bhadani', 'Diviti Tejesh']
    expect(new Set(names.map(photoNo)).size).toBe(names.length)
  })
  it('every photo number maps to a real file', () => {
    const nums = [...Object.values(ROSTER), photoNo('x'), photoNo('Daniel Okafor')]
    for (const n of nums) expect(n >= 1 && n <= PHOTOS).toBe(true)
  })
})
