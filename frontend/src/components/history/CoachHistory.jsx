import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reservationsService } from '../../services/reservations.service'
import { formatDate } from '../../utils/formatDate'

export default function CoachHistory({ data }) {
  const navigate = useNavigate()
  if (!data) return null
  const { data: sessions } = data

  return (
    <div className="space-y-3">
      {sessions.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">Aucune session correspondant aux filtres.</p>
      ) : (
        sessions.map(s => <SessionCard key={s.id} session={s} onView={() => navigate(`/planning/${s.id}`)} />)
      )}
    </div>
  )
}

function SessionCard({ session: s, onView }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const attendanceMutation = useMutation({
    mutationFn: ({ resId, attendance }) => reservationsService.updateAttendance(resId, attendance),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['history'] }),
  })

  const confirmed = s.reservations.filter(r => r.status === 'CONFIRMED')
  const unmarkedCount = confirmed.filter(r => r.attendance === null).length

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-800">{formatDate(s.date)}</p>
              <TypeBadge type={s.type} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{s.duration} min · {s.reservations.length} participant(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unmarkedCount > 0 && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-600">
              {unmarkedCount} à marquer
            </span>
          )}
          {unmarkedCount === 0 && s.reservations.length > 0 && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-600">Complet</span>
          )}
          <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          {s.reservations.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun participant.</p>
          ) : (
            <div className="space-y-2">
              {s.reservations.map(r => (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{r.user.firstName} {r.user.lastName}</span>
                  <select
                    value={r.attendance || ''}
                    onChange={e => attendanceMutation.mutate({ resId: r.id, attendance: e.target.value })}
                    disabled={attendanceMutation.isPending}
                    className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 ${!r.attendance ? 'border-red-200 bg-red-50' : 'bg-white'}`}
                  >
                    <option value="" disabled>Marquer…</option>
                    <option value="PRESENT">Présent</option>
                    <option value="ABSENT">Absent</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                </div>
              ))}
            </div>
          )}
          <button onClick={onView} className="mt-3 text-xs text-blue-600 hover:underline">
            Voir le créneau complet →
          </button>
        </div>
      )}
    </div>
  )
}

function TypeBadge({ type }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${type === 'SOLO' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>{type}</span>
}
