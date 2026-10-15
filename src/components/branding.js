import { useSyncExternalStore } from 'react'
import defaultLogoLight from '../assets/logo-light.png'
import defaultLogoDark from '../assets/logo-dark.png'

// Account branding set in Settings → Branding and read by the login page, the portal header and the browser tab icon.
// Everything is stored in this browser (mock app): nothing here is hardcoded into the screens any more.
const KEY = 'hrms-branding'
const EVENT = 'hrms-branding'
export const MAX_SLIDES = 5
export const SLIDE_SECONDS = 10
export const INTERVALS = [5, 10, 15, 20, 30, 60]
export const TRANSITIONS = [['fade', 'Fade'], ['slide', 'Slide'], ['zoom', 'Zoom']]
export const MAX_FILE_BYTES = 5 * 1024 * 1024
// where the sign-in form sits: beside the banner on the right (default), on the left, or in a card over the banner
export const LAYOUTS = ['left', 'center', 'right']

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`
// shown until an admin uploads banners (each slide is a plain image: any text must be part of the image itself)
export const DEFAULT_SLIDES = ['1506905925346-21bda4d32df4', '1469474968028-56623f02e42e', '1470071459604-3b5ec3a7fe05', '1501785888041-af3ef285b470', '1464822759023-fed622ff2c3b'].map(unsplash)
export const DEFAULT_LOGOS = { light: defaultLogoLight, dark: defaultLogoDark }

let cache = { raw: undefined, value: null }

function resolve(stored) {
  const slides = Array.isArray(stored.slides) ? stored.slides.filter(Boolean).slice(0, MAX_SLIDES) : []
  return {
    logoLight: stored.logoLight || DEFAULT_LOGOS.light,
    logoDark: stored.logoDark || DEFAULT_LOGOS.dark,
    favicon: stored.favicon || '',
    layout: LAYOUTS.includes(stored.layout) ? stored.layout : 'right',
    interval: INTERVALS.includes(stored.interval) ? stored.interval : SLIDE_SECONDS,
    transition: TRANSITIONS.some(([k]) => k === stored.transition) ? stored.transition : 'fade',
    pauseOnHover: stored.pauseOnHover !== false,
    autoplay: stored.autoplay !== false, // slides advance by themselves unless an admin turns it off
    slides: slides.length ? slides : DEFAULT_SLIDES,
    custom: { logoLight: !!stored.logoLight, logoDark: !!stored.logoDark, favicon: !!stored.favicon, slides: slides.length > 0, layout: LAYOUTS.includes(stored.layout) },
  }
}

function readStored() {
  let raw = null
  try { raw = localStorage.getItem(KEY) } catch { /* storage unavailable */ }
  return raw
}

export function getBranding() {
  const raw = readStored()
  if (cache.value && cache.raw === raw) return cache.value
  let stored = {}
  try { stored = JSON.parse(raw) || {} } catch { /* corrupt value: start again from the defaults */ }
  cache = { raw, value: resolve(stored) }
  return cache.value
}

// returns false when the browser refuses to store it (quota)
export function setBranding(patch) {
  let stored = {}
  try { stored = JSON.parse(readStored()) || {} } catch { /* ignore */ }
  const next = { ...stored, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { return false }
  window.dispatchEvent(new Event(EVENT))
  return true
}

export function resetBranding(keys) {
  let stored = {}
  try { stored = JSON.parse(readStored()) || {} } catch { /* ignore */ }
  const next = keys ? Object.fromEntries(Object.entries(stored).filter(([k]) => !keys.includes(k))) : {}
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { return false }
  window.dispatchEvent(new Event(EVENT))
  return true
}

const subscribe = (cb) => {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', cb) }
}
export const useBranding = () => useSyncExternalStore(subscribe, getBranding, getBranding)

// ---- slide list operations (pure, so they are easy to test)
export const addSlide = (list, src) => (list.length >= MAX_SLIDES ? list : [...list, src])
export const replaceSlide = (list, i, src) => list.map((s, k) => (k === i ? src : s))
export const removeSlide = (list, i) => (list.length <= 1 ? list : list.filter((_, k) => k !== i))
export const moveSlide = (list, i, d) => {
  const j = i + d
  if (j < 0 || j >= list.length) return list
  const out = [...list]
  ;[out[i], out[j]] = [out[j], out[i]]
  return out
}

// ---- reading an uploaded image
const KINDS = {
  banner: { types: ['image/png', 'image/jpeg', 'image/webp'], max: 1600, out: 'image/jpeg', q: 0.82 },
  logo: { types: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'], max: 640, out: 'image/png' },
  favicon: { types: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'], max: 128, out: 'image/png' },
}

const asDataUrl = (file) => new Promise((resolveP, reject) => {
  const r = new FileReader()
  r.onload = () => resolveP(String(r.result))
  r.onerror = () => reject(new Error('Could not read that file.'))
  r.readAsDataURL(file)
})
const loadImage = (src) => new Promise((resolveP, reject) => {
  const img = new Image()
  img.onload = () => resolveP(img)
  img.onerror = () => reject(new Error('That file is not a readable image.'))
  img.src = src
})

// validates the file and returns a data URL that is small enough to keep: banners and logos are scaled down, SVG and icons are kept as they are
export async function readImage(file, kind = 'banner') {
  const spec = KINDS[kind]
  if (!file) throw new Error('No file chosen.')
  if (!spec.types.includes(file.type)) throw new Error(`Use a ${spec.types.map((t) => t.split('/')[1].replace('svg+xml', 'SVG').replace('x-icon', 'ICO').replace('vnd.microsoft.icon', 'ICO').toUpperCase()).filter((v, i, a) => a.indexOf(v) === i).join(', ')} file.`)
  if (file.size > MAX_FILE_BYTES) throw new Error('That image is larger than 5 MB.')
  const url = await asDataUrl(file)
  if (file.type === 'image/svg+xml' || file.type.includes('icon')) {
    if (url.length > 400 * 1024) throw new Error('That file is too large to store. Use one under 300 KB.')
    return url
  }
  const img = await loadImage(url)
  const scale = Math.min(1, spec.max / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL(spec.out, spec.q)
}

// the browser tab icon follows the uploaded favicon; with none, the original icon is put back
let originalIcons = null
export function applyFavicon(b = getBranding()) {
  const links = [...document.querySelectorAll('link[rel~="icon"]')]
  if (!originalIcons) originalIcons = links.map((l) => [l, l.getAttribute('href'), l.getAttribute('sizes')])
  for (const [l, href, sizes] of originalIcons) {
    l.setAttribute('href', b.favicon || href)
    if (b.favicon) l.removeAttribute('sizes')
    else if (sizes) l.setAttribute('sizes', sizes)
  }
}
