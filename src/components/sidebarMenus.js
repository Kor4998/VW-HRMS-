// The portal's own menu, exactly as the Default sidebar lists it (same items, same order, same icons, same pages).
// The only difference: the pages that used to keep their own tabs (My roster, Shift swap, ...) list those screens here.
export const SIDEBAR_TYPES = [
  ['default', 'Default Sidebar', 'Traditional sidebar with one entry per page. Each page keeps its own tabs.'],
  ['tree', 'Hierarchical Sidebar (3-Level)', 'The same menu as a tree: pages open to list their screens, and the page tabs are controlled from the sidebar.'],
  ['cascading', 'Cascading Sidebar (Hover Panels)', 'The same menu as a rail: click an item to open its panel with its screens. The page tabs are controlled from the sidebar.'],
]
export const SIDEBAR_KEY = 'hrms-sidebar-type'

// label / icon / page are copied from NAV in Dashboard.jsx; go = the page label that Dashboard's go() takes (null = Dashboard)
export const ITEMS = [
  { label: 'Dashboard', short: 'Dashboard', icon: 'grid', go: null },
  { label: 'My Profile', short: 'Profile', icon: 'circleuser', go: 'My Profile' },
  { label: 'Shift Management', short: 'Shifts', icon: 'clock', go: 'Shift Management', screens: [['roster', 'My roster'], ['swap', 'Shift swap'], ['approval', 'Shift approval'], ['claim', 'Shifts claim']] },
  { label: 'Attendance', short: 'Attendance', icon: 'finger', go: 'Attendance', screens: [['history', 'Attendance history'], ['insights', 'Insights'], ['reg', 'Regularization'], ['wfh', 'Work from home']] },
  { label: 'Asset', short: 'Asset', icon: 'boxes', go: 'Asset', screens: [['all', 'View all'], ['asset', 'My assets'], ['request', 'Requests'], ['transfer', 'Transfers'], ['ticket', 'Tickets']] },
  { label: 'Leave Management', short: 'Leave', icon: 'calx', go: 'Leave Management', screens: [['overview', 'Overview'], ['requests', 'Leave requests'], ['ledger', 'Leave ledger'], ['comp', 'Comp off']] },
  { label: 'My Team', short: 'Team', icon: 'users', go: 'My Team' },
  { label: 'Approvals', short: 'Approvals', icon: 'clipcheck', go: 'Approvals' },
  { label: 'Policies', short: 'Policies', icon: 'doc', go: 'Policies' },
]

// every place you can go, flat, for search: "Attendance › Insights"
export function allScreens() {
  const out = []
  for (const it of ITEMS) {
    out.push({ key: it.label, item: it, label: it.label, trail: 'Page', go: it.go, tab: null })
    for (const [tab, name] of it.screens || []) out.push({ key: `${it.label}/${tab}`, item: it, label: name, trail: it.label, go: it.go, tab })
  }
  return out
}

export function searchScreens(q) {
  const t = String(q || '').trim().toLowerCase()
  if (!t) return []
  return allScreens()
    .map((s) => ({ s, score: s.label.toLowerCase().startsWith(t) ? 0 : s.label.toLowerCase().includes(t) ? 1 : s.trail.toLowerCase().includes(t) ? 2 : 9 }))
    .filter((x) => x.score < 9)
    .sort((a, b) => a.score - b.score)
    .map((x) => x.s)
}

export const readSidebarType = () => {
  try { const v = localStorage.getItem(SIDEBAR_KEY); return SIDEBAR_TYPES.some(([k]) => k === v) ? v : 'default' } catch { return 'default' }
}
