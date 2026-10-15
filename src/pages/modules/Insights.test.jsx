import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Insights from './Insights'

const lines = (c) => c.querySelectorAll('.in-chart .ln.cu').length
const toggles = (name) => screen.getAllByRole('button', { name })

describe('Attendance insights chart', () => {
  it('draws all four metrics as smooth filled areas on one chart, each in its own colour', () => {
    const { container } = render(<Insights />)
    expect(lines(container)).toBe(4)
    expect(container.querySelectorAll('.in-chart linearGradient')).toHaveLength(4)
    const colours = [...container.querySelectorAll('.in-chart .ln.cu')].map((l) => l.style.stroke)
    expect(new Set(colours).size).toBe(4)
    expect([...container.querySelectorAll('.in-chart .ln.cu')].every((l) => l.getAttribute('d').includes('C'))).toBe(true)
  })

  it('has a range dropdown in the chart header that changes the period', async () => {
    const user = userEvent.setup()
    render(<Insights />)
    const sel = screen.getByRole('combobox', { name: 'Time range' })
    expect(sel).toHaveValue('30')
    expect(screen.getByText(/for the last 30 days/)).toBeInTheDocument()
    await user.selectOptions(sel, '7')
    expect(screen.getByText(/for the last 7 days/)).toBeInTheDocument()
  })

  it('the metric cards and the legend both show and hide a line', async () => {
    const user = userEvent.setup()
    const { container } = render(<Insights />)
    expect(toggles(/Break time/)).toHaveLength(2) // card + legend
    await user.click(toggles(/Break time/)[0])
    expect(lines(container)).toBe(3)
    await user.click(toggles(/Break time/)[1])
    expect(lines(container)).toBe(4)
  })

  it('always keeps at least one line on the chart', async () => {
    const user = userEvent.setup()
    const { container } = render(<Insights />)
    for (const n of [/Hours worked/, /On-time arrival/, /Break time/, /Late marks/]) await user.click(toggles(n)[0])
    expect(lines(container)).toBe(1)
  })

  it('shows break time in hours and minutes, not raw minutes', () => {
    render(<Insights />)
    const card = screen.getAllByRole('button', { name: /Break time/ })[0]
    expect(card.textContent).toMatch(/\d+h( \d+m)?/)
    expect(card.textContent).not.toMatch(/\d{2,3}m(?!\w)(?<!h \d{1,2}m)/)
  })
})
