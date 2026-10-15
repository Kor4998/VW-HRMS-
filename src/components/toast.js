// Tiny event bus so any page can raise a toast: toast({ title, text, tone, action })
// tone: 'success' | 'info' | 'warn' | 'error' | 'brand'
export function toast(detail) {
  window.dispatchEvent(new CustomEvent('hrms-toast', { detail }))
}
