import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button, Badge } from '../ui'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/**
 * Desktop weekly calendar view (Mon → Sun).
 *
 * @typedef {object} WeekCalendarProps
 * @property {Date} anchor                 Any date in the displayed week.
 * @property {(d: Date) => void} onAnchorChange
 * @property {Array<object>} sessions
 * @property {string|null} [reservedSessionId]   Highlight if the current user has it.
 */
export default function WeekCalendar({ anchor, onAnchorChange, sessions, reservedSessionIds = [] }) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const week = useMemo(() => buildWeek(anchor), [anchor])

  const byDay = useMemo(() => {
    const map = Array.from({ length: 7 }, () => [])
    for (const s of sessions) {
      const d = new Date(s.date)
      const dayIdx = (d.getDay() + 6) % 7 // Monday = 0
      const inWeek = week.find(w => sameDay(w, d))
      if (!inWeek) continue
      map[dayIdx].push(s)
    }
    for (const list of map) list.sort((a, b) => new Date(a.date) - new Date(b.date))
    return map
  }, [sessions, week])

  const monthLabel = useMemo(() => {
    const first = week[0]
    const last = week[6]
    if (first.getMonth() === last.getMonth()) {
      return first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }
    return `${first.toLocaleDateString('fr-FR', { month: 'short' })} – ${last.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
  }, [week])

  return (
    <div className="rounded-2xl bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
        <h3 className="font-heading text-h2 font-semibold text-ink-900 capitalize">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onAnchorChange(addDays(anchor, -7))} aria-label="Semaine précédente">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAnchorChange(new Date())}>Aujourd'hui</Button>
          <Button variant="ghost" size="sm" onClick={() => onAnchorChange(addDays(anchor, 7))} aria-label="Semaine suivante">
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {week.map((day, i) => (
          <DayColumn
            key={i}
            day={day}
            label={DAY_LABELS[i]}
            sessions={byDay[i]}
            reservedSessionIds={reservedSessionIds}
            onSessionClick={(id) => navigate(`/planning/${id}`)}
            reduced={reduced}
          />
        ))}
      </div>
    </div>
  )
}

function DayColumn({ day, label, sessions, reservedSessionIds, onSessionClick, reduced }) {
  const isToday = sameDay(day, new Date())
  return (
    <div className="flex min-h-[16rem] flex-col border-l border-ink-200 first:border-l-0">
      <div className={cn('flex items-baseline justify-between px-3 py-3', isToday ? 'bg-primary-50' : 'bg-ink-50/40')}>
        <span className="text-caption font-medium uppercase tracking-wide text-ink-500">{label}</span>
        <span className={cn('font-heading text-h3 font-semibold', isToday ? 'text-primary-700' : 'text-ink-900')}>
          {day.getDate()}
        </span>
      </div>
      <ul className="flex flex-1 flex-col gap-2 p-2">
        {sessions.length === 0 ? (
          <li className="flex flex-1 items-center justify-center text-caption text-ink-200">—</li>
        ) : (
          sessions.map((s, idx) => (
            <SessionTile
              key={s.id}
              session={s}
              isReserved={reservedSessionIds.includes(s.id)}
              onClick={() => onSessionClick(s.id)}
              delay={reduced ? 0 : idx * 0.04}
            />
          ))
        )}
      </ul>
    </div>
  )
}

function SessionTile({ session, isReserved, onClick, delay }) {
  const isSolo = session.type === 'SOLO'
  const confirmed = session.confirmedCount ?? 0
  const fill = Math.round((confirmed / session.capacity) * 100)
  const isFull = confirmed >= session.capacity
  const time = new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'group w-full rounded-lg p-2.5 text-left transition-all duration-150 ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          isSolo ? 'bg-primary-50 hover:bg-primary-100' : 'bg-accent-50 hover:bg-accent-100',
          isFull && 'opacity-60'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={cn('font-heading text-body font-semibold', isSolo ? 'text-primary-700' : 'text-accent-700')}>
            {time}
          </span>
          <Badge variant={isSolo ? 'primary' : 'accent'} size="sm">{session.type}</Badge>
        </div>
        <p className="mt-1 truncate text-caption text-ink-500">
          {session.coach.firstName} {session.coach.lastName}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/60">
            <div
              className={cn('h-full', isSolo ? 'bg-primary-700' : 'bg-accent-500')}
              style={{ width: `${fill}%` }}
            />
          </div>
          <span className="text-caption text-ink-500">{confirmed}/{session.capacity}</span>
        </div>
        {isReserved && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-caption font-medium text-success-500">
            ✓ Réservé
          </p>
        )}
      </button>
    </motion.li>
  )
}

function buildWeek(anchor) {
  const d = new Date(anchor)
  d.setHours(0, 0, 0, 0)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => addDays(d, i))
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
