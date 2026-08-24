import { NavLink, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  ScrollText,
  Settings,
  List,
  Bell,
  TreePine,
  Menu,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Button } from '@/components/ui'
import { AdminMobileBottomNav } from '@/components/layout/AdminMobileBottomNav'
import { cn } from '@/utils'
import { roleLabel } from '@/utils/roles'

type NavItem = {
  to: string
  end?: boolean
  icon: typeof LayoutDashboard
  label: string
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/statistics', icon: BarChart3, label: 'Statistics' },
      { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
    ],
  },
  {
    title: 'Complaints',
    items: [
      { to: '/admin/complaints', icon: List, label: 'All Complaints' },
      { to: '/admin/reports', icon: FileText, label: 'Reports' },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/admin/activity', icon: ScrollText, label: 'Activity Log' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

const allItems = navSections.flatMap((s) => s.items)

function iconBtnClass(isActive: boolean) {
  return cn(
    'flex h-11 w-11 items-center justify-center rounded-xl border border-transparent transition-all duration-200',
    isActive
      ? 'text-vc-accent bg-vc-accent/10 border-vc-accent shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_0_14px_rgba(245,158,11,0.28)]'
      : 'text-slate-300 hover:text-vc-accent hover:bg-vc-accent/10 hover:border-vc-accent hover:shadow-[0_0_0_1px_rgba(245,158,11,0.25),0_0_12px_rgba(245,158,11,0.2)]',
  )
}

function flyoutLinkClass(isActive: boolean) {
  return cn(
    'flex items-center gap-3 w-full rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'text-vc-accent bg-vc-accent/10 border-vc-accent shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_0_14px_rgba(245,158,11,0.28)]'
      : 'text-slate-200 hover:text-vc-accent hover:bg-vc-accent/10 hover:border-vc-accent hover:shadow-[0_0_0_1px_rgba(245,158,11,0.25),0_0_12px_rgba(245,158,11,0.2)]',
  )
}

function NavSections({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="py-4 px-2.5 space-y-5 overflow-y-auto">
      {navSections.map((section) => (
        <div key={section.title}>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-vc-accent/90">
            {section.title}
          </p>
          <ul className="space-y-1">
            {section.items.map(({ to, end, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) => flyoutLinkClass(isActive)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const { admin, logout, village } = useApp()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [hoverOpen, setHoverOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  if (!admin) return <Navigate to="/admin/login" replace />

  const signOut = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-dvh bg-[#0d1117] text-vc-text flex">
      {/* Desktop icon rail + hover flyout */}
      <div
        className="relative w-[72px] shrink-0 z-40 hidden md:block"
        onMouseEnter={() => setHoverOpen(true)}
        onMouseLeave={() => setHoverOpen(false)}
      >
        <aside className="w-[72px] h-screen sticky top-0 border-r border-vc-border bg-[#0a0e14] flex flex-col items-center py-3 gap-1">
          <NavLink
            to="/"
            title={t('brand')}
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-slate-900"
          >
            <TreePine className="h-5 w-5" />
          </NavLink>

          {allItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) => iconBtnClass(isActive)}
            >
              <Icon className="h-5 w-5" />
            </NavLink>
          ))}
        </aside>

        <div
          className={cn(
            'absolute left-full top-0 h-screen w-[220px] z-50',
            'border-r border-vc-border bg-[#0a0e14]',
            'shadow-[12px_0_32px_rgba(0,0,0,0.45)]',
            'transition-all duration-200 ease-out origin-left',
            hoverOpen
              ? 'opacity-100 translate-x-0 pointer-events-auto'
              : 'opacity-0 -translate-x-2 pointer-events-none',
          )}
          aria-hidden={!hoverOpen}
        >
          <div className="h-14 px-4 border-b border-vc-border flex flex-col justify-center">
            <p className="font-display text-sm font-bold text-white truncate">{t('brand')}</p>
            <p className="text-[10px] text-vc-muted truncate">{village.name} Panchayat</p>
          </div>
          <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
            <NavSections />
          </div>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] bg-[#0a0e14] border-r border-vc-border md:hidden',
          'flex flex-col transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-14 px-4 border-b border-vc-border flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-white truncate">{t('brand')}</p>
            <p className="text-[10px] text-vc-muted truncate">{village.name}</p>
          </div>
          <button
            type="button"
            className="p-2 rounded-xl text-vc-muted hover:bg-white/5"
            onClick={() => setMobileOpen(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavSections onNavigate={() => setMobileOpen(false)} />
        </div>
        <div className="p-3 border-t border-vc-border">
          <Button
            variant="accent"
            className="w-full rounded-full py-2.5 font-semibold text-white shadow-md shadow-amber-500/30 hover:brightness-110"
            onClick={signOut}
          >
            {t('admin.signOut')}
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col w-full">
        <header className="min-h-14 border-b border-vc-border px-3 sm:px-4 md:px-6 py-2.5 flex items-center justify-between gap-2 bg-[#0d1117]/95 sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-vc-border text-vc-muted hover:text-white hover:bg-white/5 shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <img src={village.logo} alt="" className="h-7 w-7 rounded-full border border-vc-border shrink-0" />
            <div className="min-w-0 hidden xs:block sm:block">
              <p className="text-xs sm:text-sm text-vc-muted truncate max-w-[110px] sm:max-w-[180px]">
                {village.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="min-w-0 text-right">
              <p className="text-[11px] sm:text-sm text-vc-muted truncate max-w-[100px] sm:max-w-[160px]">
                {admin.displayName || admin.email.split('@')[0]}
              </p>
              <p className="text-[10px] text-vc-accent truncate">{roleLabel(admin.role)}</p>
            </div>
            <Button
              variant="accent"
              size="sm"
              className="hidden md:inline-flex shrink-0 rounded-full px-5 sm:px-6 py-2 text-sm font-semibold text-white shadow-md shadow-amber-500/30 hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/40"
              onClick={signOut}
            >
              {t('admin.signOut')}
            </Button>
          </div>
        </header>

        <div className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
          <Outlet />
        </div>
      </div>

      <AdminMobileBottomNav />
    </div>
  )
}
