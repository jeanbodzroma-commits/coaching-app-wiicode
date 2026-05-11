import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Users, ShieldAlert, Activity } from 'lucide-react'
import { cn } from '../../utils/cn'

const ICONS = {
  PRESENT:        { Icon: CheckCircle2, tone: 'bg-green-100 text-green-700' },
  ABSENT:         { Icon: XCircle,      tone: 'bg-red-100 text-red-700' },
  CONFIRMED:      { Icon: CheckCircle2, tone: 'bg-primary-50 text-primary-700' },
  WAITING:        { Icon: Clock,        tone: 'bg-amber-100 text-amber-700' },
  CANCELLED:      { Icon: XCircle,      tone: 'bg-ink-200 text-ink-700' },
  DUO_JOINED:     { Icon: Users,        tone: 'bg-accent-100 text-accent-700' },
  STRIKE:         { Icon: ShieldAlert,  tone: 'bg-red-100 text-red-700' },
  DEFAULT:        { Icon: Activity,     tone: 'bg-ink-200 text-ink-700' },
}

/**
 * Vertical timeline with staggered reveal.
 *
 * @typedef {object} FeedItem
 * @property {string} id
 * @property {string} title
 * @property {string} [meta]
 * @property {string|Date} [time]
 * @property {keyof typeof ICONS} [kind]
 *
 * @typedef {object} ActivityFeedProps
 * @property {FeedItem[]} items
 * @property {string} [empty]
 * @property {string} [className]
 */
export default function ActivityFeed({ items, empty = 'Aucune activité récente.', className }) {
  const reduced = useReducedMotion()

  if (!items || items.length === 0) {
    return <p className="text-body text-ink-500">{empty}</p>
  }

  const container = reduced ? {} : {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }
  const row = reduced ? {} : {
    hidden:  { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
  }

  return (
    <motion.ul variants={container} initial="hidden" animate="visible" className={cn('flex flex-col gap-3', className)}>
      {items.map(item => {
        const { Icon, tone } = ICONS[item.kind] || ICONS.DEFAULT
        return (
          <motion.li key={item.id} variants={row} className="flex items-start gap-3">
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5', tone)}>
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body text-ink-900">{item.title}</p>
              {item.meta && <p className="text-caption text-ink-500">{item.meta}</p>}
            </div>
            {item.time && (
              <time className="shrink-0 text-caption text-ink-500" dateTime={typeof item.time === 'string' ? item.time : item.time.toISOString()}>
                {formatRelative(item.time)}
              </time>
            )}
          </motion.li>
        )
      })}
    </motion.ul>
  )
}

function formatRelative(input) {
  const d = typeof input === 'string' ? new Date(input) : input
  const diff = Date.now() - d.getTime()
  const m = Math.round(diff / 60_000)
  if (m < 1) return 'à l\'instant'
  if (m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `il y a ${h} h`
  const j = Math.round(h / 24)
  if (j < 7) return `il y a ${j} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

ActivityFeed.displayName = 'ActivityFeed'
