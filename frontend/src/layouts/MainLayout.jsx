import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  History,
  Target,
  Users,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { Avatar } from '../components/ui'
import NotificationBell from '../components/notifications/NotificationBell'
import { cn } from '../utils/cn'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard, roles: ['ADMIN', 'COACH', 'EMPLOYEE'] },
  { to: '/planning',  label: 'Planning',      icon: Calendar,        roles: ['ADMIN', 'COACH', 'EMPLOYEE'] },
  { to: '/history',   label: 'Historique',    icon: History,         roles: ['ADMIN', 'COACH', 'EMPLOYEE'] },
  { to: '/programs',  label: 'Programmes',    icon: Target,          roles: ['ADMIN', 'COACH', 'EMPLOYEE'] },
  { to: '/users',     label: 'Utilisateurs',  icon: Users,           roles: ['ADMIN'] },
  { to: '/penalties', label: 'Pénalités',     icon: ShieldAlert,     roles: ['ADMIN'] },
]

const ROLE_LABEL = { ADMIN: 'Administrateur', COACH: 'Coach', EMPLOYEE: 'Employé' }

function getBreadcrumb(pathname) {
  if (pathname === '/dashboard')         return ['Dashboard']
  if (pathname === '/planning')          return ['Planning']
  if (pathname.startsWith('/planning/')) return ['Planning', 'Détail']
  if (pathname === '/history')           return ['Historique']
  if (pathname === '/programs')          return ['Programmes']
  if (pathname === '/users')             return ['Utilisateurs']
  if (pathname === '/penalties')         return ['Pénalités']
  return []
}

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const reduced = useReducedMotion()

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])
  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [drawerOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const items = NAV_ITEMS.filter(i => i.roles.includes(user?.role))
  const breadcrumb = getBreadcrumb(location.pathname)

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* === Sidebar desktop === */}
      <aside className="hidden lg:flex w-[264px] shrink-0 flex-col bg-gradient-to-b from-primary-800 to-primary-900 text-ink-50">
        <SidebarBrand />
        <NavList items={items} />
        <SidebarFooter user={user} onLogout={handleLogout} />
      </aside>

      {/* === Drawer mobile === */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-gradient-to-b from-primary-800 to-primary-900 text-ink-50 shadow-elevated lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                <SidebarBrand compact />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fermer la navigation"
                  className="rounded-full p-2 text-ink-50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>
              <NavList items={items} />
              <SidebarFooter user={user} onLogout={handleLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* === Main column === */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-200 bg-surface/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Ouvrir la navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <img src="/brand/logo.png" alt="Coaching Wiicode" className="h-8 w-auto" />
          <div className="flex items-center gap-1">
            <NotificationBell tone="light" />
            <Avatar size="sm" name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} />
          </div>
        </header>

        {/* Topbar desktop : breadcrumb + bell */}
        <div className="hidden lg:flex h-14 items-center justify-between border-b border-ink-200 bg-surface/80 px-8 backdrop-blur">
          <div className="flex items-center gap-2 text-caption text-ink-500" aria-label="Fil d'Ariane">
            <span>Wiicode</span>
            {breadcrumb.map((label, i) => (
              <span key={i} className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                <span className={cn(i === breadcrumb.length - 1 && 'text-ink-700 font-medium')}>{label}</span>
              </span>
            ))}
          </div>
          <NotificationBell tone="light" />
        </div>

        {/* Animated page transitions */}
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function SidebarBrand({ compact = false }) {
  return (
    <div className={cn('flex items-center gap-3 px-5', compact ? 'py-0' : 'py-6 border-b border-white/10')}>
      <img
        src="/brand/logo.png"
        alt="Coaching Wiicode"
        className="h-9 w-auto brightness-0 invert"
      />
      <span className="sr-only">Coaching Wiicode</span>
    </div>
  )
}

function NavList({ items }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
      <ul className="flex flex-col gap-1">
        {items.map(item => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-md font-medium transition-colors duration-150 ease-out-soft',
                  'hover:bg-white/10 hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
                  isActive ? 'bg-white/10 text-ink-50' : 'text-ink-50/80 hover:text-ink-50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-accent-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                  <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SidebarFooter({ user, onLogout }) {
  return (
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <Avatar size="sm" name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} className="bg-accent-400 text-ink-900" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium text-ink-50">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="truncate text-caption text-ink-50/60">{ROLE_LABEL[user?.role] ?? user?.role}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-2 inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-body text-ink-50/80 hover:bg-white/10 hover:text-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 transition-colors"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        <span>Déconnexion</span>
      </button>
    </div>
  )
}

