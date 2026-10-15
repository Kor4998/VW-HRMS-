import { House } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Collapsed trail: Home › … › Employee Portal › [Dashboard]
// The earlier levels live in the "…" menu; the current page is the filled "selected" pill.
const HIDDEN = ['Employee Experience', 'Employee Details', 'My Profile', 'Personal Information']

export default function DashboardBreadcrumb({ current = 'Dashboard', onHome, appName = 'Employee Portal' }) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-2 sm:gap-2">
        <BreadcrumbItem>
          <BreadcrumbLink href="#" aria-label="Home" onClick={(e) => { e.preventDefault(); onHome?.() }}>
            <House className="size-4" strokeWidth={1.75} />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Show previous pages"
              className="flex items-center rounded-md px-1 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <BreadcrumbEllipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {HIDDEN.map((label) => (
                <DropdownMenuItem key={label}>{label}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); onHome?.() }}>{appName}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="inline-flex h-6 items-center rounded-full !opacity-100 bg-[#EDEDEF] px-3 text-xs font-medium text-[#38383D] dark:bg-[#2E2E33] dark:text-[#D9D9DD]">
            {current}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
