import { formatDate } from '../../utils/formatDate'

export default function EmployeeHistory({ data }) {
  if (!data) return null
  const { stats, data: reservations } = data

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard value={stats.total} label="Total sessions" color="blue" />
        <StatCard value={stats.present} label="Présent" color="green" />
        <StatCard value={stats.absent} label="Absent" color="red" />
        <StatCard value={stats.cancelled} label="Annulé" color="gray" />
        <StatCard value={`${stats.attendanceRate}%`} label="Taux de présence" color={stats.attendanceRate >= 80 ? 'green' : stats.attendanceRate >= 50 ? 'amber' : 'red'} />
      </div>

      {/* Barre de progression présence */}
      {stats.total > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Taux de présence global</span>
            <span className="font-semibold">{stats.attendanceRate}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="bg-green-500 rounded-full transition-all" style={{ width: `${(stats.present / stats.total) * 100}%` }} />
            <div className="bg-red-400 rounded-full transition-all" style={{ width: `${(stats.absent / stats.total) * 100}%` }} />
            <div className="bg-gray-300 rounded-full transition-all" style={{ width: `${(stats.cancelled / stats.total) * 100}%` }} />
          </div>
          <div className="flex gap-4 mt-2">
            {[['bg-green-500', 'Présent'], ['bg-red-400', 'Absent'], ['bg-gray-300', 'Annulé']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${c}`} />{l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Liste */}
      {reservations.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Aucune session correspondant aux filtres.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Coach</th>
                <th className="px-4 py-3 text-left">Durée</th>
                <th className="px-4 py-3 text-right">Présence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reservations.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{formatDate(r.session.date)}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={r.session.type} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.session.coach.firstName} {r.session.coach.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{r.session.duration} min</td>
                  <td className="px-4 py-3 text-right">
                    <AttendanceBadge attendance={r.attendance} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ value, label, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700', amber: 'bg-amber-50 text-amber-700', gray: 'bg-gray-50 text-gray-600' }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-75">{label}</p>
    </div>
  )
}

function TypeBadge({ type }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${type === 'SOLO' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>{type}</span>
}

function AttendanceBadge({ attendance }) {
  if (!attendance) return <span className="text-xs text-gray-400">—</span>
  const map = { PRESENT: ['bg-green-100 text-green-700', 'Présent'], ABSENT: ['bg-red-100 text-red-700', 'Absent'], CANCELLED: ['bg-gray-100 text-gray-500', 'Annulé'] }
  const [cls, label] = map[attendance] || ['bg-gray-100 text-gray-500', attendance]
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}
