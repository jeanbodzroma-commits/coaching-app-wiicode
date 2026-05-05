import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'

export default function EmployeeDashboard({ data }) {
  const navigate = useNavigate()
  if (!data) return null

  const { stats, nextSession, upcoming, recentHistory } = data

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={stats.upcomingCount} label="Sessions à venir" color="blue" />
        <StatCard value={stats.attended} label="Sessions effectuées" color="green" />
        <StatCard value={stats.missed} label="Absences" color={stats.missed > 0 ? 'red' : 'gray'} />
        <StatCard value={stats.totalPast} label="Total sessions" color="purple" />
      </div>

      {/* Prochaine session */}
      {nextSession ? (
        <div
          className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 text-white cursor-pointer hover:from-blue-700 hover:to-blue-600 transition-all"
          onClick={() => navigate(`/planning/${nextSession.session.id}`)}
        >
          <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">Prochaine session</p>
          <p className="text-xl font-bold">{formatDate(nextSession.session.date)}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm opacity-90">{nextSession.session.duration} min · {nextSession.session.type}</span>
            <span className="text-sm opacity-90">Coach : {nextSession.session.coach.firstName} {nextSession.session.coach.lastName}</span>
            <StatusPill status={nextSession.status} />
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-5 text-center text-gray-400">
          <p className="font-medium">Aucune session à venir</p>
          <button onClick={() => navigate('/planning')} className="mt-2 text-sm text-blue-600 hover:underline">
            Voir le planning →
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sessions à venir */}
        <Section title="Mes prochaines sessions" empty="Aucune réservation à venir.">
          {upcoming.map(r => (
            <ReservationRow key={r.id} reservation={r} onClick={() => navigate(`/planning/${r.session.id}`)} />
          ))}
        </Section>

        {/* Historique récent */}
        <Section title="Historique récent" empty="Aucune session passée.">
          {recentHistory.map(r => (
            <ReservationRow key={r.id} reservation={r} past />
          ))}
        </Section>
      </div>
    </div>
  )
}

function ReservationRow({ reservation: r, onClick, past }) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 ${onClick ? 'cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded' : ''}`}
      onClick={onClick}
    >
      <div>
        <p className="text-sm font-medium text-gray-800">{formatDate(r.session.date)}</p>
        <p className="text-xs text-gray-400">{r.session.duration} min · {r.session.type} · {r.session.coach.firstName}</p>
      </div>
      <div className="flex items-center gap-2">
        {past && r.attendance && <AttendancePill attendance={r.attendance} />}
        {!past && <StatusPill status={r.status} />}
      </div>
    </div>
  )
}

function Section({ title, children, empty }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="font-semibold text-gray-700 mb-3">{title}</h3>
      {hasChildren ? children : <p className="text-gray-400 text-sm">{empty}</p>}
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    CONFIRMED: 'bg-green-100 text-green-700',
    WAITING: 'bg-amber-100 text-amber-700',
  }
  const labels = { CONFIRMED: 'Confirmé', WAITING: 'En attente' }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>{labels[status] || status}</span>
}

function AttendancePill({ attendance }) {
  const map = { PRESENT: 'bg-green-100 text-green-700', ABSENT: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-500' }
  const labels = { PRESENT: 'Présent', ABSENT: 'Absent', CANCELLED: 'Annulé' }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[attendance] || ''}`}>{labels[attendance] || attendance}</span>
}

function StatCard({ value, label, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700', purple: 'bg-purple-50 text-purple-700', gray: 'bg-gray-50 text-gray-600' }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  )
}
