import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reservationsService } from '../../services/reservations.service'
import { formatDate } from '../../utils/formatDate'

export default function CoachDashboard({ data }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  if (!data) return null

  const { stats, todaySessions, upcomingSessions, needsAttention } = data

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard value={stats.totalSessions} label="Total créneaux" color="blue" />
        <StatCard value={stats.upcomingCount} label="À venir" color="green" />
        <StatCard value={needsAttention.length} label="Présences à marquer" color={needsAttention.length > 0 ? 'red' : 'gray'} />
      </div>

      {/* Sessions du jour */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Aujourd'hui</h3>
        {todaySessions.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune session aujourd'hui.</p>
        ) : (
          <div className="space-y-3">
            {todaySessions.map(s => (
              <TodaySessionCard key={s.id} session={s} onClick={() => navigate(`/planning/${s.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Présences à marquer */}
      {needsAttention.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="font-semibold text-red-700 mb-3">Présences à marquer ({needsAttention.length})</h3>
          <div className="space-y-2">
            {needsAttention.map(s => (
              <div
                key={s.id}
                className="bg-white rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-red-50 transition-colors"
                onClick={() => navigate(`/planning/${s.id}`)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{formatDate(s.date)}</p>
                  <p className="text-xs text-gray-500">{s.reservations.length} participant(s) sans statut</p>
                </div>
                <span className="text-xs text-red-600 font-medium hover:underline">Marquer →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planning à venir avec taux de remplissage */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Prochains créneaux</h3>
        {upcomingSessions.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun créneau à venir.</p>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map(s => (
              <UpcomingSessionRow key={s.id} session={s} onClick={() => navigate(`/planning/${s.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TodaySessionCard({ session: s, onClick }) {
  const confirmed = s.reservations.filter(r => r.status === 'CONFIRMED')
  const waiting = s.reservations.filter(r => r.status === 'WAITING')

  return (
    <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors" onClick={onClick}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-gray-800">{formatDate(s.date)}</p>
        <TypeBadge type={s.type} />
      </div>
      <p className="text-sm text-gray-500 mb-3">{s.duration} min</p>
      {s.reservations.length === 0 ? (
        <p className="text-xs text-gray-400">Aucun participant</p>
      ) : (
        <div className="space-y-1">
          {confirmed.map(r => (
            <div key={r.id} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-700">{r.user.firstName} {r.user.lastName}</span>
            </div>
          ))}
          {waiting.map(r => (
            <div key={r.id} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-gray-500">{r.user.firstName} {r.user.lastName} (attente)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UpcomingSessionRow({ session: s, onClick }) {
  const pct = s.fillRate
  const barColor = pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-gray-300'

  return (
    <div className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg" onClick={onClick}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800 truncate">{formatDate(s.date)}</p>
          <TypeBadge type={s.type} />
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {s.confirmedCount}/{s.capacity}
            {s.waitingCount > 0 && <span className="text-amber-500 ml-1">+{s.waitingCount} attente</span>}
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-500 w-10 text-right">{pct}%</span>
    </div>
  )
}

function TypeBadge({ type }) {
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${type === 'SOLO' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
      {type}
    </span>
  )
}

function StatCard({ value, label, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700', gray: 'bg-gray-50 text-gray-600' }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  )
}
