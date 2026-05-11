import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, XCircle, Ban } from 'lucide-react'
import { Card, Badge, Avatar } from '../ui'

export default function CoachHistory({ data }) {
  const reduced = useReducedMotion()
  if (!data) return null
  const { data: sessions } = data

  if (sessions.length === 0) {
    return <Card padding="md"><p className="py-6 text-center text-body text-ink-500">Aucune session correspondant aux filtres.</p></Card>
  }

  return (
    <motion.ul
      initial={reduced ? false : 'hidden'}
      animate="visible"
      variants={reduced ? {} : { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
      className="flex flex-col gap-3"
    >
      {sessions.map(s => (
        <motion.li key={s.id} variants={reduced ? {} : { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}>
          <Card padding="md">
            <header className="flex flex-wrap items-center gap-2 mb-3">
              <p className="font-heading text-h3 font-semibold text-ink-900">{formatDate(s.date)}</p>
              <Badge variant={s.type === 'SOLO' ? 'primary' : 'accent'}>{s.type}</Badge>
              <span className="text-caption text-ink-500">· {s.duration} min</span>
            </header>
            {s.reservations.length === 0 ? (
              <p className="text-body text-ink-500">Aucun participant.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {s.reservations.map(r => (
                  <li key={r.id} className="flex items-center justify-between rounded-lg bg-ink-50/60 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" name={`${r.user.firstName} ${r.user.lastName}`} />
                      <p className="text-body text-ink-900">{r.user.firstName} {r.user.lastName}</p>
                    </div>
                    <AttendanceBadge attendance={r.attendance} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.li>
      ))}
    </motion.ul>
  )
}

function AttendanceBadge({ attendance }) {
  if (!attendance) return <span className="text-caption text-ink-500">Non marqué</span>
  const map = {
    PRESENT:   { variant: 'success', label: 'Présent', Icon: CheckCircle2 },
    ABSENT:    { variant: 'danger',  label: 'Absent',  Icon: XCircle },
    CANCELLED: { variant: 'neutral', label: 'Annulé',  Icon: Ban },
  }
  const m = map[attendance] || map.CANCELLED
  const { Icon } = m
  return (
    <Badge variant={m.variant} size="sm">
      <Icon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
      {m.label}
    </Badge>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
