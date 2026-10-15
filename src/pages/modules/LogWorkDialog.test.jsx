import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LogWorkDialog from './LogWorkDialog'

const issue = { id: 'HRM-113', title: 'Payroll export bug', type: 'task', est: 480, logged: 60 }
const project = { key: 'HRM' }
const setup = (props = {}) => {
  const onSave = vi.fn()
  const onClose = vi.fn()
  render(<LogWorkDialog issue={issue} project={project} who="Venkatesh Korlapati" onSave={onSave} onClose={onClose} {...props} />)
  return { onSave, onClose, user: userEvent.setup() }
}

describe('LogWorkDialog', () => {
  it('names the ticket at the top and shows estimate, logged and remaining', () => {
    setup()
    expect(screen.getByRole('dialog', { name: /log work on HRM-113/i })).toBeInTheDocument()
    expect(screen.getByText('HRM-113')).toBeInTheDocument()
    expect(screen.getByText('Payroll export bug')).toBeInTheDocument()
    expect(screen.getByText(/Estimate/).textContent).toMatch(/1d/)
    expect(screen.getByText(/Remaining/).textContent).toMatch(/7h/)
  })

  it('asks for the time worked and does not save an empty entry', async () => {
    const { onSave, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/enter the time you worked/i)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves minutes, date and description', async () => {
    const { onSave, user } = setup()
    await user.type(screen.getByLabelText(/time spent/i), '2h 30m')
    await user.type(screen.getByLabelText(/work description/i), 'Fixed the export')
    expect(screen.getByText(/Remaining estimate will become/).textContent).toMatch(/4h 30m/)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ min: 150, text: 'Fixed the export', date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }))
  })

  it('quick chips fill the time field', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: '4h' }))
    expect(screen.getByLabelText(/time spent/i)).toHaveValue('4h')
  })

  it('closes with Escape and with the skip button', async () => {
    const { onClose, user } = setup({ skipLabel: 'Skip for now' })
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Skip for now' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
