import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { audit } from '@/test/audit'
import { TreeNav, PanelNav } from './AppSidebar'
import { ITEMS, SIDEBAR_TYPES, allScreens, searchScreens } from './sidebarMenus'

const NavIcon = () => <svg />
const clean = () => expect(audit(document.body)).toEqual([])
const DEFAULT_ORDER = ['Dashboard', 'My Profile', 'Shift Management', 'Attendance', 'Asset', 'Leave Management', 'My Team', 'Approvals', 'Policies']

describe('menu data', () => {
  it('offers the three sidebar types, default first', () => {
    expect(SIDEBAR_TYPES.map(([, n]) => n)).toEqual(['Default Sidebar', 'Hierarchical Sidebar (3-Level)', 'Cascading Sidebar (Hover Panels)'])
  })
  it('lists the same items, in the same order, as the Default sidebar', () => {
    expect(ITEMS.map((i) => i.label)).toEqual(DEFAULT_ORDER)
  })
  it('gives each tabbed page its own tabs as screens', () => {
    const screens = (l) => ITEMS.find((i) => i.label === l).screens.map(([, n]) => n)
    expect(screens('Shift Management')).toEqual(['My roster', 'Shift swap', 'Shift approval', 'Shifts claim'])
    expect(screens('Attendance')).toEqual(['Attendance history', 'Insights', 'Regularization', 'Work from home'])
    expect(screens('Leave Management')).toEqual(['Overview', 'Leave requests', 'Leave ledger', 'Comp off'])
    expect(screens('Asset')).toEqual(['View all', 'My assets', 'Requests', 'Transfers', 'Tickets'])
  })
  it('finds a specific screen, best match first, and nothing for gibberish', () => {
    expect(allScreens().length).toBeGreaterThan(ITEMS.length)
    expect(searchScreens('insi')[0]).toMatchObject({ label: 'Insights', tab: 'insights', go: 'Attendance' })
    expect(searchScreens('zzzz')).toEqual([])
  })
})

describe('Hierarchical sidebar', () => {
  it('shows the Default menu items in order using the Default sidebar classes', () => {
    const { container } = render(<TreeNav page={null} tab={null} go={() => {}} NavIcon={NavIcon} />)
    const labels = [...container.querySelectorAll('.nav-item')].map((e) => e.getAttribute('aria-label'))
    expect(labels).toEqual(DEFAULT_ORDER)
    expect(container.querySelector('.nav-item.active').getAttribute('aria-label')).toBe('Dashboard')
  })
  it('the open page lists its screens like the Default sub-menu, with the current one marked', () => {
    const { container } = render(<TreeNav page="Attendance" tab="insights" go={() => {}} NavIcon={NavIcon} />)
    expect(screen.getByRole('button', { name: 'Attendance' })).toHaveAttribute('aria-expanded', 'true')
    const subs = [...container.querySelectorAll('.nav-sub-item')]
    expect(subs.map((s) => s.textContent)).toEqual(['Attendance history', 'Insights', 'Regularization', 'Work from home'])
    expect(container.querySelector('.nav-sub-item.active').textContent).toBe('Insights')
    clean()
  })
  it('clicking a screen goes to that page and tab; clicking another page opens its first screen', async () => {
    const user = userEvent.setup()
    const go = vi.fn()
    render(<TreeNav page="Attendance" tab="history" go={go} NavIcon={NavIcon} />)
    await user.click(screen.getByText('Regularization'))
    expect(go).toHaveBeenCalledWith('Attendance', 'reg')
    await user.click(screen.getByRole('button', { name: 'Shift Management' }))
    expect(go).toHaveBeenLastCalledWith('Shift Management', 'roster')
    await user.click(screen.getByRole('link', { name: 'Policies' }))
    expect(go).toHaveBeenLastCalledWith('Policies')
  })
  it('shows the pending badge on Approvals', () => {
    render(<TreeNav page={null} tab={null} go={() => {}} NavIcon={NavIcon} badges={{ Approvals: 4 }} />)
    expect(screen.getByLabelText('4 pending')).toBeInTheDocument()
  })
  it('search lists specific pages and screens and navigates, then clears', async () => {
    const user = userEvent.setup()
    const go = vi.fn()
    render(<TreeNav page={null} tab={null} go={go} NavIcon={NavIcon} />)
    await user.type(screen.getByRole('searchbox', { name: /Search pages and screens/ }), 'ledger')
    const hits = screen.getByRole('list', { name: 'Search results' })
    expect(within(hits).getByText('Leave Management')).toBeInTheDocument()
    await user.click(within(hits).getByRole('button', { name: /Leave ledger/ }))
    expect(go).toHaveBeenCalledWith('Leave Management', 'ledger')
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })
})

describe('Cascading sidebar', () => {
  it('has the Default items on a rail; clicking one opens its screens in the panel', async () => {
    const user = userEvent.setup()
    render(<PanelNav page="Attendance" tab="history" go={() => {}} NavIcon={NavIcon} />)
    const rail = screen.getByRole('tablist', { name: 'Pages' })
    expect(within(rail).getAllByRole('tab').map((t) => t.getAttribute('aria-label'))).toEqual(DEFAULT_ORDER)
    expect(screen.getByRole('button', { name: 'Attendance history' })).toHaveAttribute('aria-current', 'page')
    await user.click(within(rail).getByRole('tab', { name: 'Asset' }))
    expect(await screen.findByRole('button', { name: 'Tickets' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Attendance history' })).toBeNull()
    clean()
  })
  it('screens navigate, clicking the rail opens the page, search spans every page, collapsed shows only the rail', async () => {
    const user = userEvent.setup()
    const go = vi.fn()
    const { rerender } = render(<PanelNav page={null} tab={null} go={go} NavIcon={NavIcon} />)
    await user.click(screen.getByRole('tab', { name: 'Leave Management' }))
    expect(go).toHaveBeenLastCalledWith('Leave Management', 'overview')
    await user.click(screen.getByRole('button', { name: 'Leave requests' }))
    expect(go).toHaveBeenLastCalledWith('Leave Management', 'requests')
    await user.type(screen.getByRole('searchbox'), 'tickets')
    await user.click(within(screen.getByRole('list', { name: 'Search results' })).getByRole('button', { name: /Tickets/ }))
    expect(go).toHaveBeenLastCalledWith('Asset', 'ticket')
    rerender(<PanelNav page={null} tab={null} go={go} NavIcon={NavIcon} collapsed />)
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.getAllByRole('tab')).toHaveLength(ITEMS.length)
  })
})

describe('Cascading sidebar: hover only highlights, click opens', () => {
  it('hovering or focusing a tile does not change the panel; clicking does', async () => {
    const user = userEvent.setup()
    const go = vi.fn()
    render(<PanelNav page="Attendance" tab="history" go={go} NavIcon={NavIcon} />)
    const asset = screen.getByRole('tab', { name: 'Asset' })
    await user.hover(asset)
    asset.focus()
    expect(screen.getByRole('button', { name: 'Attendance history' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tickets' })).toBeNull()
    await user.unhover(asset)
    await user.click(asset)
    expect(screen.getByRole('button', { name: 'Tickets' })).toBeInTheDocument()
    expect(go).toHaveBeenLastCalledWith('Asset', 'all')
  })
})
