import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { audit } from '@/test/audit'
import AuthPanel, { DEMO_CODE, maskEmail, maskPhone, validEmail, validPhone } from './AuthPanel'
import Login from './Login'

const clean = () => expect(audit(document.body)).toEqual([])
const setup = (props = {}) => {
  const onLogin = vi.fn()
  render(<AuthPanel logo="/x.png" onLogin={onLogin} speed={0} {...props} />)
  return { onLogin, user: userEvent.setup() }
}
const typeCode = async (user, code) => { for (const [i, d] of [...code].entries()) await user.type(screen.getByLabelText(`Digit ${i + 1} of 6`), d) }

describe('helpers', () => {
  it('masks where the code went and validates input', () => {
    expect(maskEmail('anita.rao@voltuswave.com')).toMatch(/^a\*+@voltuswave\.com$/)
    expect(maskPhone('9876543210')).toBe('+91 ***** 43210')
    expect(validEmail('a@b.co')).toBe(true); expect(validEmail('a@b')).toBe(false)
    expect(validPhone('9876543210')).toBe(true); expect(validPhone('1234567890')).toBe(false); expect(validPhone('98765')).toBe(false)
  })
})

describe('sign in', () => {
  it('is clean: no heading text on screen, no exclamation marks or filler, and a sign-in options button', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Sign in' })).toHaveClass('sr-only') // kept for screen readers only
    expect(document.body.textContent).not.toMatch(/Welcome back|Falcon HR!|Please/)
    expect(screen.getByText(/By clicking continue, you agree to our/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign-in options' })).toBeInTheDocument()
    clean()
  })
  it('explains what is wrong, only after the field is left, and does not sign in', async () => {
    const { onLogin, user } = setup()
    expect(screen.queryByRole('alert')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getAllByRole('alert').map((a) => a.textContent)).toEqual(['Enter your work email.', 'Enter your password.'])
    expect(onLogin).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })
  it('signs in with a valid email and an 8+ character password; the password can be shown', async () => {
    const { onLogin, user } = setup()
    await user.type(screen.getByLabelText('Email'), 'anita@voltuswave.com')
    const pw = screen.getByLabelText('Password')
    await user.type(pw, 'short'); await user.tab()
    expect(screen.getByRole('alert')).toHaveTextContent('at least 8 characters')
    await user.type(pw, 'er-than-eight')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(pw).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1))
  })
  it('shows a loading state while signing in', async () => {
    const { user } = setup({ speed: 1 })
    await user.type(screen.getByLabelText('Email'), 'anita@voltuswave.com')
    await user.type(screen.getByLabelText('Password'), 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    const btn = screen.getByRole('button', { name: /Signing in/ })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })
})

describe('sign-in options', () => {
  it('lists organisation email, email OTP and mobile OTP, and Back returns to sign in', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Sign-in options' }))
    expect(screen.getAllByRole('button').map((b) => b.querySelector('.opt-t b')?.textContent).filter(Boolean)).toEqual(['Continue using your organisation email', 'Continue with email OTP', 'Continue with mobile OTP', 'Continue with authenticator app'])
    clean()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })
  it('organisation email asks for the email and continues', async () => {
    const { onLogin, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Sign-in options' }))
    await user.click(screen.getByRole('button', { name: /organisation email/ }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your work email.')
    await user.type(screen.getByLabelText('Email'), 'anita@voltuswave.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1))
  })
})

describe('one-time code', () => {
  it('email OTP: Get OTP, a left-aligned message with the masked address, 6 boxes, the demo code signs in', async () => {
    const { onLogin, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Sign-in options' }))
    await user.click(screen.getByRole('button', { name: /email OTP/ }))
    await user.click(screen.getByRole('button', { name: 'Get OTP' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your work email.')
    await user.type(screen.getByLabelText('Email'), 'korlapati.venkatesh@voltuswave.com')
    await user.click(screen.getByRole('button', { name: 'Get OTP' }))
    expect(await screen.findByText(/We sent a 6-digit code to/)).toBeInTheDocument()
    expect(screen.getByText(/^k\*+@voltuswave\.com$/)).toBeInTheDocument()
    expect(screen.getByText(/Resend code in 0:57/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change email' })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/Digit \d of 6/)).toHaveLength(6)
    await typeCode(user, DEMO_CODE) // the sixth digit verifies on its own
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1))
  })
  it('mobile OTP validates a 10-digit Indian number, masks it, and Change number goes back', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Sign-in options' }))
    await user.click(screen.getByRole('button', { name: /mobile OTP/ }))
    await user.type(screen.getByLabelText(/Mobile number, after/), '12345')
    await user.click(screen.getByRole('button', { name: 'Get OTP' }))
    expect(screen.getByRole('alert')).toHaveTextContent('10-digit Indian mobile number')
    await user.clear(screen.getByLabelText(/Mobile number, after/))
    await user.type(screen.getByLabelText(/Mobile number, after/), '9876543210')
    await user.click(screen.getByRole('button', { name: 'Get OTP' }))
    expect(await screen.findByText('+91 ***** 43210')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Change number' }))
    expect(screen.getByLabelText(/Mobile number, after/)).toBeInTheDocument()
  })
  it('a wrong code says so and clears the boxes; an incomplete code asks for all digits', async () => {
    const { onLogin, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Sign-in options' }))
    await user.click(screen.getByRole('button', { name: /email OTP/ }))
    await user.type(screen.getByLabelText('Email'), 'anita@voltuswave.com')
    await user.click(screen.getByRole('button', { name: 'Get OTP' }))
    await user.click(await screen.findByRole('button', { name: 'Verify and sign in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter all 6 digits')
    await typeCode(user, '111111')
    expect(await screen.findByText(/That code isn.t right/)).toBeInTheDocument()
    expect(screen.getByLabelText('Digit 1 of 6')).toHaveValue('')
    expect(onLogin).not.toHaveBeenCalled()
  })
  it('a pasted code fills every box and verifies', async () => {
    const { onLogin, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Sign-in options' }))
    await user.click(screen.getByRole('button', { name: /email OTP/ }))
    await user.type(screen.getByLabelText('Email'), 'anita@voltuswave.com')
    await user.click(screen.getByRole('button', { name: 'Get OTP' }))
    const first = await screen.findByLabelText('Digit 1 of 6')
    expect(screen.getByText(/Resend code in 0:/)).toBeInTheDocument()
    fireEvent.paste(first, { clipboardData: { getData: () => '1 2 3 4 5 6' } })
    expect([...Array(6)].map((_, i) => screen.getByLabelText(`Digit ${i + 1} of 6`).value).join('')).toBe('123456')
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1))
  })
  it('the resend countdown ends with a Resend code button', () => {
    vi.useFakeTimers()
    setup({ speed: 0 })
    fireEvent.click(screen.getByRole('button', { name: 'Sign-in options' }))
    fireEvent.click(screen.getByRole('button', { name: /email OTP/ }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'anita@voltuswave.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Get OTP' }))
    act(() => { vi.advanceTimersByTime(10) })
    for (let i = 0; i < 58; i++) act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('button', { name: 'Resend code' })).toBeInTheDocument()
    vi.useRealTimers()
  })
})

describe('forgot password', () => {
  it('goes email → code → new password → confirmation → sign in, with matching passwords enforced', async () => {
    const { onLogin, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email'), 'anita@voltuswave.com')
    await user.click(screen.getByRole('button', { name: 'Get OTP' }))
    await screen.findByLabelText('Digit 1 of 6')
    await typeCode(user, DEMO_CODE)
    expect(await screen.findByRole('heading', { name: 'Set a new password' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('New password'), 'longenough1')
    expect(screen.getByText(/Password strength/)).toHaveTextContent(/Weak|Fair|Good|Strong/)
    await user.type(screen.getByLabelText('Confirm new password'), 'different1')
    await user.click(screen.getByRole('button', { name: 'Update password' }))
    expect(screen.getByRole('alert')).toHaveTextContent('don’t match')
    await user.clear(screen.getByLabelText('Confirm new password'))
    await user.type(screen.getByLabelText('Confirm new password'), 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Update password' }))
    expect(screen.getByRole('heading', { name: 'Password updated' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(onLogin).not.toHaveBeenCalled()
  })
})

describe('signed out page', () => {
  it('tells you the session ended and offers to sign in again', async () => {
    const user = userEvent.setup()
    render(<Login startView="signedout" onLogin={() => {}} />)
    expect(screen.getByRole('heading', { name: 'You’re signed out' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    clean()
  })
})

describe('password strength', () => {
  it('grades passwords from weak to strong', async () => {
    const { strength } = await import('./AuthPanel')
    expect(strength('')).toBe(0)
    expect(strength('abcdefgh')).toBe(1)
    expect(strength('abcdefghijkl')).toBeGreaterThanOrEqual(2)
    expect(strength('Abcdefghijk1!')).toBe(4)
  })
})

describe('authenticator app (Google Authenticator style)', async () => {
  const { DEMO_SECRET, totp } = await import('@/lib/totp')
  const reach = async (user) => {
    await user.click(screen.getByRole('button', { name: 'Sign-in options' }))
    await user.click(screen.getByRole('button', { name: /authenticator app/ }))
    await user.type(screen.getByLabelText('Email'), 'anita@voltuswave.com')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByLabelText('Digit 1 of 6')
  }
  it('is the fourth sign-in option', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Sign-in options' }))
    expect(screen.getAllByRole('button').map((b) => b.querySelector('.opt-t b')?.textContent).filter(Boolean)).toEqual(['Continue using your organisation email', 'Continue with email OTP', 'Continue with mobile OTP', 'Continue with authenticator app'])
  })
  it('asks for the email, then the live 6-digit code, and the current code signs in', async () => {
    const { onLogin, user } = setup()
    await reach(user)
    expect(screen.getByText('Enter the 6-digit code from your authenticator app')).toBeInTheDocument()
    expect(screen.getByText(/refreshes in 0:\d\d/)).toBeInTheDocument()
    await typeCode(user, totp(DEMO_SECRET)) // the code changes every 30 seconds; this is the one right now
    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1))
  })
  it('a wrong code is refused', async () => {
    const { onLogin, user } = setup()
    await reach(user)
    const real = totp(DEMO_SECRET)
    const wrong = real === '000000' ? '111111' : '000000'
    await typeCode(user, wrong)
    expect(await screen.findByText(/That code isn.t right/)).toBeInTheDocument()
    expect(onLogin).not.toHaveBeenCalled()
  })
  it('the setup help shows the key and a demo of the code the app would show', async () => {
    const { user } = setup()
    await reach(user)
    await user.click(screen.getByText('Set up or preview the authenticator'))
    expect(screen.getByText('JBSW Y3DP EHPK 3PXP')).toBeInTheDocument()
    expect(screen.getByLabelText('Demo authenticator')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy setup key' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Current code \d{6}/)).toBeInTheDocument()
  })
})

describe('field errors', () => {
  it('stay quiet when someone clicks past an empty field, and appear on submit', async () => {
    const { user } = setup()
    await user.click(screen.getByLabelText('Email'))
    await user.click(screen.getByLabelText('Password'))
    await user.click(document.body)
    expect(screen.queryByText('Enter your work email.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Enter your work email.')).toBeInTheDocument()
  })
  it('still flag a half-typed email once the field is left', async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText('Email'), 'anita@')
    await user.click(screen.getByLabelText('Password'))
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })
})
