import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home,
  FilePlus2,
  Search,
  Map,
  LayoutDashboard,
  Moon,
  Sun,
  Languages,
  Menu,
  X,
  TreePine,
} from 'lucide-react'
import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { SITE_DOMAIN, SITE_URL, VILLAGE_AREAS } from '@/constants'
import { Button } from '@/components/ui'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { cn } from '@/utils'

const links = [
  { to: '/', labelKey: 'nav.home', icon: Home },
  { to: '/report', labelKey: 'nav.report', icon: FilePlus2 },
  { to: '/track', labelKey: 'nav.track', icon: Search },
  { to: '/map', labelKey: 'nav.map', icon: Map },
  { to: '/complaints', labelKey: 'nav.complaints', icon: LayoutDashboard },
]

export function PublicLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { village, theme, toggleTheme, language, setLanguage, citizen, logoutCitizen } = useApp()
  const [open, setOpen] = useState(false)

  const selectedArea = VILLAGE_AREAS.find((a) => a.id === citizen?.areaId)
  const headerPlace =
    (selectedArea
      ? language === 'ta'
        ? selectedArea.nameTa
        : selectedArea.name
      : citizen?.areaName) ||
    (language === 'ta' ? village.nameTa : village.name)

  const toggleLang = () => {
    setLanguage(language === 'ta' ? 'en' : 'ta', true)
  }

  const signOut = () => {
    setOpen(false)
    logoutCitizen()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col dark:bg-vc-bg bg-light-bg">
      <header className="sticky top-0 z-40 border-b dark:border-vc-border border-light-border dark:bg-vc-bg/90 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-500 text-slate-900 shrink-0">
              <TreePine className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display font-bold text-xs sm:text-sm leading-tight dark:text-white text-light-text truncate max-w-[120px] sm:max-w-none">
                {t('brand')}
              </p>
              <p className="text-[10px] text-vc-muted leading-tight truncate max-w-[140px] sm:max-w-[200px]">
                {headerPlace}
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ to, labelKey, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition',
                    isActive
                      ? 'text-vc-accent bg-vc-accent/10'
                      : 'text-vc-muted hover:text-white dark:hover:text-white hover:text-light-text hover:bg-black/5 dark:hover:bg-white/5',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {t(labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleLang}
              className="p-2 rounded-xl text-vc-muted hover:bg-white/5"
              aria-label="Toggle language"
              title={language === 'en' ? 'தமிழ்' : 'English'}
            >
              <Languages className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-vc-muted hover:bg-white/5"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {citizen ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="min-w-0 text-right hidden xs:block sm:block">
                  <p className="text-[11px] sm:text-sm text-vc-muted truncate max-w-[100px] sm:max-w-[160px]">
                    {citizen.fullName}
                  </p>
                </div>
                <Button
                  variant="accent"
                  size="sm"
                  className="hidden md:inline-flex shrink-0 rounded-full px-5 sm:px-6 py-2 text-sm font-semibold text-white shadow-md shadow-amber-500/30 hover:brightness-110 hover:shadow-lg hover:shadow-amber-500/40"
                  onClick={signOut}
                >
                  {t('nav.logout')}
                </Button>
              </div>
            ) : null}
            <button
              type="button"
              className="md:hidden p-2 text-vc-muted"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open ? (
          <nav className="md:hidden border-t dark:border-vc-border border-light-border px-4 py-3 space-y-1">
            {links.map(({ to, labelKey }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm text-vc-muted hover:bg-white/5"
              >
                {t(labelKey)}
              </NavLink>
            ))}
            {citizen ? (
              <div className="pt-2 border-t dark:border-vc-border border-light-border mt-2">
                <p className="px-3 py-1 text-xs text-vc-muted truncate">{citizen.fullName}</p>
              </div>
            ) : null}
          </nav>
        ) : null}
      </header>

      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      <MobileBottomNav />

      <footer className="hidden md:block border-t dark:border-vc-border border-light-border dark:bg-vc-surface bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <p className="font-display font-bold text-lg dark:text-white text-light-text mb-2">{t('brand')}</p>
            <p className="text-sm text-vc-muted">{t('tagline')}</p>
            <a
              href={SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-sky-400 hover:underline mt-2 inline-block"
            >
              {SITE_DOMAIN}
            </a>
          </div>
          <div>
            <p className="label-caps mb-3">{t('footer.contact')}</p>
            <ul className="text-sm space-y-1.5 text-vc-muted">
              <li>{village.contact.president}</li>
              <li>{village.contact.address}</li>
              <li>{village.contact.phone}</li>
              <li>{village.contact.email}</li>
              <li>{village.contact.hours}</li>
            </ul>
          </div>
          <div>
            <p className="label-caps mb-3">Quick links</p>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link to="/report" className="text-sky-400 hover:underline">
                {t('nav.report')}
              </Link>
              <Link to="/track" className="text-sky-400 hover:underline">
                {t('nav.track')}
              </Link>
              <Link to="/map" className="text-sky-400 hover:underline">
                {t('nav.map')}
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t dark:border-vc-border border-light-border py-4 text-center text-xs text-vc-muted">
          © {new Date().getFullYear()} {village.name} Panchayat · {t('footer.rights')} · {SITE_DOMAIN}
        </div>
      </footer>
    </div>
  )
}
