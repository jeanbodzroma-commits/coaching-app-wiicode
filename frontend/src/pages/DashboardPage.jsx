import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../store/AuthContext'
import { sessionsService } from '../services/sessions.service'
import { reservationsService } from '../services/reservations.service'
import { formatDate } from '../utils/formatDate'

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: sessionsService.getAll })
  const { data: myReservations = [] } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: reservationsService.getMine,
    enabled: user?.role === 'EMPLOYEE',
  })

  const upcoming = sessions.filter(s => new Date(s.date) > new Date()).slice(0, 5)
  const myUpcoming = myReservations.filter(
    r => ['CONFIRMED', 'WAITING'].includes(r.status) && new Date(r.session.date) > new Date()
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Bonjour, {user?.firstName} 👋</h2>
        <p className="text-gray-500 text-sm">Votre tableau de bord</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Créneaux à venir" value={upcoming.length} color="blue" />
        {user?.role === 'EMPLOYEE' && (
          <>
            <StatCard label="Mes réservations à venir" value={myUpcoming.length} color="green" />
            <StatCard label="Strikes" value={user.strikes} color={user.strikes > 0 ? 'red' : 'gray'} />
          </>
        )}
        {user?.role === 'COACH' && (
          <StatCard label="Total créneaux" value={sessions.length} color="purple" />
        )}
      </div>

      {user?.role === 'EMPLOYEE' && myUpcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Mes prochaines sessions</h3>
          <div className="space-y-2">
            {myUpcoming.map(r => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{formatDate(r.session.date)}</p>
                  <p className="text-sm text-gray-500">{r.session.duration} min · {r.session.type}</p>
                </div>
                <ReservationStatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Prochains créneaux disponibles</h3>
        {upcoming.length === 0
          ? <p className="text-gray-400 text-sm">Aucun créneau à venir.</p>
          : (
            <div className="space-y-2">
              {upcoming.map(s => (
                <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800">{formatDate(s.date)}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        s.type === 'SOLO' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>{s.type}</span>
                    </div>
                    <p className="text-sm text-gray-500">{s.duration} min</p>
                  </div>
                  <SessionAvailability session={s} />
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}

function SessionAvailability({ session: s }) {
  if (s.type === 'SOLO') {
    const full = s.confirmedCount >= 1
    return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${full ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
      {full ? 'Complet' : 'Disponible'}
    </span>
  }
  if (s.confirmedCount >= 2) {
    return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">Complet</span>
  }
  if (s.waitingCount === 1) {
    return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">1 place · Rejoindre</span>
  }
  return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">2 places libres</span>
}

function ReservationStatusBadge({ status }) {
  const map = {
    CONFIRMED: { cls: 'bg-green-100 text-green-700', label: 'Confirmé' },
    WAITING: { cls: 'bg-amber-100 text-amber-700', label: 'En attente d\'un partenaire' },
  }
  const { cls, label } = map[status] || { cls: 'bg-gray-100 text-gray-600', label: status }
  return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls}`}>{label}</span>
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-50 text-gray-700',
  }
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  )
}
