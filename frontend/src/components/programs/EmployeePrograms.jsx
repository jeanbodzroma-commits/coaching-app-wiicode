import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { goalsService, programsService } from '../../services/goals.service'
import { GOAL_TYPE_LABELS, GOAL_TYPE_COLORS, GOAL_STATUS_LABELS, GOAL_STATUS_COLORS } from '../../utils/goals'

export default function EmployeePrograms() {
  const qc = useQueryClient()
  const [openGoalId, setOpenGoalId] = useState(null)
  const [tab, setTab] = useState('goals')

  const { data: goals = [], isLoading: loadingGoals } = useQuery({ queryKey: ['goals'], queryFn: goalsService.getAll })
  const { data: programs = [], isLoading: loadingPrograms } = useQuery({ queryKey: ['programs'], queryFn: programsService.getAll })

  const addProgressMutation = useMutation({
    mutationFn: ({ id, data }) => goalsService.addProgress(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setOpenGoalId(null) },
  })

  const { register, handleSubmit, reset } = useForm()

  const activeGoals = goals.filter(g => g.status === 'ACTIVE')
  const doneGoals = goals.filter(g => g.status !== 'ACTIVE')

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['goals', 'Mes objectifs'], ['programs', 'Mes programmes']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'goals' && (
        <div className="space-y-3">
          {loadingGoals ? <Skeleton /> : goals.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
              <p className="font-medium">Aucun objectif assigné</p>
              <p className="text-sm mt-1">Votre coach vous assignera un objectif prochainement.</p>
            </div>
          ) : (
            <>
              {activeGoals.map(g => <GoalCard key={g.id} goal={g} open={openGoalId === g.id}
                onToggle={() => setOpenGoalId(openGoalId === g.id ? null : g.id)}
                onAddProgress={(data) => addProgressMutation.mutate({ id: g.id, data })}
                register={register} handleSubmit={handleSubmit} reset={reset}
                isPending={addProgressMutation.isPending} />)}
              {doneGoals.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Terminés / Pausés</p>
                  {doneGoals.map(g => <GoalCard key={g.id} goal={g} readonly />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'programs' && (
        <div className="space-y-3">
          {loadingPrograms ? <Skeleton /> : programs.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
              <p className="font-medium">Aucun programme assigné</p>
              <p className="text-sm mt-1">Votre coach vous créera un programme prochainement.</p>
            </div>
          ) : (
            programs.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Par {p.coach.firstName} {p.coach.lastName} · {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
                    {p.goal && (
                      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${GOAL_TYPE_COLORS[p.goal.type]}`}>
                        Objectif : {p.goal.title}
                      </span>
                    )}
                  </div>
                </div>
                <pre className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap font-mono leading-relaxed">{p.content}</pre>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function GoalCard({ goal: g, open, onToggle, onAddProgress, register, handleSubmit, reset, isPending, readonly }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className={`p-4 ${!readonly ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={!readonly ? onToggle : undefined}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-gray-800">{g.title}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GOAL_TYPE_COLORS[g.type]}`}>{GOAL_TYPE_LABELS[g.type]}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GOAL_STATUS_COLORS[g.status]}`}>{GOAL_STATUS_LABELS[g.status]}</span>
            </div>
            {g.description && <p className="text-sm text-gray-500 mt-1">{g.description}</p>}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              {g.targetDate && <span>Cible : {new Date(g.targetDate).toLocaleDateString('fr-FR')}</span>}
              <span>{g._count.progressLogs} suivi(s)</span>
              {g.program && <span className="text-blue-500">Programme disponible</span>}
            </div>
          </div>
          {!readonly && <span className="text-gray-400 text-sm ml-2">{open ? '▲' : '▼'}</span>}
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          {/* Ajouter suivi */}
          <form onSubmit={handleSubmit(data => { onAddProgress(data); reset() })} className="flex gap-2">
            <input {...register('note', { required: true })} placeholder="Note de progression…"
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <input type="number" step="0.1" {...register('value', { valueAsNumber: true })} placeholder="Valeur"
              className="w-24 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <button type="submit" disabled={isPending}
              className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              + Suivi
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
    </div>
  )
}
