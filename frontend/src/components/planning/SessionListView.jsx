import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { Card, Badge } from '../ui'
import { cn } from '../../utils/cn'

/**
 * Mobile/compact list view, grouped by date.
 *
 * @typedef {object} SessionListViewProps
 * @property {Array<object>} sessions
 * @property {(s: object) => void} [onReserve]
 * @property {boolean} [canReserve]
 * @property {string[]} [reservedSessionIds]
 * @property {boolean} [isPending]
 */
export default function SessionListView({ sessions, onReserve, canReserve, reservedSessionIds = [], isPending }) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  const groups = useMemo(() => groupByDate(sessions), [sessions])

  if (sessions.length === 0) {
    return <p className="py-8 text-center text-body text-ink-500">Aucun créneau.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(group => (
        <div key={group.key}>
          <h4 className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-500">{group.label}</h4>
          <motion.ul
            initial={reduced ? false : 'hidden'}
            animate="visible"
            variants={reduced ? {} : { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
            className="flex flex-col gap-2"
          >
            {group.items.map(s => (
              <motion.li
                key={s.id}
                variants={reduced ? {} : { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
              >
                <SessionRow
                  session={s}
                  isReserved={reservedSessionIds.includes(s.id)}
                  canReserve={canReserve}
                  onReserve={onReserve}
                  onOpen={() => navigate(`/planning/${s.id}`)}
                  isPending={isPending}
                />
              </motion.li>
            ))}
          </motion.ul>
        </div>
      ))}
    </div>
  )
}

function SessionRow({ session: s, isReserved, canReserve, onReserve, onOpen, isPending }) {
  const isSolo = s.type === 'SOLO'
  const confirmed = s.confirmedCount ?? 0
  const waiting = s.waitingCount ?? 0
  const isFull = confirmed >= s.capacity
  const isDuoOpen = !isSolo && !isFull && waiting === 1 && confirmed === 0
  const time = new Date(s.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <Card padding="none" interactive className="overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:rounded-lg"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading text-h3 font-semibold text-ink-900">{time}</p>
            <Badge variant={isSolo ? 'primary' : 'accent'}>{s.type}</Badge>
            {isDuoOpen && <Badge variant="warning">Attente partenaire</Badge>}
            {isFull && <Badge variant="danger">Complet</Badge>}
            {isReserved && <Badge variant="success">Réservé</Badge>}
          </div>
          <p className="mt-1 text-caption text-ink-500">
            {s.duration} min · {s.coach.firstName} {s.coach.lastName}
          </p>
        </button>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-caption text-ink-500">{confirmed}/{s.capacity}</span>
          {canReserve && !isFull && !isReserved && (
            <button
              type="button"
              onClick={() => onReserve?.(s.id)}
              disabled={isPending}
              className={cn(
                'rounded-lg px-3 py-1.5 text-caption font-semibold text-white transition-colors disabled:opacity-60',
                isDuoOpen ? 'bg-accent-500 hover:bg-primary-700' : 'bg-primary-700 hover:bg-accent-600'
              )}
            >
              {isDuoOpen ? 'Rejoindre' : 'Réserver'}
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

function groupByDate(sessions) {
  const map = new Map()
  for (const s of sessions) {
    const d = new Date(s.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
        items: [],
      })
    }
    map.get(key).items.push(s)
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}
