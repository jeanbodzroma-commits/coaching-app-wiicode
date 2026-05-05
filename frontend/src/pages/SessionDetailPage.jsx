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
  const confirmed = session.reservations.filter(r => r.status === 'CONFIRMED')
  const waiting = session.reservations.filter(r => r.status === 'WAITING')

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <button onClick={() => navigate('/planning')} className="text-sm text-blue-600 hover:underline">← Retour au planning</button>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-800">{formatDate(session.date)}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                session.type === 'SOLO' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
              }`}>{session.type}</span>
            </div>
            <p className="text-gray-500 text-sm">
              {session.duration} min · Coach : {session.coach.firstName} {session.coach.lastName}
            </p>
          </div>
          {['COACH', 'ADMIN'].includes(user?.role) && !isPast && session.reservations.length === 0 && (
            <button
              onClick={() => { if (confirm('Supprimer ce créneau ?')) deleteMutation.mutate() }}
              className="text-xs text-red-500 hover:underline"
            >
              Supprimer
            </button>
          )}
        </div>

        {/* Statut du créneau */}
        <DuoStatus session={session} confirmed={confirmed} waiting={waiting} />

        {/* Participants confirmés */}
        <ParticipantSection
          title={`Participants confirmés (${confirmed.length}/${session.capacity})`}
          reservations={confirmed}
          isPast={isPast}
          canMark={['COACH', 'ADMIN'].includes(user?.role)}
          onAttendance={(resId, val) => attendanceMutation.mutate({ resId, attendance: val })}
          emptyMsg="Aucun participant confirmé."
        />

        {/* Liste d'attente (Duo uniquement) */}
        {session.type === 'DUO' && (
          <ParticipantSection
            title={`En attente d'un partenaire (${waiting.length})`}
            reservations={waiting}
            isPast={isPast}
            canMark={false}
            emptyMsg="Aucune personne en attente."
            waitingStyle
          />
        )}
      </div>
    </div>
  )
}

function DuoStatus({ session, confirmed, waiting }) {
  if (session.type !== 'DUO') return null

  if (confirmed.length >= 2) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 font-medium">
        Duo complet — 2 participants confirmés
      </div>
    )
  }
  if (waiting.length === 1) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
        <span className="font-medium">Duo incomplet</span> — {waiting[0].user.firstName} attend un partenaire
      </div>
    )
  }
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
      Duo disponible — 2 places libres
    </div>
  )
}

function ParticipantSection({ title, reservations, isPast, canMark, onAttendance, emptyMsg, waitingStyle }) {
  return (
    <div>
      <h3 className={`font-semibold mb-2 text-sm ${waitingStyle ? 'text-amber-700' : 'text-gray-700'}`}>{title}</h3>
      {reservations.length === 0
        ? <p className="text-gray-400 text-sm">{emptyMsg}</p>
        : (
          <ul className="space-y-2">
            {reservations.map(r => (
              <li key={r.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${waitingStyle ? 'bg-amber-50' : 'bg-gray-50'}`}>
                <span className="text-sm text-gray-700">{r.user.firstName} {r.user.lastName}</span>
                <div className="flex items-center gap-2">
                  {canMark && isPast && (
                    <select
                      defaultValue={r.attendance || ''}
                      onChange={e => onAttendance(r.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="" disabled>Marquer présence</option>
                      <option value="PRESENT">Présent</option>
                      <option value="ABSENT">Absent</option>
                      <option value="CANCELLED">Annulé</option>
                    </select>
                  )}
                  {r.attendance && <AttendanceBadge attendance={r.attendance} />}
                </div>
              </li>
            ))}
          </ul>
        )
      }
    </div>
  )
}

function AttendanceBadge({ attendance }) {
  const map = {
    PRESENT: 'bg-green-100 text-green-700',
    ABSENT: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-600',
  }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[attendance]}`}>{attendance}</span>
}
