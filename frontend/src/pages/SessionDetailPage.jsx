import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../store/AuthContext'
import { sessionsService } from '../services/sessions.service'
import { reservationsService } from '../services/reservations.service'
import { formatDate } from '../utils/formatDate'

export default function SessionDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionsService.getOne(id),
  })

  const attendanceMutation = useMutation({
    mutationFn: ({ resId, attendance }) => reservationsService.updateAttendance(resId, attendance),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sessionsService.remove(id),
    onSuccess: () => navigate('/planning'),
  })

  if (isLoading) return <div className="p-6 text-gray-400">Chargement…</div>
  if (!session) return <div className="p-6 text-red-500">Créneau introuvable</div>

  const isPast = new Date(session.date) < new Date()

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <button onClick={() => navigate('/planning')} className="text-sm text-blue-600 hover:underline">← Retour au planning</button>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{formatDate(session.date)}</h2>
            <p className="text-gray-500 text-sm">{session.duration} min · Type {session.type} · Coach : {session.coach.firstName} {session.coach.lastName}</p>
          </div>
          {['COACH', 'ADMIN'].includes(user?.role) && !isPast && (
            <button onClick={() => { if (confirm('Supprimer ce créneau ?')) deleteMutation.mutate() }} className="text-xs text-red-600 hover:underline">
              Supprimer
            </button>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Participants ({session.reservations.length}/{session.capacity})</h3>
          {session.reservations.length === 0
            ? <p className="text-gray-400 text-sm">Aucun participant.</p>
            : (
              <ul className="space-y-2">
                {session.reservations.map(r => (
                  <li key={r.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-700">{r.user.firstName} {r.user.lastName}</span>
                    {['COACH', 'ADMIN'].includes(user?.role) && isPast && (
                      <select
                        defaultValue={r.attendance || ''}
                        onChange={e => attendanceMutation.mutate({ resId: r.id, attendance: e.target.value })}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="" disabled>Présence</option>
                        <option value="PRESENT">Présent</option>
                        <option value="ABSENT">Absent</option>
                        <option value="CANCELLED">Annulé</option>
                      </select>
                    )}
                    {r.attendance && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.attendance === 'PRESENT' ? 'bg-green-100 text-green-700'
                        : r.attendance === 'ABSENT' ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                      }`}>{r.attendance}</span>
                    )}
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      </div>
    </div>
  )
}
