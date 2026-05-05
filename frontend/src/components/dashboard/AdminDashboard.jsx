import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'

export default function AdminDashboard({ data }) {
  const navigate = useNavigate()
  if (!data) return null

  const { stats, recentSessions } = data

  const reservationTotal = stats.reservations.CONFIRMED + stats.reservations.WAITING + stats.reservations.CANCELLED

  return (
    <div className="space-y-6">
      {/* Stats utilisateurs */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Utilisateurs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value={stats.totalUsers} label="Total" color="blue" />
          <StatCard value={stats.activeUsers} label="Actifs" color="green" />
          <StatCard value={stats.byRole.COACH} label="Coachs" color="purple" />
          <StatCard value={stats.byRole.EMPLOYEE} label="Employés" color="indigo" />
        </div>
      </div>

      {/* Stats sessions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sessions</h3>
        <div className="grid grid-cols-3 gap-4">
          <StatCard value={stats.totalSessions} label="Total" color="blue" />
          <StatCard value={stats.upcomingSessions} label="À venir" color="green" />
          <StatCard value={stats.pastSessions} label="Passées" color="gray" />
        </div>
      </div>

      {/* Stats réservations */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Réservations</h3>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.reservations.CONFIRMED}</p>
              <p className="text-xs text-gray-500 mt-1">Confirmées</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{stats.reservations.WAITING}</p>
              <p className="text-xs text-gray-500 mt-1">En attente</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{stats.reservations.CANCELLED}</p>
              <p className="text-xs text-gray-500 mt-1">Annulées</p>
            </div>
          </div>
          {reservationTotal > 0 && (
            <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
              <div className="bg-green-500 rounded-full" style={{ width: `${(stats.reservations.CONFIRMED / reservationTotal) * 100}%` }} />
              <div className="bg-amber-400 rounded-full" style={{ width: `${(stats.reservations.WAITING / reservationTotal) * 100}%` }} />
              <div className="bg-gray-200 rounded-full flex-1" />
            </div>
          )}
        </div>
      </div>

      {/* Sessions récentes */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">Sessions récentes</h3>
          <button onClick={() => navigate('/planning')} className="text-xs text-blue-600 hover:underline">Voir tout →</button>
        </div>
        {recentSessions.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune session.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left pb-2">Date</th>
                <th className="text-left pb-2">Type</th>
                <th className="text-left pb-2">Coach</th>
                <th className="text-right pb-2">Remplissage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSessions.map(s => {
                const pct = Math.round((s.confirmedCount / s.capacity) * 100)
                return (
                  <tr key={s.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/planning/${s.id}`)}>
                    <td className="py-2.5 text-gray-700">{formatDate(s.date)}</td>
                    <td className="py-2.5">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${s.type === 'SOLO' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>{s.type}</span>
                    </td>
                    <td className="py-2.5 text-gray-500">{s.coach.firstName} {s.coach.lastName}</td>
                    <td className="py-2.5 text-right">
                      <span className={`font-semibold ${pct === 100 ? 'text-green-600' : pct > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{pct}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ value, label, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    gray: 'bg-gray-50 text-gray-600',
  }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  )
}
