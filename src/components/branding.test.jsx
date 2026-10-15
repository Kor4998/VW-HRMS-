import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { audit } from '@/test/audit'
import Login from '@/pages/Login'
import BrandingSection from './BrandingSection'
import ToastHost from './ToastHost'
import {
  DEFAULT_SLIDES, MAX_SLIDES, addSlide, applyFavicon, getBranding, moveSlide, readImage, removeSlide, replaceSlide, resetBranding, setBranding,
} from './branding'

const clean = () => expect(audit(document.body)).toEqual([])
const png = (name = 'banner.png', size = 1000, type = 'image/png') => new File([new Uint8Array(size)], name, { type })

beforeEach(() => { localStorage.clear(); act(() => { resetBranding() }) })

describe('branding store', () => {
  it('starts with the default five slides and the default logos', () => {
    const b = getBranding()
    expect(b.slides).toEqual(DEFAULT_SLIDES)
    expect(DEFAULT_SLIDES).toHaveLength(5)
    expect(b.custom).toEqual({ logoLight: false, logoDark: false, favicon: false, slides: false, layout: false })
    expect(b.autoplay).toBe(true)
  })
  it('saves what is uploaded and resets one part at a time', () => {
    expect(setBranding({ logoLight: 'data:image/png;base64,AAA', slides: ['data:a', 'data:b'] })).toBe(true)
    let b = getBranding()
    expect(b.logoLight).toBe('data:image/png;base64,AAA')
    expect(b.slides).toEqual(['data:a', 'data:b'])
    resetBranding(['slides'])
    b = getBranding()
    expect(b.slides).toEqual(DEFAULT_SLIDES)
    expect(b.logoLight).toBe('data:image/png;base64,AAA')
  })
  it('survives a corrupt stored value', () => {
    localStorage.setItem('hrms-branding', '{not json')
    expect(getBranding().slides).toEqual(DEFAULT_SLIDES)
  })
  it('never keeps more than five slides', () => {
    setBranding({ slides: ['1', '2', '3', '4', '5', '6', '7'] })
    expect(getBranding().slides).toHaveLength(MAX_SLIDES)
  })
  it('reports a full browser store instead of throwing', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(setBranding({ slides: ['x'] })).toBe(false)
    spy.mockRestore()
  })
})

describe('slide list operations', () => {
  it('add stops at five, replace and remove keep the rest, remove never empties the list', () => {
    expect(addSlide(['a', 'b', 'c', 'd', 'e'], 'f')).toHaveLength(5)
    expect(addSlide(['a'], 'b')).toEqual(['a', 'b'])
    expect(replaceSlide(['a', 'b', 'c'], 1, 'X')).toEqual(['a', 'X', 'c'])
    expect(removeSlide(['a', 'b', 'c'], 0)).toEqual(['b', 'c'])
    expect(removeSlide(['only'], 0)).toEqual(['only'])
  })
  it('move swaps neighbours and ignores the ends', () => {
    expect(moveSlide(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveSlide(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
    expect(moveSlide(['a', 'b'], 0, -1)).toEqual(['a', 'b'])
    expect(moveSlide(['a', 'b'], 1, 1)).toEqual(['a', 'b'])
  })
})

describe('readImage validation', () => {
  it('rejects the wrong file type with a message that says what to use', async () => {
    await expect(readImage(png('x.gif', 100, 'image/gif'), 'banner')).rejects.toThrow(/PNG, JPEG, WEBP/)
    await expect(readImage(png('x.pdf', 100, 'application/pdf'), 'logo')).rejects.toThrow(/file/)
  })
  it('rejects files over 5 MB', async () => {
    await expect(readImage(png('big.png', 5 * 1024 * 1024 + 1), 'banner')).rejects.toThrow(/5 MB/)
  })
  it('keeps a small SVG logo exactly as it is', async () => {
    const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'l.svg', { type: 'image/svg+xml' })
    expect(await readImage(svg, 'logo')).toMatch(/^data:image\/svg\+xml/)
  })
})

describe('favicon', () => {
  it('swaps the tab icon for the uploaded one and restores the original afterwards', () => {
    document.head.innerHTML = '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">'
    applyFavicon({ favicon: 'data:image/png;base64,ZZZ' })
    const link = document.querySelector('link[rel~="icon"]')
    expect(link.getAttribute('href')).toBe('data:image/png;base64,ZZZ')
    applyFavicon({ favicon: '' })
    expect(link.getAttribute('href')).toBe('/favicon-32.png')
    expect(link.getAttribute('sizes')).toBe('32x32')
  })
})

describe('Login page uses the branding', () => {
  it('shows the banners as plain images, with no testimonial text, and the dots and arrows on the image', () => {
    render(<Login onLogin={() => {}} />)
    const stage = document.querySelector('.stage')
    expect(stage.querySelectorAll('img')).toHaveLength(5)
    expect(document.body.textContent).not.toMatch(/Priya Raman|HR Director at Stripe|game-changer|Head of People/)
    const dots = document.querySelector('.dots')
    expect(dots).toBeTruthy()
    expect(stage.contains(dots)).toBe(true) // inside the picture, along its bottom edge
    expect(stage.contains(screen.getByRole('button', { name: 'Next banner' }))).toBe(true)
    expect(within(dots).getAllByRole('tab')).toHaveLength(5)
    clean()
  })
  it('the dots and arrows change the slide', async () => {
    const user = userEvent.setup()
    render(<Login onLogin={() => {}} />)
    const active = () => [...document.querySelectorAll('.hero-img')].findIndex((i) => i.classList.contains('active'))
    expect(active()).toBe(0)
    await user.click(screen.getByRole('tab', { name: 'Banner 3' }))
    expect(active()).toBe(2)
    await user.click(screen.getByRole('button', { name: 'Next banner' }))
    expect(active()).toBe(3)
    await user.click(screen.getByRole('button', { name: 'Previous banner' }))
    await user.click(screen.getByRole('button', { name: 'Previous banner' }))
    await user.click(screen.getByRole('button', { name: 'Previous banner' }))
    expect(active()).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Previous banner' }))
    expect(active()).toBe(4)
  })
  it('shows uploaded slides and logo, and hides the dots when there is only one', () => {
    setBranding({ slides: ['data:image/png;base64,ONE'], logoLight: 'data:image/png;base64,LOGO' })
    render(<Login onLogin={() => {}} />)
    expect(document.querySelectorAll('.stage .hero-img')).toHaveLength(1)
    expect(document.querySelector('.dots')).toBeNull()
    expect(document.querySelector('.stage .hero-img').getAttribute('src')).toBe('data:image/png;base64,ONE')
    const light = document.querySelector('.login-page').dataset.theme === 'light'
    if (light) expect(document.querySelector('img.logo').getAttribute('src')).toBe('data:image/png;base64,LOGO')
  })
})

describe('login layout', () => {
  it('defaults to the standard layout and ignores an unknown stored value', () => {
    expect(getBranding().layout).toBe('right')
    setBranding({ layout: 'diagonal' })
    expect(getBranding().layout).toBe('right')
  })
  it('the login page follows the chosen layout', () => {
    for (const layout of ['left', 'center', 'right']) {
      setBranding({ layout })
      const { unmount } = render(<Login onLogin={() => {}} />)
      expect(document.querySelector('.login-shell').dataset.layout).toBe(layout)
      unmount()
    }
  })
})

describe('Settings → Branding', () => {
  it('lists the five slides with controls and no add tile when full', () => {
    render(<BrandingSection />)
    const list = screen.getByRole('list', { name: 'Banner slides' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(screen.queryByRole('button', { name: 'Add banner' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Move banner 1 earlier' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move banner 5 later' })).toBeDisabled()
    clean()
  })
  it('removing, reordering and resetting banners updates what the login page will use', async () => {
    const user = userEvent.setup()
    render(<><ToastHost /><BrandingSection /></>)
    await user.click(screen.getByRole('button', { name: 'Remove banner 5' }))
    await user.click(screen.getByRole('button', { name: 'Remove banner 4' }))
    expect(getBranding().slides).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Add banner' })).toBeInTheDocument()
    const before = getBranding().slides
    await user.click(screen.getByRole('button', { name: 'Move banner 1 later' }))
    expect(getBranding().slides).toEqual([before[1], before[0], before[2]])
    await user.click(screen.getByRole('button', { name: 'Reset to default' }))
    expect(getBranding().slides).toEqual(DEFAULT_SLIDES)
  })
  it('the last remaining banner cannot be removed', async () => {
    const user = userEvent.setup()
    setBranding({ slides: ['data:one'] })
    render(<BrandingSection />)
    expect(screen.getByRole('button', { name: 'Remove banner 1' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Remove banner 1' }))
    expect(getBranding().slides).toEqual(['data:one'])
  })
  it('uploading a file that is not an image shows why it was refused and changes nothing', async () => {
    render(<><ToastHost /><BrandingSection /></>)
    const input = document.querySelector('input[type="file"]')
    fireEvent.change(input, { target: { files: [png('notes.txt', 50, 'text/plain')] } })
    expect(await screen.findByText('That image was not used')).toBeInTheDocument()
    expect(getBranding().custom.slides).toBe(false)
  })
  it('picks the login layout with three radios and saves the choice', async () => {
    const user = userEvent.setup()
    render(<><ToastHost /><BrandingSection /></>)
    const group = screen.getByRole('radiogroup', { name: 'Login page layout' })
    const radios = within(group).getAllByRole('radio')
    expect(radios.map((r) => r.value)).toEqual(['left', 'center', 'right'])
    expect(screen.getByRole('radio', { name: /Right aligned/ })).toBeChecked() // the default
    await user.click(screen.getByRole('radio', { name: /Center aligned/ }))
    expect(getBranding().layout).toBe('center')
    expect(screen.getByRole('radio', { name: /Center aligned/ })).toBeChecked()
    expect(screen.getByText(/form in a card over the banner/)).toBeInTheDocument()
    expect(await screen.findByText('Center aligned layout saved')).toBeInTheDocument()
    clean()
  })
  it('has upload buttons for the company logo, the dark logo and the favicon, with a remove only once custom', () => {
    setBranding({ logoDark: 'data:image/png;base64,D' })
    render(<BrandingSection />)
    for (const n of ['Upload logo', 'Upload dark logo', 'Upload favicon']) expect(screen.getByRole('button', { name: n })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove dark logo' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove logo' })).toBeNull()
  })
})

describe('automatic sliding', () => {
  const shown = () => document.querySelector('.hero-img.active').getAttribute('alt')
  it('moves to the next banner every 10 seconds, and stops when switched off', () => {
    vi.useFakeTimers()
    const { unmount } = render(<Login onLogin={() => {}} />)
    expect(shown()).toMatch(/Banner 1 of 5/)
    act(() => { vi.advanceTimersByTime(9999) }); expect(shown()).toMatch(/Banner 1 of 5/)
    act(() => { vi.advanceTimersByTime(1) }); expect(shown()).toMatch(/Banner 2 of 5/)
    act(() => { setBranding({ autoplay: false }) })
    act(() => { vi.advanceTimersByTime(30000) }); expect(shown()).toMatch(/Banner 2 of 5/)
    unmount(); vi.useRealTimers()
  })
  it('pauses while the pointer is over the banner', () => {
    vi.useFakeTimers()
    render(<Login onLogin={() => {}} />)
    fireEvent.mouseEnter(screen.getByRole('region', { name: 'Login banner' }))
    act(() => { vi.advanceTimersByTime(25000) }); expect(shown()).toMatch(/Banner 1 of 5/)
    vi.useRealTimers()
  })
  it('the setting is a switch, on by default, that saves', async () => {
    render(<><BrandingSection /><ToastHost /></>)
    const sw = screen.getByRole('switch', { name: 'Slide automatically' })
    expect(sw).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'false')
    expect(getBranding().autoplay).toBe(false)
    clean()
  })
})

describe('slideshow settings table', () => {
  const shown = () => document.querySelector('.hero-img.active').getAttribute('alt')
  it('has timing and animation dropdowns that save and apply to the login page', async () => {
    render(<><BrandingSection /><ToastHost /></>)
    expect(screen.getByRole('table', { name: 'Banner slideshow settings' })).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Time between banners'), '20')
    await userEvent.selectOptions(screen.getByLabelText('Animation'), 'zoom')
    const b = getBranding()
    expect([b.interval, b.transition]).toEqual([20, 'zoom'])
    clean()
  })
  it('timing and pause options are disabled while automatic sliding is off', async () => {
    render(<BrandingSection />)
    await userEvent.click(screen.getByRole('switch', { name: 'Slide automatically' }))
    expect(screen.getByLabelText('Time between banners')).toBeDisabled()
    expect(screen.getByRole('switch', { name: 'Pause on hover' })).toBeDisabled()
  })
  it('the login page follows the chosen time, animation and hover setting', () => {
    vi.useFakeTimers()
    act(() => { setBranding({ interval: 5, transition: 'slide', pauseOnHover: false }) })
    render(<Login onLogin={() => {}} />)
    expect(screen.getByRole('region', { name: 'Login banner' })).toHaveAttribute('data-transition', 'slide')
    fireEvent.mouseEnter(screen.getByRole('region', { name: 'Login banner' }))
    act(() => { vi.advanceTimersByTime(5000) }); expect(shown()).toMatch(/Banner 2 of 5/)
    vi.useRealTimers()
  })
})
