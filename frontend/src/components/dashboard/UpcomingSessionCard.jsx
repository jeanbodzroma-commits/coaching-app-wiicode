import { Link } from 'react-router-dom'
import { Clock, User } from 'lucide-react'
import { Card, Badge, Avatar } from '../ui'
import { cn } from '../../utils/cn'

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const DAYS   = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']

/**
 * Compact upcoming session card.
 * @typedef {object} UpcomingSessionCardProps
 * @property {object} session
 * @property {Array<{id?: string, firstName: string, lastName: string}>} [participants]
 * @property {string} [statusLabel]
 * @property {'CONFIRMED'|'WAITING'} [status]
 * @property {string} [className]
 */
export default function UpcomingSessionCard({ session, participants = [], status, statusLabel, className }) {
  const date = new Date(session.date)
  const dayNum = date.getDate()
  const month = MONTHS[date.getMonth()]
  const weekday = DAYS[date.getDay()]
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const typeBadge = session.type === 'SOLO'
    ? <Badge variant="primary">Solo</Badge>
    : <Badge variant="accent">Duo</Badge>

  return (
    <Card padding="sm" interactive as="div" className={cn('!p-0 overflow-hidden', className)}>
      <Link
        to={`/planning/${session.id}`}
        className="flex items-center gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:rounded-xl"
      >
        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-700 shrink-0">
          <span className="text-caption font-medium uppercase">{weekday}</span>
          <span className="font-heading text-h2 font-semibold leading-none">{dayNum}</span>
          <span className="text-caption text-primary-700/70">{month}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {typeBadge}
            {status === 'WAITING' && <Badge variant="warning">En attente</Badge>}
            {statusLabel && status !== 'WAITING' && <Badge variant="success">{statusLabel}</Badge>}
          </div>
          <p className="mt-1 inline-flex items-center gap-1.5 text-body text-ink-700">
            <Clock className="h-3.5 w-3.5 text-ink-500" strokeWidth={1.75} aria-hidden="true" />
            {time} · {session.duration} min
          </p>
          {session.coach && (
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-caption text-ink-500">
              <User className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              {session.coach.firstName} {session.coach.lastName}
            </p>
          )}
        </div>

        {participants.length > 0 && (
          <div className="hidden sm:flex -space-x-2 shrink-0">
            {participants.slice(0, 3).map((p, i) => (
              <Avatar
                key={p.id ?? i}
                size="sm"
                name={`${p.firstName} ${p.lastName}`}
                className="ring-2 ring-surface"
              />
            ))}
            {participants.length > 3 && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-200 text-caption font-semibold text-ink-700 ring-2 ring-surface">
                +{participants.length - 3}
              </span>
            )}
          </div>
        )}
      </Link>
    </Card>
  )
}

UpcomingSessionCard.displayName = 'UpcomingSessionCard'
