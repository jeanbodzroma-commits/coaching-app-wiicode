import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../utils/formatDate'

export default function AdminHistory({ data, setFilter }) {
  const navigate = useNavigate()
  if (!data) return null
  const { data: sessions, coaches } = data

  return (
    <div className="space-y-4">
      {/* Filtre par coach */}
      {coaches?.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtrer par coach :</span>
          <select onChange={e => setFilter('coachId', e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tous les coachs</option>
            {coaches.map(c => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Aucune session correspondant aux filtres.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Coach</th>
                <th className="px-4 py-3 text-center">Participants</th>
                <th className="px-4 py-3 text-center">Présents</th>
                <th className="px-4 py-3 text-center">Absents</th>
                <th className="px-4 py-3 text-center">Non marqués</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.map(s => {
                const present = s.reservations.filter(r => r.attendance === 'PRESENT').length
                const absent = s.reservations.filter(r => r.attendance === 'ABSENT').length
                const unmarked = s.reservations.filter(r => r.attendance === null).length

                return (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/planning/${s.id}`)}>
                    <td className="px-4 py-3 font-medium text-gray-800">{formatDate(s.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.type === 'SOLO' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>{s.type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.coach.firstName} {s.coach.lastName}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{s.reservations.length}</td>
                    <td className="px-4 py-3 text-center">
                      {present > 0 ? <span className="font-semibold text-green-600">{present}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {absent > 0 ? <span className="font-semibold text-red-500">{absent}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {unmarked > 0 ? <span className="font-semibold text-amber-500">{unmarked}</span> : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
