import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCircle2, XCircle, Clock, Users, UserMinus, ShieldAlert, KeyRound, Bell as BellIcon } from 'lucide-react'
import { notificationsService } from '../../services/notifications.service'
import { cn } from '../../utils/cn'

const TYPE_META = {
  RESERVATION_CONFIRMED: { Icon: CheckCircle2, tone: 'bg-green-100 text-green-700' },
  RESERVATION_CANCELLED: { Icon: XCircle,      tone: 'bg-red-100 text-red-700' },
  SESSION_REMINDER:      { Icon: Clock,        tone: 'bg-blue-100 text-blue-700' },
  DUO_PARTNER_JOINED:    { Icon: Users,        tone: 'bg-accent-100 text-accent-700' },
  DUO_PARTNER_LEFT:      { Icon: UserMinus,    tone: 'bg-amber-100 text-amber-700' },
  STRIKE_ADDED:          { Icon: ShieldAlert,  tone: 'bg-red-100 text-red-700' },
  ACCOUNT_UNBLOCKED:     { Icon: KeyRound,     tone: 'bg-green-100 text-green-700' },
}

/**
 * Notification bell with animated dropdown.
 * Polls /api/notifications every 30 s via React Query.
 * @param {object} props
 * @param {'light'|'dark'} [props.tone]  'light' for white backgrounds, 'dark' for teal sidebar.
 */
export default function NotificationBell({ tone = 'light' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getAll,
    refetchInterval: 30_000,
  })

  const markRead = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const notifications = data?.notifications ?? []
  const unread = data?.unreadCount ?? 0

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2',
          tone === 'dark'
            ? 'text-ink-50 hover:bg-white/10 focus-visible:ring-accent-400'
            : 'text-ink-700 hover:bg-ink-50 focus-visible:ring-primary-500'
        )}
        aria-label={unread > 0 ? `Notifications (${unread} non lues)` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-400 px-1 text-caption font-semibold text-ink-900 animate-pulse-soft"
            aria-hidden="true"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-ink-200 bg-surface shadow-elevated"
            role="dialog"
            aria-label="Notifications"
          >
            <header className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
              <p className="text-body-md font-heading font-semibold text-ink-900">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAll.mutate()}
                  className="text-caption font-medium text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
            </header>

            <ul className="max-h-96 overflow-y-auto divide-y divide-ink-200/60">
              {notifications.length === 0 ? (
                <li className="px-4 py-10 text-center">
                  <BellIcon className="mx-auto mb-2 h-8 w-8 text-ink-200" strokeWidth={1.5} />
                  <p className="text-body text-ink-500">Aucune notification</p>
                </li>
              ) : (
                notifications.map(n => <NotifRow key={n.id} n={n} onRead={() => !n.read && markRead.mutate(n.id)} onClose={() => setOpen(false)} />)
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotifRow({ n, onRead, onClose }) {
  const meta = TYPE_META[n.type] || { Icon: BellIcon, tone: 'bg-ink-200 text-ink-700' }
  const { Icon, tone } = meta

  const body = (
    <>
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-full shrink-0', tone)}>
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-body', n.read ? 'text-ink-700' : 'font-semibold text-ink-900')}>{n.title}</p>
        <p className="mt-0.5 text-caption text-ink-500 line-clamp-2">{n.message}</p>
        <p className="mt-1 text-caption text-ink-500">
          {new Date(n.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-400" aria-label="Non lue" />}
    </>
  )

  const className = cn(
    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
    n.read ? 'hover:bg-ink-50' : 'bg-accent-50/40 hover:bg-accent-50/70'
  )

  if (n.link) {
    return (
      <li>
        <Link
          to={n.link}
          onClick={() => { onRead(); onClose() }}
          className={className}
        >
          {body}
        </Link>
      </li>
    )
  }
  return (
    <li>
      <button type="button" onClick={onRead} className={className}>
        {body}
      </button>
    </li>
  )
}

NotificationBell.displayName = 'NotificationBell'
