import { Fragment, useEffect, useRef, useState } from 'react'
import {
  ArrowLeftRight, ArrowRight, ArrowUp, CalendarCheck, CalendarOff, CalendarPlus, Coffee, Info, List, LogIn, Target, Timer, TriangleAlert, UserCheck, Heart, MessageCircle, Bell, BookOpen, Boxes, Briefcase, CalendarClock, CalendarDays, CalendarX2, Check,
  CheckCheck, ChartColumn, ChevronDown, ChevronLeft, CircleHelp, CircleUserRound, ClipboardCheck, Clock, Download,
  Ellipsis, ExternalLink, X, FileText, Fingerprint, Gift, GraduationCap, Hand, History, House, IdCard, LayoutGrid,
  LogOut, MapPin, Maximize2, Megaphone, Monitor, Moon, Package, Pencil, Plane, Plus, RefreshCw, Search, Settings,
  PanelLeftClose, PanelLeftOpen, SlidersHorizontal, Sparkles, Sun, Ticket, User, UserPlus, Users, Wallet, Zap,
} from 'lucide-react'
import markLight from '../assets/logo-mark-light.png'
import markDark from '../assets/logo-mark-dark.png'
import DashboardBreadcrumb from '@/components/DashboardBreadcrumb'
import SettingsPage from '@/components/SettingsPage'
import { useBranding } from '@/components/branding'
import { TreeNav, PanelNav } from '@/components/AppSidebar'
import { SIDEBAR_KEY, readSidebarType } from '@/components/sidebarMenus'
import AttendancePage from './modules/AttendancePage'
import LeavePage from './modules/LeavePage'
import ProfilePage from './modules/ProfilePage'
import { PROFILE_DEFAULT } from './modules/profileData'
import CommandMenu from '@/components/CommandMenu'
import ToastHost from '@/components/ToastHost'
import Tooltips from '@/components/Tooltips'
import DonutBreakdown from '@/components/DonutBreakdown'
import PersonHost from '@/components/PersonHost'
import AnnouncementModal from '@/components/AnnouncementModal'
import AppSwitcher from '@/components/AppSwitcher'
import HoldButton from '@/components/HoldButton'
import Countdown from '@/components/Countdown'
import { SupportDashboard, MyQueue } from './modules/SupportPages'
import { toast } from '@/components/toast'
import ShiftPage from './modules/ShiftPage'
import TeamPage from './modules/TeamPage'
import { AllProjects, ProjectBoard, PROJECT_LIST, addProject } from './modules/ProjectsPages'
import SpaceWizard from '@/components/SpaceWizard'
import ForYou from './modules/ForYou'
import ProjectsNav from '@/components/ProjectsNav'
import ApprovalsPage, { APPROVALS_SEED } from './modules/ApprovalsPage'
import PoliciesPage from './modules/PoliciesPage'
import AssetPage from './modules/AssetPage'
import './modules/Modules.css'
import '@/components/accent.css'
import '@/components/controls.css'
import '@/components/checkbox.css'
import './Dashboard.css'

const ICON_MAP = {
  home: House, user: User, users: Users, shift: CalendarClock, clock: Clock, calendar: CalendarDays, wallet: Wallet,
  chart: ChartColumn, cap: GraduationCap, box: Package, doc: FileText, report: FileText, settings: Settings,
  search: Search, bell: Bell, down: ChevronDown, left: ChevronLeft, arrow: ArrowRight, logout: LogOut, pin: MapPin,
  check: Check, plane: Plane, bolt: Zap, megaphone: Megaphone, gift: Gift, dots: Ellipsis, plus: Plus,
  finger: Fingerprint, circleuser: CircleUserRound, idcard: IdCard, briefcase: Briefcase, swap: ArrowLeftRight,
  ticket: Ticket, userplus: UserPlus, boxes: Boxes, calx: CalendarX2, book: BookOpen, pointer: Hand,
  signin: LogIn, timer: Timer, coffee: Coffee, caloff: CalendarOff, calplus: CalendarPlus, calcheck: CalendarCheck, usercheck: UserCheck,
  alert: TriangleAlert, info: Info, target: Target, list: List, heart: Heart, comment: MessageCircle, clipcheck: ClipboardCheck, grid: LayoutGrid, expand: Maximize2, edit: Pencil, refresh: RefreshCw,
}

function Icon({ name, size = 16, className }) {
  const Glyph = ICON_MAP[name]
  if (!Glyph) return null
  return <Glyph size={size} strokeWidth={1.75} className={className} aria-hidden="true" />
}

const NOTIF_TABS = [
  ['unread', 'Unread'],
  ['read', 'Read'],
  ['important', 'Important'],
  ['holidays', 'Holidays'],
]

const NOTIFS = [
  { id: 101, type: 'request', who: 'Attendance', ini: 'AT', verb: 'needs action:', chip: ['Missing checkout · 10 Oct', Clock], time: 'Today', ago: 'Fix before payroll closes on 25 Oct', unread: true, important: true, cta: { label: 'Fix now', go: ['Attendance', 'reg'] } },
  { id: 102, type: 'leave', who: 'Leave', ini: 'LV', verb: 'reminder:', chip: ['1 comp off expires 22 Oct', CalendarX2], time: 'Today', ago: 'Expires in 12 days', unread: true, important: true, cta: { label: 'Apply leave', go: ['Leave Management', 'requests'] } },
  { id: 104, type: 'leave', who: 'Holidays', ini: 'HD', verb: 'upcoming:', chip: ['Dussehra · 20 Oct', CalendarDays], time: 'Today', ago: 'Office closed · in 14 days', unread: true, important: true, holiday: true },
  { id: 103, type: 'request', who: 'Approvals', ini: 'AP', verb: 'waiting for you:', chip: ['Team requests', ClipboardCheck], time: 'Today', ago: 'Leave, swaps, regularization, WFH', unread: true, important: true, cta: { label: 'Review', go: ['Approvals'] } },
  { id: 1, type: 'announce', who: 'Kalyani Devarapalli', ini: 'KD', verb: 'posted in', chip: ['Announcements', Megaphone], time: 'Today 9:12 AM', ago: '2 hours ago', unread: true, important: true, announce: { title: 'Update your asset details', author: 'Kalyani Devarapalli', date: 'Oct 12', tag: 'General', text: 'Please upload your asset details in the HRMS Asset Manager at the earliest so IT can finish the yearly audit.' },
    bubble: 'Please upload your asset details in the HRMS Asset Manager at the earliest.' },
  { id: 2, type: 'request', who: 'Mohan Pillai', ini: 'MP', verb: 'requested a', chip: ['Shift Swap · 8 Oct', ArrowLeftRight], time: 'Today 8:40 AM', ago: '3 hours ago', unread: true, important: true, actions: true },
  { id: 3, type: 'birthday', who: 'Vishwanath Thepakulo', ini: 'VT', verb: 'has a birthday on', chip: ['Oct 24', Gift], time: 'Today 8:00 AM', ago: '4 hours ago', unread: true },
  { id: 4, type: 'request', who: 'Anita Rao', ini: 'AR', verb: 'approved your', chip: ['Leave · 21 Sep', CalendarDays], time: 'Yesterday 5:30 PM', ago: 'Yesterday', unread: false, important: true },
  { id: 5, type: 'announce', who: 'HR Team', ini: 'HR', verb: 'shared a file in', chip: ['Policies', BookOpen], time: 'Yesterday 2:10 PM', ago: 'Yesterday', unread: false, important: true,
    file: { name: 'WFH_Policy_2026.pdf', size: '1.2 MB' } },
  { id: 6, type: 'leave', who: 'Vinod Pasupuleti', ini: 'VP', verb: 'is on', chip: ['Paid Leave · Oct 06 – 07', CalendarX2], time: 'Today · Software Engineer', ago: '3 of 14 away', unread: true },
  { id: 7, type: 'leave', who: 'Anita Rao', ini: 'AR', verb: 'is on', chip: ['Casual Leave · Oct 07', CalendarX2], time: 'Today · QA Engineer', ago: '12 in office', unread: false },
  { id: 8, type: 'feed', who: 'Kalyani Devarapalli', ini: 'KD', verb: 'posted in', chip: ['Community feed', MessageCircle], time: 'Today 8:30 AM', ago: '18 hours ago', unread: true, announce: { title: 'Happy Birthday, Anil! 🎉', author: 'Kalyani Devarapalli', date: 'Oct 11', tag: 'General', name: 'Anil', image: 'birthday', text: 'Wishing you good health, happiness, and great success. Have an amazing year ahead! 🎂' },
    bubble: 'Happy Birthday, Anil! Wishing you a wonderful year ahead filled with happiness, good health and success.' },
]

const ACCOUNT_MENU = [
  [
    { label: 'View profile', icon: User, key: '⌘K→P', tab: 'profile' },
    { label: 'Settings', icon: Settings, key: '⌘S', tab: 'profile' },
  ],
  [
    { label: 'Changelog', icon: History },
    { label: 'Help & support', icon: CircleHelp, external: true },
  ],
]

const NAV_ICONS = {
  listi: List, grid: LayoutGrid, circleuser: CircleUserRound, user: User, idcard: IdCard, briefcase: Briefcase, doc: FileText,
  clock: Clock, calendar: CalendarDays, swap: ArrowLeftRight, pointer: Hand, finger: Fingerprint, clipcheck: ClipboardCheck,
  target: Target, users: Users, sparkles: Sparkles, home: House, boxes: Boxes, userplus: UserPlus, ticket: Ticket, calx: CalendarX2, book: BookOpen,
}

function NavIcon({ name, size = 18 }) {
  const C = NAV_ICONS[name]
  return <C size={size} strokeWidth={1.75} aria-hidden="true" />
}

const NAV_SUPPORT = [
  { label: 'Dashboard', icon: 'grid', page: 'Support Dashboard' },
  { label: 'My Queue', icon: 'listi', page: 'My Queue' },
]

const NAV = [
  { label: 'Dashboard', icon: 'grid', active: true },
  { label: 'My Profile', icon: 'circleuser', page: 'My Profile' },
  { label: 'Shift Management', icon: 'clock', page: 'Shift Management' },
  { label: 'Attendance', icon: 'finger', page: 'Attendance' },
  { label: 'Asset', icon: 'boxes', page: 'Asset' },
  { label: 'Leave Management', icon: 'calx', page: 'Leave Management' },
  { label: 'My Team', icon: 'users', page: 'My Team' },
  { label: 'Approvals', icon: 'clipcheck', page: 'Approvals' },
  { label: 'Policies', icon: 'doc', page: 'Policies' },
]

// sidebar label -> module page
const PAGE_OF = {
  'My Profile': 'profile', 'Shift Management': 'shift', Asset: 'asset',
  Attendance: 'attendance', 'Support Dashboard': 'sdash', 'My Queue': 'queue',
  'Leave Management': 'leave', Policies: 'policies', Approvals: 'approvals', 'My Team': 'team', 'All Projects': 'projects', 'For you': 'foryou',
}

// demo targets: shift end = today 18:30 (tomorrow if past); holiday and comp off expiry are fixed dates
const SHIFT_END = (() => { const d = new Date(); d.setHours(18, 30, 0, 0); if (d <= new Date()) d.setDate(d.getDate() + 1); return d.getTime() })()
const DUSSEHRA = new Date(2026, 9, 20).getTime()

const HOURS = [
  { label: 'Regular', icon: 'clock', value: '32h 33m', pct: 78, tone: 'reg', note: '5 working days' },
  { label: 'Overtime', icon: 'bolt', value: '3h 00m', pct: 7, tone: 'ot', note: 'Approved by manager' },
  { label: 'Breaks', icon: 'coffee', value: '6h 03m', pct: 15, tone: 'brk', note: 'Avg 1h 13m / day' },
]

const ATT = [
  { label: 'Present', value: 4, icon: 'calendar', tone: 'green' },
  { label: 'Working days', value: 20, icon: 'briefcase', tone: 'blue' },
  { label: 'WFH', value: 0, icon: 'home', tone: 'teal' },
  { label: 'On leave', value: 0, icon: 'plane', tone: 'amber' },
  { label: 'Late marks', value: 0, icon: 'clock', tone: 'rose' },
  { label: 'Pending', value: 0, icon: 'doc', tone: 'violet' },
]

const HIST_STATS = [
  ['22', 'Working days', 'out of 30 days', 'blue'],
  ['20', 'Present', '91% of working days', 'green'],
  ['0', 'WFH', 'of 20 present days', 'teal'],
  ['0', 'Comp Off', 'earned in this period', 'violet'],
  ['6', 'Week off', 'Saturdays & Sundays', 'grey'],
  ['1', 'Leave', '3% of total days', 'amber'],
  ['9h 47m', 'Avg. gross', 'per day with punches', 'blue'],
  ['1', 'Missing punch', 'day', 'rose'],
]

const HIST_ICONS = ['briefcase', 'usercheck', 'home', 'timer', 'caloff', 'plane', 'clock', 'alert']

const HIST_LEGEND = [['green', 'Present (Office)'], ['teal', 'Work from home'], ['amber', 'Leave'], ['blue', 'Holiday'], ['grey', 'Week off'], ['rose', 'Missing clock-out']]

const REQUESTS = [
  { type: 'Paid Leave', kind: 'Leave', from: '2026-09-21', to: '2026-09-21', days: 1, reason: 'Taking leave for personal work', created: '2026-09-19T12:33', status: 'Approved' },
  { type: 'Paid Leave', kind: 'Leave', from: '2026-08-06', to: '2026-08-07', days: 2, reason: 'Family function out of town', created: '2026-07-28T04:40', status: 'Approved' },
  { type: 'Paid Leave', kind: 'Leave', from: '2026-06-23', to: '2026-06-23', days: 1, reason: 'Sick leave, suffering from fever', created: '2026-06-20T03:05', status: 'Approved' },
  { type: 'Comp Off', kind: 'Comp Off', from: '2026-05-12', to: '2026-05-12', days: 1, reason: 'Extra working hours on the weekend release', created: '2026-05-08T11:15', status: 'Pending' },
  { type: 'WFH', kind: 'WFH', from: '2026-04-18', to: '2026-04-18', days: 1, reason: 'Work from home, plumber visit', created: '2026-04-16T17:20', status: 'Approved' },
]
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const reqDate = (iso) => { const d = new Date(`${iso}T00:00:00`); return [`${String(d.getDate()).padStart(2, '0')} ${MON[d.getMonth()]} ${d.getFullYear()}`, d.toLocaleDateString('en-US', { weekday: 'short' })] }
const reqCreated = (iso) => { const d = new Date(iso); return [d.toLocaleDateString('en-GB').replace(/\//g, '-'), d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })] }

const WEEK = [
  { d: 'Wed', n: 30, h: 10.38, l: '10h 23m' },
  { d: 'Thu', n: 1, h: 9.7, l: '9h 42m' },
  { d: 'Fri', n: 2, h: 0, l: '0h', tag: 'Holiday' },
  { d: 'Sat', n: 3, h: 0, l: '0h', tag: 'WO' },
  { d: 'Sun', n: 4, h: 0, l: '0h', tag: 'WO' },
  { d: 'Mon', n: 5, h: 10.45, l: '10h 27m' },
  { d: 'Tue', n: 6, h: 5.02, l: '5h 01m' },
]



const HOLIDAYS = [
  { m: 'OCT', d: '20', name: 'Dussehra', day: 'Tuesday', badge: 'Next holiday', next: true },
  { m: 'NOV', d: '08', name: 'Diwali', day: 'Sunday', badge: 'Public holiday' },
  { m: 'DEC', d: '25', name: 'Christmas Day', day: 'Friday', badge: 'Public holiday' },
  { m: 'JAN', d: '01', name: "New Year's Day", day: 'Friday', badge: 'Public holiday' },
]


// Attendance history calendar (7 Sep – 6 Oct 2026)
function buildHistory() {
  const cells = []
  const start = new Date(2026, 8, 7)
  const end = new Date(2026, 9, 7)
  const holidays = { '2026-9-14': 'Holiday', '2026-10-2': 'Holiday' }
  const pad = (n) => String(n).padStart(2, '0')
  for (let i = 0; i <= Math.round((end - start) / 864e5); i++) {
    const d = new Date(start.getTime() + i * 864e5)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    const dow = d.getDay()
    const cell = { day: d.getDate(), key, type: 'present' }
    if (i === 0) {
      for (let k = 0; k < dow; k++) cells.push({ key: `b${k}`, type: 'blank' })
    }
    if (holidays[key]) cell.type = 'holiday'
    else if (dow === 0 || dow === 6) cell.type = 'off'
    else if (key === '2026-9-21') cell.type = 'leave'
    else if (key === '2026-10-7') cell.type = 'missing'
    else {
      const inMin = 9 * 60 + 15 + ((d.getDate() * 13) % 45)
      const gross = 9 * 60 + ((d.getDate() * 37) % 130)
      const outMin = inMin + gross + 60
      const hm = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`
      cell.range = `${hm(inMin)}–${hm(outMin)}`
      cell.hours = `${Math.floor(gross / 60)}h ${pad(gross % 60)}m`
    }
    cells.push(cell)
  }
  return cells
}
const HISTORY = buildHistory()
const STATUS_LABEL = { present: 'WFO', off: 'Off', holiday: 'Holiday', leave: 'Leave', missing: 'Missing' }

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatTime(d, h24 = false) {
  let h = d.getHours()
  const ap = h >= 12 ? 'PM' : 'AM'
  if (!h24) h = h % 12 || 12
  const pad = (n) => String(n).padStart(2, '0')
  return { main: `${pad(h)}:${pad(d.getMinutes())}`, sec: pad(d.getSeconds()), ap: h24 ? '' : ap }
}

function Card({ icon, title, action, onAction, tone = 'indigo', children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      <div className="card-head">
        <span className={`head-ic ${tone}`}><Icon name={icon} size={15} /></span>
        <h3>{title}</h3>
        <Icon name="info" size={14} className="info-ic" />
        {action && <a href="#" className="link" onClick={(e) => { e.preventDefault(); onAction?.() }}>{action} <Icon name="arrow" size={13} /></a>}
      </div>
      {children}
    </section>
  )
}

export default function Dashboard({ onLogout }) {
  const brand = useBranding()
  const [sidebarType, setSidebarTypeState] = useState(readSidebarType)
  const setSidebarType = (v) => { setSidebarTypeState(v); try { localStorage.setItem(SIDEBAR_KEY, v) } catch { /* storage unavailable */ } }
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1100px)').matches) return true
    try { return localStorage.getItem('hrms-sidebar') === 'collapsed' } catch { return false }
  })
  const toggleSidebar = () => setCollapsed((c) => {
    const next = !c
    try { localStorage.setItem('hrms-sidebar', next ? 'collapsed' : 'open') } catch { /* storage unavailable */ }
    return next
  })
  // collapsed rail: hover / focus shows a label tooltip, or a flyout with the group's pages
  const [fly, setFly] = useState(null)
  const flyTimer = useRef(null)
  // narrow windows fold the sidebar into the icon rail automatically
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)')
    const onChange = (e) => { if (e.matches) setCollapsed(true) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const showFly = (e, item) => {
    if (!collapsed) return
    clearTimeout(flyTimer.current)
    const rect = e.currentTarget.getBoundingClientRect()
    setFly({ item, top: item.children ? rect.top : rect.top + rect.height / 2, left: rect.right + 10 })
  }
  const hideFly = () => {
    clearTimeout(flyTimer.current)
    flyTimer.current = setTimeout(() => setFly(null), 140)
  }
  const [openNav, setOpenNav] = useState({})
  const [helpOpen, setHelpOpen] = useState(() => {
    try { return localStorage.getItem('hrms-help') !== 'dismissed' } catch { return true }
  })
  const dismissHelp = () => {
    setHelpOpen(false)
    try { localStorage.setItem('hrms-help', 'dismissed') } catch { /* storage unavailable */ }
  }
  const [settingsTab, setSettingsTab] = useState(null)
  const [wizard, setWizard] = useState(false)
  const [page, setPage] = useState(null) // sidebar label of the open module page, or null for the dashboard
  const [annOpen, setAnnOpen] = useState(true)
  const [announcement, setAnnouncement] = useState(null)
  const [profile, setProfile] = useState(PROFILE_DEFAULT)
  const [app, setApp] = useState('portal')
  const [tickets, setTickets] = useState([])
  const switchApp = (id) => { setSettingsTab(null); setFly(null); setPageTab(null); setApp(id); setPage(id === 'support' ? 'Support Dashboard' : id === 'projects' ? 'For you' : null) }
  const appName = app === 'support' ? 'Support' : app === 'projects' ? 'Projects' : 'Employee Portal'
  const [pageTab, setPageTab] = useState(null) // optional initial tab for the open module page
  const [approvals, setApprovals] = useState(APPROVALS_SEED)
  const pendingApprovals = approvals.filter((a) => a.status === 'Pending').length
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!page) return undefined
    setLoading(true)
    const t = setTimeout(() => { setLoading(false); document.querySelector('.page h1')?.focus?.() }, 320)
    return () => clearTimeout(t)
  }, [page, pageTab])
  const [cmdOpen, setCmdOpen] = useState(false)
  const go = (label, tab = null) => { setSettingsTab(null); setFly(null); setPageTab(tab); if (PAGE_OF[label] || label.startsWith('proj:')) setPage(label) }
  useEffect(() => { const open = () => setWizard(true); window.addEventListener('prj-create', open); return () => window.removeEventListener('prj-create', open) }, [])
  const goTo = (label, tab = null) => (label ? go(label, tab) : goHome())
  // the Hierarchical and Cascading menus describe the HR portal; the other apps keep their own sidebars
  const newMenu = app === 'portal' && sidebarType !== 'default'
  const goHome = () => { setSettingsTab(null); setPage(null); setFly(null); setPageTab(null) }
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdOpen((o) => !o) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const [time24, setTime24] = useState(false)
  const [theme, setThemeState] = useState(() => {
    try { const v = localStorage.getItem('hrms-theme') || localStorage.getItem('theme'); return v === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  // portalled menus (dropdowns) render outside .dash, so mirror the theme on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    return () => document.documentElement.classList.remove('dark')
  }, [theme])
  const [accent, setAccentState] = useState(() => {
    try { return localStorage.getItem('hrms-accent') || 'orange' } catch { return 'orange' }
  })
  const [font, setFontState] = useState(() => {
    try { const v = localStorage.getItem('hrms-font'); return ['inter', 'inter-tight', 'geist'].includes(v) ? v : 'geist' } catch { return 'geist' }
  })
  const setFont = (f) => {
    setFontState(f)
    try { localStorage.setItem('hrms-font', f) } catch { /* storage unavailable */ }
  }
  // portalled menus render outside .dash, so mirror the font on <html>
  useEffect(() => {
    document.documentElement.dataset.font = font
    return () => { delete document.documentElement.dataset.font }
  }, [font])
  const setAccent = (a) => {
    setAccentState(a)
    try { localStorage.setItem('hrms-accent', a) } catch { /* storage unavailable */ }
  }
  const PRESENCE = [['online', 'Online', 'Available'], ['busy', 'Busy', 'Do not disturb'], ['away', 'Away', 'Back soon']]
  const [presence, setPresenceState] = useState(() => {
    try { const v = localStorage.getItem('hrms-presence'); return ['online', 'busy', 'away'].includes(v) ? v : 'online' } catch { return 'online' }
  })
  const setPresence = (v) => {
    setPresenceState(v)
    try { localStorage.setItem('hrms-presence', v) } catch { /* storage unavailable */ }
    toast({ title: `Status set to ${PRESENCE.find((x) => x[0] === v)[1]}`, text: PRESENCE.find((x) => x[0] === v)[2], duration: 1800 })
  }
  const [themeMode, setThemeMode] = useState(() => {
    try { return localStorage.getItem('hrms-theme-mode') === 'system' ? 'system' : 'manual' } catch { return 'manual' }
  })
  useEffect(() => {
    if (themeMode !== 'system') return undefined
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => { const t = mq.matches ? 'dark' : 'light'; setThemeState(t); try { localStorage.setItem('hrms-theme', t); localStorage.setItem('theme', t) } catch { /* storage unavailable */ } }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [themeMode])
  const pickMode = (m) => { setThemeMode(m); try { localStorage.setItem('hrms-theme-mode', m) } catch { /* storage unavailable */ } }
  const setTheme = (t) => {
    setThemeState(t)
    pickMode('manual')
    try { localStorage.setItem('hrms-theme', t); localStorage.setItem('theme', t) } catch { /* storage unavailable */ }
  }
  const toggleNav = (label) => setOpenNav((o) => ({ ...o, [label]: !o[label] }))
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifs, setNotifs] = useState(NOTIFS)
  const [ntab, setNtab] = useState('unread')
  const inTab = (n, t) => (t === 'unread' ? n.unread : t === 'read' ? !n.unread : t === 'holidays' ? !!n.holiday : n.important)
  const countOf = (t) => notifs.filter((n) => inTab(n, t)).length
  const unreadCount = countOf('unread')
  const shown = notifs.filter((n) => inTab(n, ntab))
  const markAllRead = () => setNotifs((l) => l.map((n) => ({ ...n, unread: false })))
  const answer = (id, a) => setNotifs((l) => l.map((n) => (n.id === id ? { ...n, answer: a, unread: false } : n)))
  const profileRef = useRef(null)
  const [tab, setTab] = useState('All')
  const [moreOpen, setMoreOpen] = useState(() => { try { return localStorage.getItem('hrms-dash-more') === 'open' } catch { return false } })
  const toggleMore = () => setMoreOpen((o) => { const n = !o; try { localStorage.setItem('hrms-dash-more', n ? 'open' : 'closed') } catch { /* storage unavailable */ } return n })
  const now = useClock()

  useEffect(() => {
    if (!profileOpen) return undefined
    const onDown = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setProfileOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [profileOpen])

  useEffect(() => {
    if (!notifOpen) return undefined
    const onDown = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setNotifOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [notifOpen])
  const t = formatTime(now, time24)
  const TAB_ICON = { All: 'list', Leave: 'calendar', WFH: 'home', Regularization: 'clipcheck', 'Comp Off': 'timer' }

  const commandGroups = [
    {
      title: 'Quick actions',
      items: [
        { id: 'a-clock', label: 'Clock in / out', icon: Clock, hint: 'G A', keywords: 'punch time attendance', run: goHome },
        { id: 'a-leave', label: 'Apply for leave', icon: CalendarPlus, hint: 'G L', keywords: 'request time off', run: () => go('Leave Management', 'requests') },
        { id: 'a-wfh', label: 'Request work from home', icon: House, keywords: 'wfh remote', run: () => go('Attendance', 'wfh') },
        { id: 'a-reg', label: 'Regularize attendance', icon: ClipboardCheck, keywords: 'missed punch', run: () => go('Attendance', 'reg') },
        { id: 'a-swap', label: 'Create shift swap request', icon: ArrowLeftRight, keywords: 'roster', run: () => go('Shift Management', 'swap') },
      ],
    },
    {
      title: 'Go to',
      items: [
        { id: 'p-dash', label: 'Dashboard', icon: LayoutGrid, run: goHome },
        { id: 'p-prof', label: 'My Profile', icon: CircleUserRound, run: () => go('My Profile') },
        { id: 'p-shift', label: 'Shift Management', icon: Clock, run: () => go('Shift Management') },
        { id: 'p-att', label: 'Attendance', icon: Fingerprint, run: () => go('Attendance') },
        { id: 'p-asset', label: 'Assets', icon: Boxes, run: () => go('Asset') },
        { id: 'p-team', label: 'My Team', icon: Users, keywords: 'peers who is out calendar', run: () => go('My Team') },
        { id: 'p-appr', label: 'Approvals', icon: ClipboardCheck, keywords: 'manager team requests', run: () => go('Approvals') },
        { id: 'p-ticket', label: 'Raise an asset ticket', icon: Boxes, keywords: 'support laptop', run: () => go('Asset', 'tickets') },
        { id: 'p-cal', label: 'Attendance history', icon: CalendarDays, run: () => go('Attendance', 'history') },
        { id: 'p-leave', label: 'Leave Management', icon: CalendarX2, run: () => go('Leave Management', 'ledger') },
      ],
    },
    {
      title: 'Settings',
      items: [
        { id: 's-app', label: 'Appearance', icon: SlidersHorizontal, run: () => setSettingsTab('appearance') },
        { id: 's-not', label: 'Notification settings', icon: Bell, run: () => setSettingsTab('notifications') },
        { id: 's-sec', label: 'Security and two-step verification', icon: Settings, keywords: 'password 2fa authenticator', run: () => setSettingsTab('security') },
        { id: 's-theme', label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', icon: theme === 'dark' ? Sun : Moon, run: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); toast({ title: `${theme === 'dark' ? 'Light' : 'Dark'} mode on`, tone: 'info', duration: 2500 }) } },
      ],
    },
  ]
  const tabs = [['All', 5], ['Leave', 3], ['WFH', 1], ['Regularization', 0], ['Comp Off', 1]]
  const rows = REQUESTS.filter((r) => tab === 'All' || r.type.includes(tab))

  return (
    <div data-sidebar={app === 'portal' ? sidebarType : 'default'} className={`dash${collapsed ? ' collapsed' : ''}${theme === 'dark' ? ' dark' : ''}${app === 'projects' ? ' app-projects' : ''}`} data-accent={accent} data-font={font}>
      <a className="skip-link" href="#main-content" onClick={(e) => { e.preventDefault(); const h = document.querySelector('.page h1, .page h2') || document.getElementById('main-content'); h.setAttribute('tabindex', '-1'); h.focus() }}>Skip to content</a>
      {/* ---------- Sidebar ---------- */}
      <aside className="sidebar">
        <div className="side-top">
          <img src={theme === 'dark' ? brand.logoDark : brand.logoLight} alt="Voltuswave" className="side-logo" />
          <img src={theme === 'dark' ? markDark : markLight} alt="Voltuswave" className="side-mark" />
          <button className="round-btn" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} onClick={toggleSidebar}>
            {collapsed ? <PanelLeftOpen size={20} strokeWidth={2} aria-hidden="true" /> : <PanelLeftClose size={20} strokeWidth={2} aria-hidden="true" />}
          </button>
        </div>

        {newMenu && !(sidebarType === 'tree' && collapsed) ? (
          <nav className={`side-nav as2-nav${sidebarType === 'cascading' ? ' flush' : ''}`} aria-label="Main menu">
            {sidebarType === 'tree'
              ? <TreeNav page={page} tab={pageTab} go={goTo} NavIcon={NavIcon} settingsOpen={!!settingsTab} badges={{ Approvals: pendingApprovals }} />
              : <PanelNav page={page} tab={pageTab} go={goTo} NavIcon={NavIcon} collapsed={collapsed} settingsOpen={!!settingsTab} badges={{ Approvals: pendingApprovals }} />}
          </nav>
        ) : (
        <nav className="side-nav">
          {app === 'projects' ? <ProjectsNav projects={PROJECT_LIST} page={page} tab={pageTab || 'board'} go={go} collapsed={collapsed} /> : (app === 'support' ? NAV_SUPPORT : NAV).map((m) => m.children ? (
            <div className="nav-group" key={m.label}>
              <button
                type="button"
                aria-label={m.label}
                aria-expanded={collapsed ? fly?.item === m : !!openNav[m.label]}
                className={openNav[m.label] ? 'nav-item has-kids open' : 'nav-item has-kids'}
                onClick={(e) => (collapsed ? showFly(e, m) : toggleNav(m.label))}
                onMouseEnter={(e) => showFly(e, m)}
                onMouseLeave={hideFly}
                onFocus={(e) => showFly(e, m)}
                onBlur={hideFly}
              >
                <NavIcon name={m.icon} size={18} />
                <span className="nav-label">{m.label}</span>
                <Icon name="down" size={14} className="nav-caret" />
              </button>
              {openNav[m.label] && (
                <div className="nav-sub">
                  {m.children.map(([label, icon]) => (
                    <a key={label} href="#" title={label} aria-current={page === label && !settingsTab ? 'page' : undefined} className={page === label && !settingsTab ? 'nav-sub-item active' : 'nav-sub-item'} onClick={(e) => { e.preventDefault(); go(label) }}>
                      <NavIcon name={icon} size={16} />
                      <span>{label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <a key={m.label} href="#" aria-label={m.label} onClick={(e) => { e.preventDefault(); if (m.page) go(m.page); else goHome() }}
              aria-current={(m.page ? page === m.page : !page) && !settingsTab ? 'page' : undefined}
              className={(m.page ? page === m.page : !page) && !settingsTab ? 'nav-item active' : 'nav-item'}
              onMouseEnter={(e) => showFly(e, m)} onMouseLeave={hideFly} onFocus={(e) => showFly(e, m)} onBlur={hideFly}>
              <NavIcon name={m.icon} size={18} />
              <span className="nav-label">{m.label}</span>
              {m.label === 'Approvals' && pendingApprovals > 0 && <em className="nav-badge" aria-label={`${pendingApprovals} pending`}>{pendingApprovals}</em>}
            </a>
          ))}
        </nav>
        )}

        {helpOpen && app !== 'projects' && (
        <div className="help">
          <button type="button" className="help-x" aria-label="Dismiss help card" title="Dismiss" onClick={dismissHelp}>
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <span className="help-ic"><Icon name="bolt" size={16} /></span>
          <b>Need help?</b>
          <p>Get quick answers, generate reports, and more.</p>
          <button type="button">Ask HR Assistant <Icon name="arrow" size={13} /></button>
        </div>
        )}
      </aside>

      {/* ---------- Main ---------- */}
      <main className="main">
        <header className="topbar">
          <div className="tb-left">
          <AppSwitcher current={app} onSelect={switchApp} />
          <label className="search" onClick={() => setCmdOpen(true)}>
            <Icon name="search" size={16} />
            <input placeholder="Search employees, leaves, policies, or anything…" readOnly onFocus={(e) => { e.target.blur(); setCmdOpen(true) }} />
            <kbd>⌘ K</kbd>
          </label>
          </div>
          <div className="tools">
            <span className="demo-pill" title="All numbers in this prototype are sample data">Demo data</span>
            <span className="portal"><i /> {appName}</span>
            <button className="select" type="button">Voltuswave PVT LTD <Icon name="down" size={14} /></button>
            <div className="notif" ref={notifRef}>
              <button
                className={`bell${notifOpen ? ' open' : ''}${unreadCount > 0 ? ' has-new' : ''}`}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                aria-expanded={notifOpen}
                onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false) }}
              >
                <Icon name="bell" size={18} />{unreadCount > 0 && <i />}
              </button>
              {notifOpen && (
                <div className="popover" role="dialog" aria-label="Notifications">
                  <div className="np-card np-body">
                  <div className="np-head">
                    <div>
                      <h3>Notifications</h3>
                      <p>Stay up to date with what is happening.</p>
                    </div>
                    {unreadCount > 0 && <button type="button" className="np-markall" onClick={markAllRead}><CheckCheck size={14} strokeWidth={1.75} aria-hidden="true" />Mark all as read</button>}
                    <button type="button" className="np-close" aria-label="Close notifications" onClick={() => setNotifOpen(false)}><X size={18} strokeWidth={1.75} /></button>
                  </div>
                  <div className="np-tabs" role="tablist">
                    {NOTIF_TABS.map(([key, label]) => (
                      <button key={key} type="button" role="tab" aria-selected={ntab === key} className={ntab === key ? 'on' : ''} onClick={() => setNtab(key)}>
                        {label}
                        {key === 'holidays' ? <em>{HOLIDAYS.length}</em> : key !== 'read' && countOf(key) > 0 && <em>{countOf(key)}</em>}
                      </button>
                    ))}
                  </div>
                  <div className="np-list">
                    {ntab === 'holidays' && (
                      <ul className="np-hol" aria-label="Upcoming holidays">
                        {HOLIDAYS.map((h) => (
                          <li key={h.name}>
                            <span className={h.next ? 'tile next' : 'tile'}><b>{h.d}</b><small>{h.m}</small></span>
                            <div><b>{h.name}</b><small>{h.day}</small></div>
                            <em className={h.next ? 'hb next' : 'hb'}>{h.badge}</em>
                          </li>
                        ))}
                      </ul>
                    )}
                    {ntab !== 'holidays' && shown.length === 0 && <div className="np-empty">{ntab === 'unread' ? "You're all caught up." : ntab === 'read' ? 'No read notifications yet.' : 'Nothing marked important.'}</div>}
                    {ntab !== 'holidays' && shown.map((n) => {
                      const Chip = n.chip[1]
                      return (
                        <article className={n.announce ? 'np-item ann-click' : 'np-item'} key={n.id} tabIndex={n.announce ? 0 : undefined} onKeyDown={(e) => { if (n.announce && e.key === 'Enter') { setNotifOpen(false); setAnnouncement(n.announce) } }} onClick={() => { if (n.unread && !n.actions) setNotifs((l) => l.map((x) => (x.id === n.id ? { ...x, unread: false } : x))); if (n.announce) { setNotifOpen(false); setAnnouncement(n.announce) } }}>
                          <span className="np-av">{n.ini}<i /></span>
                          <div className="np-main">
                            <div className="np-line">
                              <p><b>{n.who}</b> {n.verb} <span className="np-chip"><Chip size={14} strokeWidth={1.75} aria-hidden="true" />{n.chip[0]}</span></p>
                              {n.unread && <i className="np-dot" aria-label="Unread" />}
                            </div>
                            <div className="np-meta"><span>{n.time}</span>{!n.time.toLowerCase().startsWith(n.ago.toLowerCase()) && <span>{n.ago}</span>}</div>
                            {n.bubble && <div className="np-bubble" title={n.bubble}><span>{n.bubble}</span></div>}
                            {n.file && (
                              <div className="np-file">
                                <span className="np-ficon"><FileText size={22} strokeWidth={1.5} aria-hidden="true" /><em>PDF</em></span>
                                <div><b>{n.file.name}</b><small>{n.file.size}</small></div>
                                <button type="button" aria-label="Download"><Download size={16} strokeWidth={1.75} /></button>
                              </div>
                            )}
                            {n.actions && !n.answer && (
                              <div className="np-actions">
                                <button type="button" className="np-decline" onClick={() => answer(n.id, 'declined')}>Decline</button>
                                <button type="button" className="np-accept" onClick={() => answer(n.id, 'accepted')}>Accept</button>
                              </div>
                            )}
                            {n.holiday && <div className="np-actions"><button type="button" className="np-accept" onClick={() => setNtab('holidays')}>View holidays</button></div>}
                            {n.cta && <div className="np-actions"><button type="button" className="np-accept" onClick={() => { setNotifOpen(false); go(n.cta.go[0], n.cta.go[1]) }}>{n.cta.label}</button></div>}
                            {n.answer && <div className="np-answer">You {n.answer} this request</div>}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                  </div>
                </div>
              )}
            </div>
            <div className="profile" ref={profileRef}>
              <div className="who"><b>{profile?.name || 'Venkatesh Korlapati'}</b><small>Employee</small></div>
              <button
                type="button"
                className="avatar avatar-btn"
                aria-label="Account menu"
                aria-expanded={profileOpen}
                onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false) }}
              >
                VK<i className={`avatar-dot pres-${presence}`} aria-hidden="true" />
              </button>
              {profileOpen && (
                <div className="menu" role="menu">
                  <div className="menu-user">
                    <span className="avatar">VK<i className={`avatar-dot pres-${presence}`} /></span>
                    <div>
                      <b>Venkatesh Aravind Korlapati</b>
                      <small>korlapati.venkatesh@voltuswave.com</small>
                    </div>
                  </div>
                  {ACCOUNT_MENU.map((group, gi) => (
                    <Fragment key={gi}>
                    <div className="menu-group">
                      {group.map(({ label, icon: Ico, key, external, tab }) => (
                        <a key={label} href="#" role="menuitem" className="menu-item" onClick={(e) => { e.preventDefault(); setProfileOpen(false); if (label === 'View profile') go('My Profile'); else if (tab) setSettingsTab(tab) }}>
                          <Ico size={16} strokeWidth={1.75} aria-hidden="true" />
                          <span>{label}</span>
                          {key && <kbd>{key}</kbd>}
                          {external && <ExternalLink size={14} strokeWidth={1.75} className="menu-ext" aria-hidden="true" />}
                        </a>
                      ))}
                    </div>
                    {gi === 0 && (
                      <div className="menu-theme">
                        <span className="pres-label"><i className={`pres-dot pres-${presence}`} aria-hidden="true" />Status</span>
                        <div className="theme-seg" role="group" aria-label="Status">
                          {PRESENCE.map(([k, l, d]) => (
                            <button key={k} type="button" aria-label={`${l} — ${d}`} title={`${l} — ${d}`} aria-pressed={presence === k} className={presence === k ? 'on' : ''} onClick={() => setPresence(k)}><i className={`pres-dot pres-${k}`} aria-hidden="true" /></button>
                          ))}
                        </div>
                      </div>
                    )}
                    {gi === 0 && (
                      <div className="menu-theme">
                        <span>Theme</span>
                        <div className="theme-seg" role="group" aria-label="Theme">
                          <button type="button" aria-label="Light theme" aria-pressed={themeMode === 'manual' && theme === 'light'} className={themeMode === 'manual' && theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>
                            <Sun size={16} strokeWidth={1.75} aria-hidden="true" />
                          </button>
                          <button type="button" aria-label="Dark theme" aria-pressed={themeMode === 'manual' && theme === 'dark'} className={themeMode === 'manual' && theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>
                            <Moon size={16} strokeWidth={1.75} aria-hidden="true" />
                          </button>
                          <button type="button" aria-label="Match system theme" title="Match system" aria-pressed={themeMode === 'system'} className={themeMode === 'system' ? 'on' : ''} onClick={() => pickMode('system')}>
                            <Monitor size={16} strokeWidth={1.75} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )}
                    </Fragment>
                  ))}
                  <div className="menu-foot">
                    <button type="button" className="menu-signout" onClick={() => { setProfileOpen(false); onLogout?.() }}>
                      <LogOut size={16} strokeWidth={1.75} aria-hidden="true" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="scroll" id="main-content">
          <div className="page">
            <DashboardBreadcrumb appName={appName} current={settingsTab ? 'Settings' : page?.startsWith('proj:') ? (PROJECT_LIST.find((x) => `proj:${x.id}` === page)?.name || 'Project') : page || 'Dashboard'} onHome={app !== 'portal' ? () => switchApp(app) : goHome} />

            {loading && page && !settingsTab ? (
              <div className="sk" aria-busy="true" aria-label="Loading"><i className="sk-t" /><i className="sk-s" /><div className="sk-g"><i /><i /><i /><i /></div><i className="sk-b" /></div>
            ) : settingsTab ? (
              <SettingsPage sidebarType={sidebarType} setSidebarType={setSidebarType} profile={profile} onProfileSave={setProfile} tab={settingsTab} setTab={setSettingsTab} theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} font={font} setFont={setFont} time24={time24} setTime24={setTime24} onBack={() => setSettingsTab(null)} />
            ) : PAGE_OF[page] || page?.startsWith('proj:') ? (
              page?.startsWith('proj:') ? <ProjectBoard key={page} project={PROJECT_LIST.find((x) => `proj:${x.id}` === page)} tab={pageTab || 'board'} setTab={setPageTab}  onBack={() => go('All Projects')} /> : PAGE_OF[page] === 'foryou' ? <ForYou projects={PROJECT_LIST} onOpen={(x) => go(`proj:${x.id}`, 'board')} onAll={() => go('All Projects')} /> : PAGE_OF[page] === 'projects' ? <AllProjects onOpen={(x) => go(`proj:${x.id}`, 'board')} startNew={pageTab === 'new'} /> : PAGE_OF[page] === 'profile' ? <ProfilePage profile={profile} onNavigate={go} onEdit={() => setSettingsTab('public')} /> : PAGE_OF[page] === 'sdash' ? <SupportDashboard tickets={tickets} onRefresh={() => setTickets((t) => [...t])} /> : PAGE_OF[page] === 'queue' ? <MyQueue tickets={tickets} setTickets={setTickets} /> : PAGE_OF[page] === 'team' ? <TeamPage /> : PAGE_OF[page] === 'approvals' ? <ApprovalsPage items={approvals} setItems={setApprovals} /> : PAGE_OF[page] === 'policies' ? <PoliciesPage /> : PAGE_OF[page] === 'asset' ? <AssetPage key={pageTab} initial={pageTab || 'all'} /> : PAGE_OF[page] === 'shift' ? <ShiftPage key={pageTab} initial={pageTab || 'roster'} /> : PAGE_OF[page] === 'attendance' ? <AttendancePage key={pageTab} time24={time24} initial={pageTab || 'calendar'} /> : PAGE_OF[page] === 'leave' ? <LeavePage key={pageTab} initial={pageTab || 'overview'} /> : null
            ) : (
            <>

            <div className="hello">
              <div>
                <div className="date"><Icon name="calendar" size={14} /> Tuesday, 6 October 2026</div>
                <h1>Good afternoon, Venkatesh.</h1>
              </div>
              <div className="quick">
                <button className="btn q-leave" type="button" onClick={() => go('Leave Management', 'requests')}><Icon name="calplus" size={15} /> Leave</button>
                <button className="btn q-wfh" type="button" onClick={() => go('Attendance', 'wfh')}><Icon name="home" size={15} /> WFH</button>
                <button className="btn q-reg" type="button" onClick={() => go('Attendance', 'reg')}><Icon name="clipcheck" size={15} /> Regularize</button>
                <button className="btn q-comp" type="button" onClick={() => go('Leave Management', 'comp')}><Icon name="timer" size={15} /> Comp Off</button>
              </div>
            </div>

            {annOpen && (
              <div className="ann" role="status">
                <span className="ann-ic"><Icon name="megaphone" size={16} /></span>
                <button type="button" className="ann-open" onClick={() => setAnnouncement({ title: 'Dussehra on 20 Oct 🪔', author: 'HR Team', date: 'Oct 10', tag: 'Holiday', text: 'The office will be closed on Tuesday, 20 October for Dussehra. Please plan your leave around it and wrap up anything urgent before the break.' })}><p><b>Dussehra on 20 Oct.</b> The office is closed. Plan your leave around it.</p></button>
                <Countdown target={DUSSEHRA} units={['d', 'h', 'm']} variant="compact" label="Time until Dussehra" completeLabel="Today" />
                <button type="button" className="ann-x" aria-label="Dismiss announcement" onClick={() => setAnnOpen(false)}><X size={16} strokeWidth={1.75} /></button>
              </div>
            )}

            {/* ---------- Hero: Today ---------- */}
            <section className="hero">
              <div className="hero-top">
                <span className="live"><i /> Working · since 09:28 AM</span>
                <div className="hero-actions">
                  <span className="loc"><Icon name="pin" size={14} /> Office</span>
                  <button className="hero-icon" type="button" aria-label="Refresh"><Icon name="refresh" size={15} /></button>
                  <HoldButton className="clock-out" aria-label="Clock out (press and hold)" title="Press and hold to clock out" onConfirm={() => toast({ title: 'Clocked out', text: 'Your hours for today are recorded.' })}><Icon name="logout" size={15} /> Clock out</HoldButton>
                </div>
              </div>

              <div className="hero-mid">
                <div className="hero-time">{t.main}<span className="sec">:{t.sec}</span>{t.ap && <span className="ap">{t.ap}</span>}</div>
                <div className="hero-meta">
                  <div><b>5h 01m</b><span>worked today</span></div>
                  <div><b>56%</b><span>of shift</span></div>
                  <div><b>1h 27m</b><span>break</span></div>
                </div>
              </div>

              <div className="hero-bar">
                <i className="s-early" style={{ width: '3.5%' }} />
                <i className="s-work" style={{ width: '38%' }} />
                <i className="s-break" style={{ width: '12.5%' }} />
                <i className="s-work" style={{ width: '5.4%' }} />
                <i className="s-break" style={{ width: '3.7%' }} />
                <i className="s-work" style={{ width: '9%' }} />
                <i className="s-rest" style={{ width: '27.9%' }} />
              </div>
              <div className="hero-foot">
                <span>General Shift · 9:30 AM – 6:30 PM</span>
                <div className="hero-legend">
                  <span><i className="s-early" />Early</span>
                  <span><i className="s-work" />Worked</span>
                  <span><i className="s-break" />Break</span>
                  <span><i className="s-rest" />Remaining</span>
                </div>
              </div>

              <div className="hero-stats">
                <div><span><Icon name="signin" size={14} />Check-in</span><b>09:28 AM</b></div>
                <div><span><Icon name="clock" size={14} />Shift ends in</span><b><Countdown target={SHIFT_END} units={['h', 'm', 's']} variant="compact" label="Time until your shift ends" completeLabel="Shift over" className="bare" /></b></div>
                <div><span><Icon name="coffee" size={14} />Break taken</span><b>1h 27m</b></div>
                <div><span><Icon name="logout" size={14} />Expected out</span><b>06:28 PM</b></div>
              </div>
            </section>

            <Card icon="calendar" title="Attendance" tone="green" className="att-card">
              <span className="att-month">Oct 2026</span>
              <div className="att">
                {ATT.map((x) => (
                  <div className="att-i" key={x.label}>
                    <span className={`chipic ${x.tone}`}><Icon name={x.icon} size={18} /></span>
                    <div><b>{x.value}</b><span>{x.label}</span></div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="row r1">
              <Card icon="doc" title="My leave requests" action="View all" tone="orange">
                <div className="pills">
                  {tabs.map(([name, n]) => (
                    <button key={name} type="button" className={tab === name ? 'pill on' : 'pill'} onClick={() => setTab(name)}>
                      <Icon name={TAB_ICON[name]} size={14} />{name} <em>{n}</em>
                    </button>
                  ))}
                </div>
                <div className="table req-table">
                  <div className="tr th"><span>Type</span><span>From</span><span>To</span><span>Days</span><span>Reason</span><span>Created at</span><span>Status</span></div>
                  {rows.map((r, i) => {
                    const [fd, fw] = reqDate(r.from)
                    const [td, tw] = reqDate(r.to)
                    const [cd, ct] = reqCreated(r.created)
                    return (
                      <div className="tr" key={i}>
                        <span className="req-type"><i className={`req-ic ${r.kind === 'WFH' ? 'teal' : r.kind === 'Comp Off' ? 'violet' : 'rose'}`}><Icon name="doc" size={14} /></i><span><b>{r.type}</b><small className={`req-tag ${r.kind === 'WFH' ? 'teal' : r.kind === 'Comp Off' ? 'violet' : 'rose'}`}>{r.kind}</small></span></span>
                        <span className="req-date"><Icon name="calendar" size={13} /><span><b>{fd}</b><small>{fw}</small></span></span>
                        <span className="req-date"><Icon name="calendar" size={13} /><span><b>{td}</b><small>{tw}</small></span></span>
                        <span><i className="req-days">{r.days}</i></span>
                        <span className="req-reason" title={r.reason}>{r.reason}</span>
                        <span className="req-date"><Icon name="calendar" size={13} /><span><b>{cd}</b><small>{ct}</small></span></span>
                        <span><i className={r.status === 'Approved' ? 'badge ok' : 'badge wait'}><Icon name={r.status === 'Approved' ? 'check' : 'clock'} size={12} />{r.status}</i></span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <DonutBreakdown className="fill" title="Leave balance" centerLabel="Available" ranges={[
                { key: 'balance', label: 'Balance', subtitle: 'Resets 1 Apr 2027', center: 5.5, centerUnit: 'days', items: [
                  { label: 'Paid Leaves', note: 'Available', value: 4.5, color: '#6AA8FF' },
                  { label: 'Compensatory Off', note: 'Available · does not expire', value: 1, color: '#16A34A' },
                ] },
                { key: 'used', label: 'Used', subtitle: 'Days taken this leave year', centerLabel: 'Used', center: 17, centerUnit: 'days', items: [
                  { label: 'Casual', note: 'Paid leave', value: 9, color: '#6AA8FF' },
                  { label: 'Sick', note: 'Paid leave', value: 5, color: '#E8710A' },
                  { label: 'Earned', note: 'Paid leave', value: 3, color: '#16A34A' },
                  { label: 'Comp Off', value: 0, color: '#8A8A8F' },
                ] },
              ]} />
            </div>


            {moreOpen && (
            <div id="dash-more-body" className="more-body">
            <div className="row r3">
              <Card icon="clock" title="Hours summary" tone="orange">
                <div className="hx">
                  <div className="hx-ring">
                    <svg viewBox="0 0 120 120" role="img" aria-label="35h 33m of the 40h weekly target">
                      <circle cx="60" cy="60" r="50" className="hx-track" />
                      <circle cx="60" cy="60" r="50" className="hx-arc" strokeDasharray="279.6 314.2" transform="rotate(-90 60 60)" />
                    </svg>
                    <div><b>35h 33m</b><span>of 40h target</span></div>
                  </div>
                  <ul className="hx-list">
                    {HOURS.map((h) => (
                      <li key={h.label} className={h.tone}>
                        <div className="hx-row"><span><Icon name={h.icon} size={15} />{h.label}</span><b>{h.value}</b></div>
                        <div className="hx-bar"><i style={{ width: `${h.pct}%` }} /></div>
                        <small>{h.note}</small>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hx-foot">
                  <span className="chip-up"><ArrowUp size={12} strokeWidth={2} aria-hidden="true" /> 12% vs last week</span>
                  <span className="hx-goal"><Icon name="target" size={14} />89% of target · 4h 27m to go</span>
                </div>
              </Card>

              <Card icon="chart" title="Last 7 days">
                <div className="avg"><b>35h 33m</b><small className="chip-up"><ArrowUp size={12} strokeWidth={2} aria-hidden="true" /> 12% vs last week</small></div>
                <div className="chart">
                  <div className="cols">
                    <div className="avg-line" style={{ bottom: `calc(26px + (100% - 26px) * ${8.883 / 12})` }}><span>Avg 8h 53m</span></div>
                    {WEEK.map((w, i) => (
                      <div className="col" key={w.d}>
                        <div className="track">
                          {w.tag && <em className={`mk ${w.tag === 'Holiday' ? 'hol' : 'wo'}`}>{w.tag}</em>}
                          <i className={i === WEEK.length - 1 ? 'on' : ''} style={{ height: `${Math.max((w.h / 12) * 100, 3)}%` }}>
                            {i === WEEK.length - 1 && <span className="tip">{w.l}</span>}
                          </i>
                        </div>
                        <span className={i === WEEK.length - 1 ? 'day on' : 'day'}>{w.d}<small>{w.n}</small></span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="wk-tiles">
                  <div><small><Icon name="clock" size={13} />Total time</small><b>37h 22m</b></div>
                  <div className="amber"><small><Icon name="briefcase" size={13} />Work days</small><b>4</b></div>
                  <div><small><Icon name="caloff" size={13} />Week offs</small><b>2</b></div>
                </div>
              </Card>

              

            </div>

            <div className="row r4">
              <Card icon="calendar" title="Attendance history" tone="green">
                <div className="hist-stats">
                  {HIST_STATS.map(([v, l, n, tone], i) => (
                    <div className={tone} key={l}><Icon name={HIST_ICONS[i]} size={16} className="hs-ic" /><b>{v}</b><span>{l}</span><small>{n}</small></div>
                  ))}
                </div>
                <div className="hist-legend">
                  {HIST_LEGEND.map(([tone, label]) => (<span key={label}><i className={tone} />{label}</span>))}
                  <em>8 Sep 2026 – 7 Oct 2026</em>
                </div>
                <div className="cal" style={{ '--weeks': Math.ceil(HISTORY.length / 7) }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span className="cal-h" key={d}>{d}</span>)}
                  {HISTORY.map((c) => c.type === 'blank' ? (
                    <div className="cell blank" key={c.key} />
                  ) : (
                    <div className={`cell c-${c.type}`} key={c.key}>
                      <div className="cell-top"><b>{c.day}</b><em>{STATUS_LABEL[c.type]}</em></div>
                      {c.range && <span className="cell-range">{c.range}</span>}
                      {c.hours && <span className="cell-gross">{c.hours}</span>}
                    </div>
                  ))}
                </div>
              </Card>

            </div>
            </div>
            )}
            <div className="dash-more">
              <button type="button" className="more-btn" aria-expanded={moreOpen} aria-controls={moreOpen ? 'dash-more-body' : undefined} onClick={toggleMore}>
                <ChevronDown size={16} strokeWidth={1.75} className={moreOpen ? 'open' : ''} aria-hidden="true" />
                <span>{moreOpen ? 'Show less' : 'Show more'}</span>
                <small>Hours summary, last 7 days, attendance history, holidays</small>
              </button>
            </div>
            </>
            )}

          </div>
        </div>
      </main>
      {fly && collapsed && (
        <div
          className={fly.item.children ? 'fly' : 'fly flytip'}
          style={{ top: fly.top, left: fly.left }}
          role={fly.item.children ? 'menu' : 'tooltip'}
          onMouseEnter={fly.item.children ? () => clearTimeout(flyTimer.current) : undefined}
          onMouseLeave={fly.item.children ? hideFly : undefined}
        >
          <div className="fly-title">{fly.item.label}</div>
          {fly.item.children && fly.item.children.map(([label, icon]) => (
            <a key={label} href="#" role="menuitem" className={page === label && !settingsTab ? 'fly-item active' : 'fly-item'} onClick={(e) => { e.preventDefault(); setFly(null); go(label) }}>
              <NavIcon name={icon} size={16} />
              <span>{label}</span>
            </a>
          ))}
        </div>
      )}
      <CommandMenu open={cmdOpen} onClose={() => setCmdOpen(false)} groups={commandGroups} />
      <ToastHost />
      <Tooltips />
      <SpaceWizard open={wizard} onClose={() => setWizard(false)} existingKeys={PROJECT_LIST.map((x) => x.key)} onCreate={(np) => { addProject(np); setWizard(false); go(`proj:${np.id}`, 'backlog'); toast({ title: 'Space created', text: `${np.name} (${np.key}) is ready.` }) }} />
      <PersonHost />
      <AnnouncementModal a={announcement} onClose={() => setAnnouncement(null)} />
    </div>
  )
}
