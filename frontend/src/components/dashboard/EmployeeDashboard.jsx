import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Calendar, CheckCircle2, XCircle, TrendingUp, Target, ArrowRight, Sparkles } from 'lucide-react'
import { historyService } from '../../services/history.service'
import { goalsService } from '../../services/goals.service'
import { Card, Badge } from '../ui'
import { StatCard, ChartCard, ChartTooltip, Countdown, UpcomingSessionCard } from './'
import { GOAL_TYPE_LABELS, GOAL_TYPE_COLORS } from '../../utils/goals'

const MONTHS_SHORT = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']

export default function EmployeeDashboard({ data }) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  // Extra history for the 3-month chart
  const { data: history } = useQuery({
    queryKey: ['history', 'employee-3m'],
    queryFn: () => historyService.get({ limit: 200 }),
    staleTime: 5 * 60_000,
  })

  // Active goals (mini bloc)
  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: goalsService.getAll,
    staleTime: 60_000,
  })

  const presenceData = useMemo(() => buildPresenceData(history?.data ?? []), [history])
  const activeGoals = useMemo(() => goals.filter(g => g.status === 'ACTIVE').slice(0, 2), [goals])

  if (!data) return null
  const { stats, nextSession, upcoming } = data

  const container = reduced ? {} : {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }
  const item = reduced ? {} : {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
  }

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:col-span-12 lg:grid-cols-4">
        <StatCard tone="primary" icon={<Calendar className="h-5 w-5" strokeWidth={1.75} />} value={stats.upcomingCount} label="Sessions à venir" />
        <StatCard tone="success" icon={<CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />} value={stats.attended} label="Présent" />
        <StatCard tone="danger"  icon={<XCircle className="h-5 w-5" strokeWidth={1.75} />} value={stats.missed} label="Absent" />
        <StatCard tone="accent"  icon={<TrendingUp className="h-5 w-5" strokeWidth={1.75} />} value={stats.totalPast} label="Total sessions" />
      </motion.div>

      {/* Prochaine session */}
      <motion.div variants={item} className="lg:col-span-7">
        <NextSession session={nextSession?.session} status={nextSession?.status} onClick={() => navigate(`/planning/${nextSession?.session?.id}`)} />
      </motion.div>

      {/* Mini objectifs */}
      <motion.div variants={item} className="lg:col-span-5">
        <ActiveGoalsBlock goals={activeGoals} />
      </motion.div>

      {/* Prochaines sessions */}
      <motion.div variants={item} className="lg:col-span-7">
        <Card padding="md">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 font-heading font-semibold text-ink-900">Mes prochaines sessions</h3>
            <Link to="/planning" className="text-caption font-medium text-primary-700 hover:underline">
              Tout voir
            </Link>
          </header>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-body text-ink-500">Aucune réservation à venir.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map(r => (
                <li key={r.id}>
                  <UpcomingSessionCard session={r.session} status={r.status} statusLabel={r.status === 'CONFIRMED' ? 'Confirmé' : undefined} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      {/* Présence 3 mois */}
      <motion.div variants={item} className="lg:col-span-5">
        <ChartCard title="Présence sur 3 mois" subtitle="Sessions confirmées par mois">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={presenceData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#e2e8e9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6b7a7d', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#6b7a7d', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#0d676f0d' }} content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#6b7a7d' }} />
                <Bar dataKey="present" stackId="a" name="Présent" fill="#0d676f" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800} />
                <Bar dataKey="absent"  stackId="a" name="Absent"  fill="#fcb34d" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </motion.div>
    </motion.div>
  )
}

function NextSession({ session, status, onClick }) {
  if (!session) {
    return (
      <Card padding="lg" className="flex h-full flex-col justify-center bg-ink-50 text-ink-500">
        <p className="font-heading font-semibold text-ink-700">Aucune session à venir</p>
        <p className="mt-1 text-body">Réserve un créneau pour démarrer.</p>
        <Link to="/planning" className="mt-3 inline-flex items-center gap-1 text-primary-700 font-medium">
          Voir le planning <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    )
  }

  const date = new Date(session.date)
  const formatted = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <Card
      padding="lg"
      interactive
      onClick={onClick}
      className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white"
    >
      <div className="flex items-center justify-between">
        <p className="text-caption font-medium uppercase tracking-wide text-white/70">Prochaine session</p>
        <Badge variant="accent">{session.type}</Badge>
      </div>
      <p className="mt-2 font-display text-display-lg leading-tight text-white">{formatted}</p>
      <p className="text-body-md text-white/80">{time} · {session.duration} min</p>
      <p className="mt-1 text-body text-white/70">
        Coach : {session.coach?.firstName} {session.coach?.lastName}
        {status === 'WAITING' && <span className="ml-2 inline-block rounded-full bg-accent-600 px-2 py-0.5 text-caption font-semibold text-white">En attente partenaire</span>}
      </p>
      <div className="mt-4">
        <p className="mb-1 text-caption uppercase tracking-wider text-white/60">Dans</p>
        <Countdown to={session.date} />
      </div>
    </Card>
  )
}

function ActiveGoalsBlock({ goals }) {
  return (
    <Card padding="md" className="h-full">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-500" strokeWidth={1.75} />
          <h3 className="text-h3 font-heading font-semibold text-ink-900">Objectifs actifs</h3>
        </div>
        <Link to="/programs" className="text-caption font-medium text-primary-700 hover:underline">
          Voir tout
        </Link>
      </header>
      {goals.length === 0 ? (
        <div className="rounded-xl bg-ink-50 p-4 text-center">
          <Target className="mx-auto mb-2 h-8 w-8 text-ink-200" strokeWidth={1.5} />
          <p className="text-body text-ink-500">Aucun objectif assigné pour l'instant.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {goals.map(g => <GoalRow key={g.id} goal={g} />)}
        </ul>
      )}
    </Card>
  )
}

function GoalRow({ goal: g }) {
  const logsCount = g._count?.progressLogs ?? 0
  const intensity = Math.min(100, logsCount * 20)
  return (
    <li>
      <Link to="/programs" className="block rounded-xl p-3 -mx-3 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
        <div className="flex items-center gap-2">
          <span className={`text-caption font-semibold px-2 py-0.5 rounded-full ${GOAL_TYPE_COLORS[g.type]}`}>{GOAL_TYPE_LABELS[g.type]}</span>
          <p className="truncate text-body-md font-medium text-ink-900">{g.title}</p>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-400 to-accent-500 transition-[width] duration-700 ease-out"
              style={{ width: `${intensity}%` }}
            />
          </div>
          <span className="shrink-0 text-caption text-ink-500">{logsCount} suivi(s)</span>
        </div>
      </Link>
    </li>
  )
}

function buildPresenceData(reservations) {
  // Aggregate by month (last 3 months including current)
  const now = new Date()
  const buckets = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTHS_SHORT[d.getMonth()],
      present: 0,
      absent: 0,
    })
  }
  for (const r of reservations) {
    const d = new Date(r.session.date)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    const b = buckets.find(x => x.key === k)
    if (!b) continue
    if (r.attendance === 'PRESENT') b.present++
    else if (r.attendance === 'ABSENT') b.absent++
  }
  return buckets
}
