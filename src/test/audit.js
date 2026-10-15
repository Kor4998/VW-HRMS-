// DOM audit used by the page tests. It returns a list of human readable problems for the markup currently on screen.
const visible = (el) => !el.closest('[hidden], [aria-hidden="true"]') && getComputedStyle(el).display !== 'none'

const accName = (el, root) => {
  const label = el.getAttribute('aria-label')
  if (label && label.trim()) return label.trim()
  const by = el.getAttribute('aria-labelledby')
  if (by) {
    const t = by.split(/\s+/).map((id) => root.getElementById?.(id)?.textContent || '').join(' ').trim()
    if (t) return t
  }
  const title = el.getAttribute('title')
  if (title && title.trim()) return title.trim()
  const text = (el.textContent || '').trim()
  if (text) return text
  const img = el.querySelector('img[alt]:not([alt=""])')
  if (img) return img.getAttribute('alt')
  return ''
}

const fieldName = (el, doc) => {
  const direct = accName(el, doc)
  if (direct && el.tagName !== 'SELECT') return direct
  if (el.id && doc.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return 'label[for]'
  const wrap = el.closest('label')
  if (wrap && (wrap.textContent || '').trim()) return 'wrapping label'
  if (el.getAttribute('placeholder')) return '' // a placeholder is not a label
  return direct
}

const where = (el) => {
  const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''
  const txt = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)
  return `<${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${txt ? ` "${txt}"` : ''}>`
}

export function audit(root = document.body) {
  const doc = root.ownerDocument || document
  const out = []

  for (const el of root.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="switch"], [role="checkbox"]')) {
    if (!visible(el)) continue
    const name = el.tagName === 'INPUT' ? fieldName(el, doc) : accName(el, doc)
    if (!name) out.push(`no accessible name: ${where(el)}`)
  }

  for (const el of root.querySelectorAll('input, select, textarea')) {
    const type = (el.getAttribute('type') || '').toLowerCase()
    if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type) || !visible(el)) continue
    if (!fieldName(el, doc)) out.push(`form field without a label: ${where(el)}`)
  }

  for (const el of root.querySelectorAll('img')) {
    if (!el.hasAttribute('alt')) out.push(`image without alt: ${el.getAttribute('src')?.slice(-30)}`)
  }

  const ids = new Map()
  for (const el of root.querySelectorAll('[id]')) ids.set(el.id, (ids.get(el.id) || 0) + 1)
  for (const [id, n] of ids) if (n > 1) out.push(`duplicate id "${id}" x${n}`)

  for (const el of root.querySelectorAll('[tabindex]')) {
    if (Number(el.getAttribute('tabindex')) > 0) out.push(`positive tabindex: ${where(el)}`)
  }

  for (const el of root.querySelectorAll('h1, h2, h3, h4')) {
    if (visible(el) && !(el.textContent || '').trim() && !el.querySelector('img[alt]')) out.push(`empty heading: ${where(el)}`)
  }

  for (const el of root.querySelectorAll('[role="tab"]')) {
    if (!el.hasAttribute('aria-selected')) out.push(`tab without aria-selected: ${where(el)}`)
  }

  for (const el of root.querySelectorAll('button:not([type])')) {
    if (el.closest('form')) out.push(`button without type inside a form: ${where(el)}`)
  }

  for (const el of root.querySelectorAll('[aria-controls]')) {
    const id = el.getAttribute('aria-controls')
    if (id && !doc.getElementById(id)) out.push(`aria-controls points nowhere ("${id}"): ${where(el)}`)
  }

  return [...new Set(out)]
}

// collects console.error / console.warn (React key warnings, unknown props, act() warnings...) while a test runs
export function captureConsole(vi) {
  const seen = []
  const err = vi.spyOn(console, 'error').mockImplementation((...a) => { seen.push(['error', String(a[0]).slice(0, 160)]) })
  const warn = vi.spyOn(console, 'warn').mockImplementation((...a) => { seen.push(['warn', String(a[0]).slice(0, 160)]) })
  return { seen, restore: () => { err.mockRestore(); warn.mockRestore() } }
}
