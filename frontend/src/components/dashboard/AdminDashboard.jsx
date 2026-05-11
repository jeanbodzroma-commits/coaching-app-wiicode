import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts'
import { Users as UsersIcon, Calendar, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react'
import { historyService } from '../../services/history.service'
import { penaltiesService } from '../../services/penalties.service'
import { Card, Badge } from '../ui'
import { StatCard, ChartCard, ChartTooltip } from './'

const ROLE_PALETTE = ['#0d676f', '#fcb34d', '#22c55e']

export default function AdminDashboard({ data }) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  const { data: history } = useQuery({
    queryKey: ['history', 'admin-30d'],
    queryFn: () => historyService.get({ limit: 500 }),
    staleTime: 5 * 60_000,
  })

  const { data: penalties } = useQuery({
    queryKey: ['penalties'],
    queryFn: penaltiesService.getStrikes,
    staleTime: 60_000,
  })

  const blockedCount = (penalties?.users ?? []).filter(u => u.isBlocked).length

  const activity = useMemo(() => buildActivity(history?.data ?? []), [history])
  const roleData = useMemo(() => data ? [
    { label: 'Employé', value: data.stats.byRole.EMPLOYEE || 0 },
    { label: 'Coach',   value: data.stats.byRole.COACH    || 0 },
    { label: 'Admin',   value: data.stats.byRole.ADMIN    || 0 },
  ] : [], [data])
  const top5 = useMemo(() => buildTop5(history?.data ?? []), [history])

  if (!data) return null
  const { stats, recentSessions } = data

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
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:col-span-12 lg:grid-cols-4">
        <StatCard tone="primary" icon={<UsersIcon className="h-5 w-5" strokeWidth={1.75} />} value={stats.activeUsers} label="Utilisateurs actifs" />
        <StatCard tone="info"    icon={<Calendar  className="h-5 w-5" strokeWidth={1.75} />} value={stats.totalSessions} label="Total créneaux" />
        <StatCard tone="success" icon={<CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />} value={stats.reservations.CONFIRMED} label="Réservations confirmées" />
        <StatCard tone={blockedCount > 0 ? 'danger' : 'neutral'} icon={<ShieldAlert className="h-5 w-5" strokeWidth={1.75} />} value={blockedCount} label="Comptes suspendus" />
      </motion.div>

      {/* Activité 30 j */}
      <motion.div variants={item} className="lg:col-span-8">
        <ChartCard title="Activité" subtitle="30 derniers jours">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="aSessions" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0d676f" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0d676f" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="aReservations" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#fcb34d" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fcb34d" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8e9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#6b7a7d', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fill: '#6b7a7d', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#6b7a7d' }} />
                <Area type="monotone" dataKey="sessions"     name="Sessions"     stroke="#0d676f" strokeWidth={2.5} fill="url(#aSessions)" isAnimationActive animationDuration={800} />
                <Area type="monotone" dataKey="reservations" name="Réservations" stroke="#fcb34d" strokeWidth={2.5} fill="url(#aReservations)" isAnimationActive animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </motion.div>

      {/* Donut rôles */}
      <motion.div variants={item} className="lg:col-span-4">
        <ChartCard title="Répartition par rôle">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="label" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="none" isAnimationActive animationDuration={800}>
                  {roleData.map((d, i) => <Cell key={d.label} fill={ROLE_PALETTE[i]} />)}
                </Pie>
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#6b7a7d' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </motion.div>

      {/* Top 5 employés */}
      <motion.div variants={item} className="lg:col-span-7">
        <ChartCard title="Top 5 employés" subtitle="Sessions confirmées (30 derniers jours)">
          {top5.length === 0 ? (
            <p className="py-6 text-center text-body text-ink-500">Pas encore de données.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={top5} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke="#e2e8e9" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: '#6b7a7d', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fill: '#2a3a3d', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
                  <RechartsTooltip cursor={{ fill: '#0d676f0d' }} content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Sessions" fill="#0d676f" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </motion.div>

      {/* Alertes */}
      <motion.div variants={item} className="lg:col-span-5">
        <Card padding="md" className={blockedCount > 0 ? 'border border-danger-500/30 bg-red-50/30' : ''}>
          <header className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`h-5 w-5 ${blockedCount > 0 ? 'text-danger-500' : 'text-ink-500'}`} strokeWidth={1.75} />
              <h3 className="text-h3 font-heading font-semibold text-ink-900">Alertes</h3>
            </div>
            <Link to="/penalties" className="inline-flex items-center gap-1 text-caption font-medium text-primary-700 hover:underline">
              Gérer <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          {blockedCount === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-green-50/60 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success-500" strokeWidth={1.75} />
              <div>
                <p className="text-body font-medium text-ink-900">Aucun blocage actif</p>
                <p className="text-caption text-ink-500">Tous les employés peuvent réserver.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl bg-red-50/60 p-4">
                <p className="text-h2 font-heading font-semibold text-danger-500">{blockedCount}</p>
                <p className="text-caption text-ink-500">compte(s) suspendu(s) actuellement</p>
              </div>
              <p className="text-caption text-ink-500">
                Strikes : <span className="font-semibold text-ink-700">{penalties?.users.length ?? 0}</span> utilisateur(s) avec au moins un strike.
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Sessions récentes */}
      <motion.div variants={item} className="lg:col-span-12">
        <Card padding="md">
          <header className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 font-heading font-semibold text-ink-900">Sessions récentes</h3>
            <Link to="/planning" className="inline-flex items-center gap-1 text-caption font-medium text-primary-700 hover:underline">
              Tout voir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          {recentSessions.length === 0 ? (
            <p className="py-6 text-center text-body text-ink-500">Aucune session.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <thead>
                  <tr className="border-b border-ink-200 text-caption font-medium uppercase tracking-wide text-ink-500">
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Type</th>
                    <th className="py-2 text-left">Coach</th>
                    <th className="py-2 text-right">Remplissage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200/60">
                  {recentSessions.map(s => {
                    const pct = Math.round((s.confirmedCount / s.capacity) * 100)
                    return (
                      <tr key={s.id} className="cursor-pointer transition-colors hover:bg-ink-50" onClick={() => navigate(`/planning/${s.id}`)}>
                        <td className="py-3 text-ink-700">{new Date(s.date).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-3"><Badge variant={s.type === 'SOLO' ? 'primary' : 'accent'}>{s.type}</Badge></td>
                        <td className="py-3 text-ink-500">{s.coach.firstName} {s.coach.lastName}</td>
                        <td className="py-3 text-right">
                          <span className={`font-semibold ${pct === 100 ? 'text-success-500' : pct > 0 ? 'text-primary-700' : 'text-ink-500'}`}>{pct}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}

function buildActivity(sessions) {
  const days = 30
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const buckets = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000)
    buckets.push({
      key: ymd(d),
      label: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }),
      sessions: 0,
      reservations: 0,
    })
  }
  for (const s of sessions) {
    const k = ymd(new Date(s.date))
    const b = buckets.find(x => x.key === k)
    if (!b) continue
    b.sessions += 1
    b.reservations += (s.reservations || []).length
  }
  return buckets
}

function buildTop5(sessions) {
  const counter = new Map()
  for (const s of sessions) {
    for (const r of s.reservations || []) {
      if (!r.user) continue
      const key = r.user.id
      const entry = counter.get(key) || { id: key, label: `${r.user.firstName} ${r.user.lastName}`, value: 0 }
      entry.value += 1
      counter.set(key, entry)
    }
  }
  return [...counter.values()].sort((a, b) => b.value - a.value).slice(0, 5)
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
