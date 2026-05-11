import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, XCircle, Ban } from 'lucide-react'
import { Card, Badge } from '../ui'
import { StatCard } from '../dashboard'

export default function EmployeeHistory({ data }) {
  const reduced = useReducedMotion()
  if (!data) return null
  const { stats, data: reservations } = data

  const tone = stats.attendanceRate >= 80 ? 'success' : stats.attendanceRate >= 50 ? 'warning' : 'danger'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard tone="primary" value={stats.total} label="Total sessions" />
        <StatCard tone="success" value={stats.present} label="Présent" icon={<CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />} />
        <StatCard tone="danger"  value={stats.absent}  label="Absent"  icon={<XCircle      className="h-5 w-5" strokeWidth={1.75} />} />
        <StatCard tone={tone}    value={stats.attendanceRate} suffix="%" label="Taux de présence" />
      </div>

      <div className="space-y-2 md:hidden">
        {reservations.length === 0 ? (
          <p className="py-8 text-center text-body text-ink-500">Aucune session.</p>
        ) : (
          <motion.ul
            initial={reduced ? false : 'hidden'}
            animate="visible"
            variants={reduced ? {} : { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="flex flex-col gap-2"
          >
            {reservations.map(r => (
              <motion.li key={r.id} variants={reduced ? {} : { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}>
                <MobileRow reservation={r} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>

      <Card padding="none" className="hidden md:block">
        {reservations.length === 0 ? (
          <p className="py-8 text-center text-body text-ink-500">Aucune session correspondant aux filtres.</p>
        ) : (
          <table className="w-full text-body">
            <thead className="bg-ink-50/60 text-caption font-medium uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Coach</th>
                <th className="px-4 py-3 text-left">Durée</th>
                <th className="px-4 py-3 text-right">Présence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/60">
              {reservations.map(r => (
                <tr key={r.id} className="transition-colors hover:bg-ink-50">
                  <td className="px-4 py-3 font-medium text-ink-900">{formatDate(r.session.date)}</td>
                  <td className="px-4 py-3"><Badge variant={r.session.type === 'SOLO' ? 'primary' : 'accent'}>{r.session.type}</Badge></td>
                  <td className="px-4 py-3 text-ink-500">{r.session.coach.firstName} {r.session.coach.lastName}</td>
                  <td className="px-4 py-3 text-ink-500">{r.session.duration} min</td>
                  <td className="px-4 py-3 text-right"><AttendanceBadge attendance={r.attendance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function MobileRow({ reservation: r }) {
  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-medium text-ink-900">{formatDate(r.session.date)}</p>
          <p className="mt-0.5 text-caption text-ink-500">{r.session.duration} min · {r.session.coach.firstName} {r.session.coach.lastName}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={r.session.type === 'SOLO' ? 'primary' : 'accent'}>{r.session.type}</Badge>
          <AttendanceBadge attendance={r.attendance} />
        </div>
      </div>
    </Card>
  )
}

function AttendanceBadge({ attendance }) {
  if (!attendance) return <span className="text-caption text-ink-500">—</span>
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
