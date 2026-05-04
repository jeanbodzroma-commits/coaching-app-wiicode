import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../store/AuthContext'
import { sessionsService } from '../services/sessions.service'
import { reservationsService } from '../services/reservations.service'
import { formatDate } from '../utils/formatDate'

export default function PlanningPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsService.getAll,
  })

  const reserveMutation = useMutation({
    mutationFn: (sessionId) => reservationsService.create(sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions', 'my-reservations'] }),
  })

  const { register, handleSubmit, reset } = useForm()
  const createMutation = useMutation({
    mutationFn: sessionsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions'] }); setShowForm(false); reset() },
  })

  const upcoming = sessions.filter(s => new Date(s.date) > new Date())
  const past = sessions.filter(s => new Date(s.date) <= new Date())

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Planning</h2>
        {['COACH', 'ADMIN'].includes(user?.role) && (
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Nouveau créneau
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(data => createMutation.mutate({ ...data, date: new Date(data.date).toISOString() }))} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700">Créer un créneau</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date et heure</label>
              <input type="datetime-local" {...register('date', { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Durée (min)</label>
              <input type="number" {...register('duration', { required: true, valueAsNumber: true })} defaultValue={60} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select {...register('type', { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="SOLO">Solo</option>
                <option value="DUO">Duo</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Création…' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50">Annuler</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-400">Chargement…</p>
      ) : (
        <>
          <SessionList
            title="Créneaux à venir"
            sessions={upcoming}
            userRole={user?.role}
            onReserve={(id) => reserveMutation.mutate(id)}
            onView={(id) => navigate(`/planning/${id}`)}
          />
          {past.length > 0 && (
            <SessionList title="Créneaux passés" sessions={past} userRole={user?.role} past onView={(id) => navigate(`/planning/${id}`)} />
          )}
        </>
      )}
    </div>
  )
}

function SessionList({ title, sessions, userRole, past, onReserve, onView }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-700 mb-3">{title}</h3>
      {sessions.length === 0
        ? <p className="text-gray-400 text-sm">Aucun créneau.</p>
        : (
          <div className="space-y-2">
            {sessions.map(s => {
              const full = s._count.reservations >= s.capacity
              return (
                <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                  <div className="cursor-pointer" onClick={() => onView(s.id)}>
                    <p className="font-medium text-gray-800">{formatDate(s.date)}</p>
                    <p className="text-sm text-gray-500">
                      {s.duration} min · {s.type} · {s.coach.firstName} {s.coach.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${full ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {s._count.reservations}/{s.capacity}
                    </span>
                    {!past && userRole === 'EMPLOYEE' && !full && (
                      <button onClick={() => onReserve(s.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                        Réserver
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
