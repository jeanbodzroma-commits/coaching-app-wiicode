import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Calendar, ClipboardCheck, AlertTriangle, Gauge, ArrowRight } from 'lucide-react'
import { historyService } from '../../services/history.service'
import { Card, Badge, Avatar, Button } from '../ui'
import { StatCard, ChartCard, ChartTooltip } from './'

const PALETTE = ['#0d676f', '#fcb34d']

export default function CoachDashboard({ data }) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  const { data: history } = useQuery({
    queryKey: ['history', 'coach-30d'],
    queryFn: () => historyService.get({ limit: 200 }),
    staleTime: 5 * 60_000,
  })

  if (!data) return null
  const { stats, todaySessions, upcomingSessions, needsAttention } = data

  const fillSeries = useMemo(() => buildFillSeries(history?.data ?? []), [history])
  const fillAvg = useMemo(() => {
    if (!fillSeries.length) return 0
    const valid = fillSeries.filter(d => d.value > 0)
    if (!valid.length) return 0
    return Math.round(valid.reduce((a, b) => a + b.value, 0) / valid.length)
  }, [fillSeries])
  const soloDuo = useMemo(() => buildSoloDuo(history?.data ?? []), [history])

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
        <StatCard tone="primary" icon={<Calendar className="h-5 w-5" strokeWidth={1.75} />} value={todaySessions.length} label="Sessions aujourd'hui" />
        <StatCard tone="info"    icon={<Calendar className="h-5 w-5" strokeWidth={1.75} />} value={stats.upcomingCount} label="À venir" />
        <StatCard tone="warning" icon={<ClipboardCheck className="h-5 w-5" strokeWidth={1.75} />} value={needsAttention.length} label="Présences à marquer" />
        <StatCard tone="accent"  icon={<Gauge className="h-5 w-5" strokeWidth={1.75} />} value={fillAvg} suffix="%" label="Remplissage moyen 30j" />
      </motion.div>

      {/* Today */}
      <motion.div variants={item} className="lg:col-span-7">
        <Card padding="md">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 font-heading font-semibold text-ink-900">Aujourd'hui</h3>
            <span className="text-caption text-ink-500">{todaySessions.length} session(s)</span>
          </header>
          {todaySessions.length === 0 ? (
            <p className="py-6 text-center text-body text-ink-500">Aucune session aujourd'hui.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {todaySessions.map(s => <TodayRow key={s.id} session={s} onClick={() => navigate(`/planning/${s.id}`)} />)}
            </ul>
          )}
        </Card>
      </motion.div>

      {/* Présences à marquer */}
      <motion.div variants={item} className="lg:col-span-5">
        <Card padding="md" className={needsAttention.length > 0 ? 'border border-warning-500/30 bg-amber-50/40' : ''}>
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${needsAttention.length > 0 ? 'text-warning-500' : 'text-ink-500'}`} strokeWidth={1.75} />
              <h3 className="text-h3 font-heading font-semibold text-ink-900">Présences à marquer</h3>
            </div>
            <Badge variant={needsAttention.length > 0 ? 'warning' : 'neutral'}>{needsAttention.length}</Badge>
          </header>
          {needsAttention.length === 0 ? (
            <p className="text-body text-ink-500">Tout est à jour.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {needsAttention.slice(0, 4).map(s => (
                <li key={s.id}>
                  <Link
                    to={`/planning/${s.id}`}
                    className="flex items-center justify-between rounded-xl bg-surface p-3 transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <div className="min-w-0">
                      <p className="text-body font-medium text-ink-900">{formatDateShort(s.date)}</p>
                      <p className="text-caption text-ink-500">{s.reservations.length} participant(s) sans statut</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary-700" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      {/* Remplissage 30j */}
      <motion.div variants={item} className="lg:col-span-8">
        <ChartCard title="Taux de remplissage" subtitle="Sur les 30 derniers jours">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fillSeries} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="fillGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0d676f" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0d676f" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8e9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6b7a7d', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7a7d', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <RechartsTooltip content={<ChartTooltip formatter={v => `${v}%`} />} />
                <Area type="monotone" dataKey="value" name="Remplissage" stroke="#0d676f" strokeWidth={2.5} fill="url(#fillGradient)" isAnimationActive animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </motion.div>

      {/* Donut Solo / Duo */}
      <motion.div variants={item} className="lg:col-span-4">
        <ChartCard title="Solo / Duo" subtitle="Sessions sur 30 j">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={soloDuo} dataKey="value" nameKey="label" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="none" isAnimationActive animationDuration={800}>
                  {soloDuo.map((d, i) => <Cell key={d.label} fill={PALETTE[i]} />)}
                </Pie>
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#6b7a7d' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </motion.div>

      {/* Prochains créneaux */}
      <motion.div variants={item} className="lg:col-span-12">
        <Card padding="md">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 font-heading font-semibold text-ink-900">Prochains créneaux</h3>
            <Button as="a" variant="ghost" size="sm" onClick={() => navigate('/planning')}>
              Tout voir
            </Button>
          </header>
          {upcomingSessions.length === 0 ? (
            <p className="py-6 text-center text-body text-ink-500">Aucun créneau à venir.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {upcomingSessions.map(s => <UpcomingFillRow key={s.id} session={s} onClick={() => navigate(`/planning/${s.id}`)} />)}
            </ul>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}

function TodayRow({ session, onClick }) {
  const confirmed = session.reservations.filter(r => r.status === 'CONFIRMED')
  const waiting   = session.reservations.filter(r => r.status === 'WAITING')
  const time = new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const fill = Math.round((confirmed.length / session.capacity) * 100)

  return (
    <li>
      <button type="button" onClick={onClick} className="w-full rounded-xl border border-ink-200 bg-surface p-4 text-left transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="font-heading text-h3 font-semibold text-ink-900">{time}</p>
            <Badge variant={session.type === 'SOLO' ? 'primary' : 'accent'}>{session.type}</Badge>
          </div>
          <span className="text-caption font-semibold text-primary-700">{fill}% rempli</span>
        </div>
        <p className="mt-1 text-caption text-ink-500">{session.duration} min</p>
        {session.reservations.length > 0 ? (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-2">
              {confirmed.slice(0, 4).map(r => (
                <Avatar key={r.id} size="sm" name={`${r.user.firstName} ${r.user.lastName}`} className="ring-2 ring-surface" />
              ))}
            </div>
            {waiting.length > 0 && <Badge variant="warning">+{waiting.length} attente</Badge>}
          </div>
        ) : (
          <p className="mt-2 text-caption text-ink-500">Aucun participant</p>
        )}
      </button>
    </li>
  )
}

function UpcomingFillRow({ session, onClick }) {
  const fill = session.fillRate
  return (
    <li>
      <button type="button" onClick={onClick} className="w-full rounded-xl bg-ink-50/60 p-3 text-left transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-body font-medium text-ink-900">{formatDateShort(session.date)}</p>
          <Badge variant={session.type === 'SOLO' ? 'primary' : 'accent'}>{session.type}</Badge>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200">
            <div className="h-full bg-gradient-to-r from-primary-600 to-primary-800 transition-[width] duration-700 ease-out" style={{ width: `${fill}%` }} />
          </div>
          <span className="text-caption text-ink-500">
            {session.confirmedCount}/{session.capacity}
            {session.waitingCount > 0 && <span className="ml-1 text-warning-500">+{session.waitingCount}</span>}
          </span>
        </div>
      </button>
    </li>
  )
}

function formatDateShort(input) {
  return new Date(input).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function buildFillSeries(sessions) {
  const days = 30
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const buckets = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000)
    buckets.push({
      key: ymd(d),
      label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }),
      sum: 0,
      count: 0,
      value: 0,
    })
  }
  for (const s of sessions) {
    const k = ymd(new Date(s.date))
    const b = buckets.find(x => x.key === k)
    if (!b) continue
    const confirmed = (s.reservations || []).filter(r => r.status === 'CONFIRMED' || r.status === undefined).length
    const rate = Math.round((confirmed / s.capacity) * 100)
    b.sum += rate
    b.count += 1
  }
  for (const b of buckets) b.value = b.count > 0 ? Math.round(b.sum / b.count) : 0
  return buckets
}

function buildSoloDuo(sessions) {
  let solo = 0, duo = 0
  for (const s of sessions) {
    if (s.type === 'SOLO') solo++
    else if (s.type === 'DUO') duo++
  }
  return [
    { label: 'Solo', value: solo },
    { label: 'Duo', value: duo },
  ]
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
