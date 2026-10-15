import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Tooltips from './Tooltips'

const hover = (el) => fireEvent.mouseOver(el)

describe('Tooltips', () => {
  it('shows one for an icon-only delete button', () => {
    render(<><Tooltips /><button type="button" aria-label="Delete work log"><svg /></button></>)
    hover(screen.getByRole('button', { name: 'Delete work log' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Delete work log')
  })

  it('stays quiet for other icon-only buttons (sidebar toggle, bell, close)', () => {
    render(<><Tooltips /><button type="button" aria-label="Expand sidebar"><svg /></button><button type="button" aria-label="Notifications"><svg /></button><button type="button" aria-label="Close"><svg /></button></>)
    for (const n of ['Expand sidebar', 'Notifications', 'Close']) {
      hover(screen.getByRole('button', { name: n }))
      expect(screen.queryByRole('tooltip')).toBeNull()
    }
  })

  it('stays quiet for labelled buttons, chart bars and sidebar items', () => {
    render(<>
      <Tooltips />
      <button type="button" title="Save">Save</button>
      <div data-testid="bar" title="Committed 22" />
      <div className="dash collapsed"><aside className="sidebar"><button type="button" title="Board"><svg /><span>Board</span></button></aside></div>
    </>)
    hover(screen.getByRole('button', { name: 'Save' }))
    expect(screen.queryByRole('tooltip')).toBeNull()
    hover(screen.getByTestId('bar'))
    expect(screen.queryByRole('tooltip')).toBeNull()
    hover(screen.getByRole('button', { name: 'Board' }))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('drops native title tooltips everywhere', () => {
    render(<><Tooltips /><div data-testid="bar" title="Committed 22" /><button type="button" title="Close"><svg /></button></>)
    hover(screen.getByTestId('bar'))
    expect(screen.getByTestId('bar')).not.toHaveAttribute('title')
    hover(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('button', { name: 'Close' })).not.toHaveAttribute('title')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('hides on mouse out', () => {
    render(<><Tooltips /><button type="button" aria-label="Delete"><svg /></button></>)
    const b = screen.getByRole('button', { name: 'Delete' })
    hover(b)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.mouseOut(b, { relatedTarget: document.body })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
