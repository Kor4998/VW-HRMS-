import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateIssue from './CreateIssue'

const project = { key: 'HRM', name: 'HRMS', lead: 'Venkatesh Korlapati', tone: 'blue', icon: 'logo' }
const setup = () => {
  const onCreate = vi.fn(() => ({ id: 'HRM-113' }))
  const onClose = vi.fn()
  render(<CreateIssue open onClose={onClose} project={project} people={['Anita Rao']} epics={[]} sprints={['Sprint 1', '']} onCreate={onCreate} />)
  return { onCreate, onClose, user: userEvent.setup() }
}

describe('CreateIssue', () => {
  it('has an estimate field but no time spent field (Jira logs time after creation)', () => {
    setup()
    expect(screen.getByPlaceholderText(/Estimate/)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/Time spent/i)).toBeNull()
  })

  it('requires a summary', async () => {
    const { onCreate, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/summary is required/i)
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('rejects an estimate it cannot read', async () => {
    const { onCreate, user } = setup()
    await user.type(screen.getByLabelText('Summary'), 'Payroll export bug')
    await user.type(screen.getByPlaceholderText(/Estimate/), 'soon')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/estimate looks like/i)
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('creates with the estimate in minutes and closes', async () => {
    const { onCreate, onClose, user } = setup()
    await user.type(screen.getByLabelText('Summary'), 'Payroll export bug')
    await user.type(screen.getByPlaceholderText(/Estimate/), '1d')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Payroll export bug', est: 480, who: 'Venkatesh Korlapati' }))
    expect(onClose).toHaveBeenCalled()
  })
})
