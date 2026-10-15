import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import { audit, captureConsole } from './audit'

const wait = (ms = 380) => act(() => new Promise((r) => setTimeout(r, ms)))
const problems = []
const note = (where) => { for (const p of audit(document.body)) problems.push(`${where}: ${p}`) }
const click = async (user, el) => { await user.click(el); await wait(120) }
const byText = (sel, re) => [...document.querySelectorAll(sel)].find((e) => re.test(e.textContent.trim()))
const noise = /not wrapped in act|ReactDOMTestUtils/

const open = async () => {
  const user = userEvent.setup()
  render(<Dashboard onLogout={() => {}} />)
  await wait()
  return user
}

describe('overlays, menus and dialogs', () => {
  it('Login page', () => {
    const con = captureConsole(vi)
    render(<Login onLogin={() => {}} />)
    note('Login')
    con.restore()
    expect(con.seen.filter(([, m]) => !noise.test(m))).toEqual([])
    expect(problems.filter((p) => p.startsWith('Login'))).toEqual([])
  })

  it('HR shell: command bar, notifications, profile menu, settings, app switcher, collapsed sidebar, show more', async () => {
    const con = captureConsole(vi)
    const user = await open()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true }); await wait(150)
    note('Command bar')
    fireEvent.keyDown(document, { key: 'Escape' }); await wait(150)

    const bell = document.querySelector('[aria-label*="otification" i]')
    expect(bell, 'notification bell').toBeTruthy()
    await click(user, bell)
    note('Notifications panel')
    for (const tab of [...document.querySelectorAll('.np-tabs button, [role="tab"]')].slice(0, 6)) { await click(user, tab); note(`Notifications › ${tab.textContent.trim().slice(0, 14)}`) }
    fireEvent.keyDown(document, { key: 'Escape' }); await wait(150)

    const more = document.querySelector('.more-btn')
    if (more) { await click(user, more); note('Dashboard › show more'); await click(user, document.querySelector('.more-btn')) }

    const avatar = document.querySelector('[aria-label*="account" i], [aria-label*="profile menu" i], .avatar-btn, .user-btn')
    if (avatar) { await click(user, avatar); note('Profile menu') }
    const settings = byText('[role="menuitem"], button', /^Settings/)
    if (settings) {
      await click(user, settings); note('Settings')
      for (const tab of [...document.querySelectorAll('[role="tab"], .st-nav button')].slice(0, 12)) { await click(user, tab); note(`Settings › ${tab.textContent.trim().slice(0, 16)}`) }
      fireEvent.keyDown(document, { key: 'Escape' }); await wait(150)
    }

    const sw = document.querySelector('[aria-label*="pps" i]')
    await click(user, sw); note('App switcher')
    fireEvent.keyDown(document, { key: 'Escape' }); await wait(150)

    const collapse = document.querySelector('[aria-label="Collapse sidebar"]')
    if (collapse) { await click(user, collapse); note('Collapsed sidebar') }
    con.restore()
    expect(con.seen.filter(([, m]) => !noise.test(m)).map((x) => x.join(': '))).toEqual([])
    expect(problems.filter((p) => !p.startsWith('Login'))).toEqual([])
  }, 120000)

  it('Support app pages', async () => {
    const con = captureConsole(vi)
    const user = await open()
    await click(user, document.querySelector('[aria-label*="pps" i]'))
    const sup = byText('button, a, [role="menuitem"]', /Support/)
    if (sup) {
      await click(user, sup)
      for (const item of [...document.querySelectorAll('.sidebar .nav-item')].slice(0, 12)) { await click(user, item); await wait(250); note(`Support › ${item.textContent.trim().slice(0, 20)}`) }
    }
    con.restore()
    expect(con.seen.filter(([, m]) => !noise.test(m)).map((x) => x.join(': '))).toEqual([])
    expect(problems.filter((p) => p.startsWith('Support'))).toEqual([])
  }, 120000)

  it('Projects: create work item, issue page, log work dialog, space wizard', async () => {
    const con = captureConsole(vi)
    const user = await open()
    await click(user, document.querySelector('[aria-label*="pps" i]'))
    await click(user, byText('button, a, [role="menuitem"]', /^Projects$/))
    await click(user, byText('.pn-item', /HRMS/))
    await click(user, byText('.pn-views button', /^List/)); await wait(300)
    const create = byText('button', /^Create$/)
    await click(user, create); note('Create work item dialog')
    const summary = document.querySelector('.ci-sum')
    await user.type(summary, 'Audit ticket')
    await click(user, [...document.querySelectorAll('.ci-btn')].pop()); await wait(200); note('Log work dialog after create')
    const lw = document.querySelector('.lw')
    expect(lw, 'log work dialog opens after creating a ticket').toBeTruthy()
    await user.type(lw.querySelector('input[name="timeSpent"]'), '1h')
    await click(user, lw.querySelector('.ci-btn')); await wait(200)
    await click(user, byText('.ov-toast button', /^Open HRM-/)); await wait(300); note('Issue page')
    expect(document.querySelector('.iv-ts'), 'ticket timesheet section').toBeTruthy()
    await click(user, byText('.iv-page button', /Log work/)); note('Issue page › log work dialog')
    fireEvent.keyDown(document, { key: 'Escape' }); await wait(150)
    window.dispatchEvent(new Event('prj-create')); await wait(300); note('Create space wizard')
    fireEvent.keyDown(document, { key: 'Escape' }); await wait(150)
    await click(user, byText('.pn-views button', /^Timesheets/)); await wait(300)
    await click(user, byText('button', /^Grid$/)); note('Timesheets grid')
    await click(user, byText('button', /^Timeline$/)); note('Timesheets timeline')
    con.restore()
    expect(con.seen.filter(([, m]) => !noise.test(m)).map((x) => x.join(': '))).toEqual([])
    expect(problems.filter((p) => /^(Create|Log|Issue|Timesheets)/.test(p))).toEqual([])
  }, 120000)
})
