import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DateField, { toIso } from './DateField'

describe('DateField (single date, no native calendar)', () => {
  it('shows the date, opens one month with no range presets, and picking a day applies it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DateField value="2026-10-15" onChange={onChange} />)
    const btn = screen.getByRole('button', { name: /15 Oct 2026/ })
    expect(document.querySelector('input[type="date"]')).toBeNull()
    await user.click(btn)
    const dlg = screen.getByRole('dialog', { name: 'Choose dates' })
    expect(within(dlg).queryByRole('list', { name: 'Presets' })).toBeNull()
    expect(within(dlg).queryByRole('button', { name: 'Apply' })).toBeNull()
    await user.click(within(dlg).getAllByRole('button').find((b) => b.textContent.trim() === '20'))
    expect(onChange).toHaveBeenCalledWith('2026-10-20')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('can move to the next month and shows a prompt when empty', async () => {
    const user = userEvent.setup()
    render(<DateField value="" onChange={() => {}} empty="Set due date" />)
    await user.click(screen.getByRole('button', { name: 'Set due date' }))
    const title = () => document.querySelector('.dp-cal b').textContent
    const before = title()
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(title()).not.toBe(before)
  })
  it('formats iso dates', () => { expect(toIso(new Date(2026, 0, 5))).toBe('2026-01-05') })
})
