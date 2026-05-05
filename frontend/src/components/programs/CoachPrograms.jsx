import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { goalsService, programsService } from '../../services/goals.service'
import { usersService } from '../../services/users.service'
import { GOAL_TYPE_LABELS, GOAL_TYPE_COLORS, GOAL_STATUS_LABELS, GOAL_STATUS_COLORS } from '../../utils/goals'
import { formatDate } from '../../utils/formatDate'

export default function CoachPrograms() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('goals')
  const [selectedGoal, setSelectedGoal] = useState(null)

  const { data: goals = [] } = useQuery({ queryKey: ['goals'], queryFn: goalsService.getAll })
  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: programsService.getAll })
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersService.getAll })
  const employees = users.filter(u => u.role === 'EMPLOYEE' && u.isActive)

  const createGoalMutation = useMutation({
    mutationFn: goalsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); resetGoal() },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => goalsService.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })

  const deleteGoalMutation = useMutation({
    mutationFn: goalsService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })

  const createProgramMutation = useMutation({
    mutationFn: programsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programs'] }); resetProgram() },
  })

  const deleteProgramMutation = useMutation({
    mutationFn: programsService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['programs'] }),
  })

  const addProgressMutation = useMutation({
    mutationFn: ({ id, data }) => goalsService.addProgress(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setSelectedGoal(null) },
  })

  const { register: regGoal, handleSubmit: hsGoal, reset: resetGoal } = useForm()
  const { register: regProg, handleSubmit: hsProg, reset: resetProgram } = useForm()
  const { register: regProgress, handleSubmit: hsProgress, reset: resetProgress } = useForm()

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['goals', 'Objectifs'], ['programs', 'Programmes']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {label} {key === 'goals' ? `(${goals.length})` : `(${programs.length})`}
          </button>
        ))}
      </div>

      {tab === 'goals' && (
        <div className="space-y-4">
          {/* Formulaire objectif */}
          <form onSubmit={hsGoal(data => createGoalMutation.mutate({ ...data, targetDate: data.targetDate || undefined }))}
            className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-700">Assigner un objectif</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Employé</label>
                <select {...regGoal('employeeId', { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">Choisir…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <select {...regGoal('type', { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">Choisir…</option>
                  {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Titre</label>
                <input {...regGoal('title', { required: true })} placeholder="Ex: Perdre 5kg en 3 mois" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date cible (optionnel)</label>
                <input type="date" {...regGoal('targetDate')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description (optionnel)</label>
                <textarea {...regGoal('description')} rows={2} placeholder="Détails de l'objectif…" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
              </div>
            </div>
            <button type="submit" disabled={createGoalMutation.isPending} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createGoalMutation.isPending ? 'Création…' : 'Assigner'}
            </button>
          </form>

          {/* Liste objectifs */}
          <div className="space-y-3">
            {goals.length === 0 ? <p className="text-gray-400 text-sm">Aucun objectif assigné.</p> : goals.map(g => (
              <div key={g.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-800">{g.title}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GOAL_TYPE_COLORS[g.type]}`}>{GOAL_TYPE_LABELS[g.type]}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${GOAL_STATUS_COLORS[g.status]}`}>{GOAL_STATUS_LABELS[g.status]}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Pour : {g.employee.firstName} {g.employee.lastName}</p>
                    {g.description && <p className="text-sm text-gray-400 mt-1">{g.description}</p>}
                    {g.targetDate && <p className="text-xs text-gray-400 mt-1">Cible : {new Date(g.targetDate).toLocaleDateString('fr-FR')}</p>}
                    <p className="text-xs text-gray-400 mt-1">{g._count.progressLogs} entrée(s) de suivi · {g.program ? `Programme : ${g.program.title}` : 'Pas de programme'}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <select value={g.status} onChange={e => updateStatusMutation.mutate({ id: g.id, status: e.target.value })}
                      className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="ACTIVE">Actif</option>
                      <option value="COMPLETED">Terminé</option>
                      <option value="PAUSED">Pausé</option>
                    </select>
                    <button onClick={() => setSelectedGoal(selectedGoal?.id === g.id ? null : g)}
                      className="text-xs text-blue-600 hover:underline">Suivi</button>
                    <button onClick={() => { if (confirm('Supprimer cet objectif ?')) deleteGoalMutation.mutate(g.id) }}
                      className="text-xs text-red-500 hover:underline">Suppr.</button>
                  </div>
                </div>

                {/* Progress inline */}
                {selectedGoal?.id === g.id && (
                  <div className="mt-3 border-t pt-3">
                    <form onSubmit={hsProgress(data => { addProgressMutation.mutate({ id: g.id, data }); resetProgress() })}
                      className="flex gap-2">
                      <input {...regProgress('note', { required: true })} placeholder="Note de suivi…" className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                      <input type="number" step="0.1" {...regProgress('value', { valueAsNumber: true })} placeholder="Valeur (opt.)" className="w-28 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                      <button type="submit" disabled={addProgressMutation.isPending} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">Ajouter</button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'programs' && (
        <div className="space-y-4">
          {/* Formulaire programme */}
          <form onSubmit={hsProg(data => createProgramMutation.mutate({ ...data, goalId: data.goalId || undefined }))}
            className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-gray-700">Créer un programme</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Employé</label>
                <select {...regProg('employeeId', { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">Choisir…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Lier à un objectif (optionnel)</label>
                <select {...regProg('goalId')} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option value="">Aucun</option>
                  {goals.filter(g => !g.program).map(g => <option key={g.id} value={g.id}>{g.title} — {g.employee.firstName}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Titre</label>
                <input {...regProg('title', { required: true })} placeholder="Ex: Programme cardio 4 semaines" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Contenu (exercices, consignes…)</label>
                <textarea {...regProg('content', { required: true })} rows={5} placeholder="Semaine 1 : 3x30min cardio&#10;Semaine 2 : ..." className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono" />
              </div>
            </div>
            <button type="submit" disabled={createProgramMutation.isPending} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createProgramMutation.isPending ? 'Création…' : 'Créer'}
            </button>
          </form>

          {/* Liste programmes */}
          <div className="space-y-3">
            {programs.length === 0 ? <p className="text-gray-400 text-sm">Aucun programme créé.</p> : programs.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{p.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Pour : {p.employee.firstName} {p.employee.lastName}</p>
                    {p.goal && <p className="text-xs text-blue-600 mt-0.5">Objectif : {p.goal.title}</p>}
                    <p className="text-xs text-gray-400 mt-1">Créé le {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <button onClick={() => { if (confirm('Supprimer ce programme ?')) deleteProgramMutation.mutate(p.id) }}
                    className="text-xs text-red-500 hover:underline ml-3">Suppr.</button>
                </div>
                <pre className="mt-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">{p.content}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
