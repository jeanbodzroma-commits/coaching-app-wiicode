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
  const myUpcoming = myReservations.filter(r => r.status === 'CONFIRMED' && new Date(r.session.date) > new Date())

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Bonjour, {user?.firstName} 👋</h2>
        <p className="text-gray-500 text-sm">Votre tableau de bord</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Créneaux disponibles" value={upcoming.length} color="blue" />
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

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Prochains créneaux</h3>
        {upcoming.length === 0
          ? <p className="text-gray-400 text-sm">Aucun créneau à venir.</p>
          : (
            <div className="space-y-2">
              {upcoming.map(s => (
                <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{formatDate(s.date)}</p>
                    <p className="text-sm text-gray-500">{s.duration} min · {s.type}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    s._count.reservations >= s.capacity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {s._count.reservations}/{s.capacity} place{s.capacity > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
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
