import { useQuery } from '@tanstack/react-query'
import { reservationsService } from '../services/reservations.service'
import { formatDate } from '../utils/formatDate'

export default function HistoryPage() {
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: reservationsService.getMine,
  })

  const past = reservations.filter(r => new Date(r.session.date) < new Date())

  if (isLoading) return <div className="p-6 text-gray-400">Chargement…</div>

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Historique</h2>

      {past.length === 0
        ? <p className="text-gray-400">Aucune session passée.</p>
        : (
          <div className="space-y-2">
            {past.map(r => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{formatDate(r.session.date)}</p>
                  <p className="text-sm text-gray-500">{r.session.duration} min · {r.session.type} · {r.session.coach?.firstName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.attendance && <AttendanceBadge attendance={r.attendance} />}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { CONFIRMED: 'bg-blue-100 text-blue-700', WAITING: 'bg-yellow-100 text-yellow-700', CANCELLED: 'bg-gray-100 text-gray-600' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status]}`}>{status}</span>
}

function AttendanceBadge({ attendance }) {
  const map = { PRESENT: 'bg-green-100 text-green-700', ABSENT: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-600' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[attendance]}`}>{attendance}</span>
}
