import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Target, FileText, Trash2 } from 'lucide-react'
import { goalsService, programsService } from '../../services/goals.service'
import { usersService } from '../../services/users.service'
import { Card, Button, Input, Textarea, Select, Badge, Modal, useToast } from '../ui'
import { GOAL_TYPE_LABELS, GOAL_TYPE_COLORS, GOAL_STATUS_LABELS, GOAL_STATUS_COLORS } from '../../utils/goals'

export default function CoachPrograms() {
  const qc = useQueryClient()
  const toast = useToast()
  const [tab, setTab] = useState('goals')
  const [selectedId, setSelectedId] = useState(null)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showProgramForm, setShowProgramForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // { kind: 'goal'|'program', item }

  const { data: goals = [] } = useQuery({ queryKey: ['goals'], queryFn: goalsService.getAll })
  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: programsService.getAll })
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: usersService.getAll })
  const employees = users.filter(u => u.role === 'EMPLOYEE' && u.isActive)

  const goalMutation = useMutation({
    mutationFn: goalsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setShowGoalForm(false); toast.success('Objectif créé') },
    onError: (err) => toast.error('Création impossible', err.response?.data?.message ?? 'Erreur'),
  })
  const programMutation = useMutation({
    mutationFn: programsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programs'] }); setShowProgramForm(false); toast.success('Programme créé') },
    onError: (err) => toast.error('Création impossible', err.response?.data?.message ?? 'Erreur'),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => goalsService.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
  const deleteGoalMutation = useMutation({
    mutationFn: goalsService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setSelectedId(null); setConfirmDelete(null); toast.success('Objectif supprimé') },
  })
  const deleteProgramMutation = useMutation({
    mutationFn: programsService.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programs'] }); setSelectedId(null); setConfirmDelete(null); toast.success('Programme supprimé') },
  })
  const progressMutation = useMutation({
    mutationFn: ({ id, data }) => goalsService.addProgress(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); toast.success('Suivi ajouté') },
  })

  const items = tab === 'goals' ? goals : programs
  const selected = items.find(i => i.id === selectedId) ?? items[0] ?? null

  return (
    <div className="space-y-5">
      {/* Tabs + CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 rounded-full bg-ink-50 p-1">
          {[['goals', 'Objectifs', goals.length], ['programs', 'Programmes', programs.length]].map(([k, lab, n]) => (
            <button
              key={k}
              type="button"
              onClick={() => { setTab(k); setSelectedId(null) }}
              className={`rounded-full px-4 py-1.5 text-body font-medium transition-colors ${tab === k ? 'bg-surface text-primary-700 shadow-soft' : 'text-ink-500 hover:text-ink-700'}`}
            >
              {lab} <span className="ml-1 text-caption text-ink-500">{n}</span>
            </button>
          ))}
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
          onClick={() => tab === 'goals' ? setShowGoalForm(true) : setShowProgramForm(true)}
        >
          {tab === 'goals' ? 'Nouvel objectif' : 'Nouveau programme'}
        </Button>
      </div>

      {/* Split-view */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* List */}
        <Card padding="none" className="lg:col-span-5 overflow-hidden">
          {items.length === 0 ? (
            <p className="p-6 text-center text-body text-ink-500">
              {tab === 'goals' ? 'Aucun objectif.' : 'Aucun programme.'}
            </p>
          ) : (
            <ul className="max-h-[28rem] overflow-y-auto divide-y divide-ink-200/60">
              {items.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${selected?.id === item.id ? 'bg-primary-50' : 'hover:bg-ink-50'}`}
                  >
                    <p className="text-body font-medium text-ink-900">{item.title}</p>
                    <p className="text-caption text-ink-500">
                      Pour {item.employee.firstName} {item.employee.lastName}
                    </p>
                    {tab === 'goals' && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className={`text-caption font-semibold px-2 py-0.5 rounded-full ${GOAL_TYPE_COLORS[item.type]}`}>{GOAL_TYPE_LABELS[item.type]}</span>
                        <span className={`text-caption font-semibold px-2 py-0.5 rounded-full ${GOAL_STATUS_COLORS[item.status]}`}>{GOAL_STATUS_LABELS[item.status]}</span>
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Detail with crossfade */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={`${tab}-${selected.id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {tab === 'goals'
                  ? <GoalDetail
                      goal={selected}
                      onStatus={(status) => statusMutation.mutate({ id: selected.id, status })}
                      onDelete={() => setConfirmDelete({ kind: 'goal', item: selected })}
                      onProgress={(data) => progressMutation.mutate({ id: selected.id, data })}
                      isProgressPending={progressMutation.isPending}
                    />
                  : <ProgramDetail
                      program={selected}
                      onDelete={() => setConfirmDelete({ kind: 'program', item: selected })}
                    />
                }
              </motion.div>
            ) : (
              <Card padding="lg" className="text-center text-ink-500">
                <Target className="mx-auto h-10 w-10 text-ink-200" strokeWidth={1.5} />
                <p className="mt-2 text-body">Sélectionne un {tab === 'goals' ? 'objectif' : 'programme'} dans la liste.</p>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>

      <GoalFormModal
        open={showGoalForm}
        onClose={() => setShowGoalForm(false)}
        employees={employees}
        onSubmit={(payload) => goalMutation.mutate(payload)}
        isPending={goalMutation.isPending}
      />
      <ProgramFormModal
        open={showProgramForm}
        onClose={() => setShowProgramForm(false)}
        employees={employees}
        goals={goals.filter(g => !g.program)}
        onSubmit={(payload) => programMutation.mutate(payload)}
        isPending={programMutation.isPending}
      />
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={confirmDelete?.kind === 'goal' ? 'Supprimer cet objectif ?' : 'Supprimer ce programme ?'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Annuler</Button>
            <Button
              variant="danger"
              loading={deleteGoalMutation.isPending || deleteProgramMutation.isPending}
              onClick={() => confirmDelete?.kind === 'goal'
                ? deleteGoalMutation.mutate(confirmDelete.item.id)
                : deleteProgramMutation.mutate(confirmDelete.item.id)}
            >
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-body text-ink-500">
          {confirmDelete?.kind === 'goal'
            ? `« ${confirmDelete?.item.title} » sera supprimé définitivement.`
            : `« ${confirmDelete?.item.title} » sera supprimé définitivement.`}
        </p>
      </Modal>
    </div>
  )
}

function GoalDetail({ goal: g, onStatus, onDelete, onProgress, isProgressPending }) {
  const { register, handleSubmit, reset } = useForm()
  return (
    <Card padding="md" className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-caption font-semibold px-2 py-0.5 rounded-full ${GOAL_TYPE_COLORS[g.type]}`}>{GOAL_TYPE_LABELS[g.type]}</span>
            <Badge variant="neutral">{g.employee.firstName} {g.employee.lastName}</Badge>
          </div>
          <h2 className="mt-2 font-heading text-h2 font-semibold text-ink-900">{g.title}</h2>
          {g.description && <p className="mt-1 text-body text-ink-500">{g.description}</p>}
          {g.targetDate && <p className="mt-2 text-caption text-ink-500">Cible : {new Date(g.targetDate).toLocaleDateString('fr-FR')}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Select aria-label="Statut" value={g.status} onChange={e => onStatus(e.target.value)} className="!min-w-[10rem]">
            <option value="ACTIVE">Actif</option>
            <option value="COMPLETED">Terminé</option>
            <option value="PAUSED">Pausé</option>
          </Select>
          <Button size="sm" variant="ghost" onClick={onDelete} leftIcon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />}>
            Supprimer
          </Button>
        </div>
      </header>

      <hr className="border-ink-200" />

      <section>
        <h3 className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-500">Ajouter un suivi</h3>
        <form onSubmit={handleSubmit(d => { onProgress(d); reset() })} className="flex flex-col gap-2 sm:flex-row">
          <Input className="flex-1" placeholder="Note de suivi…" {...register('note', { required: true })} />
          <Input className="sm:w-32" type="number" step="0.1" placeholder="Valeur" {...register('value', { valueAsNumber: true })} />
          <Button type="submit" variant="primary" loading={isProgressPending}>Ajouter</Button>
        </form>
        <p className="mt-2 text-caption text-ink-500">{g._count?.progressLogs ?? 0} suivi(s) enregistré(s)</p>
      </section>
    </Card>
  )
}

function ProgramDetail({ program: p, onDelete }) {
  return (
    <Card padding="md" className="space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="neutral">{p.employee.firstName} {p.employee.lastName}</Badge>
          <h2 className="mt-2 font-heading text-h2 font-semibold text-ink-900">{p.title}</h2>
          {p.goal && <p className="mt-1 text-caption text-primary-700">Objectif : {p.goal.title}</p>}
          <p className="mt-1 text-caption text-ink-500">Créé le {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onDelete} leftIcon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />}>
          Supprimer
        </Button>
      </header>
      <pre className="whitespace-pre-wrap rounded-xl bg-ink-50 p-4 font-mono text-body text-ink-700 max-h-96 overflow-y-auto">{p.content}</pre>
    </Card>
  )
}

function GoalFormModal({ open, onClose, employees, onSubmit, isPending }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  async function submit(d) { await onSubmit({ ...d, targetDate: d.targetDate || undefined }); reset() }
  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Assigner un objectif"
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose() }}>Annuler</Button>
          <Button type="submit" form="goal-form" variant="primary" loading={isPending}>Assigner</Button>
        </>
      }
    >
      <form id="goal-form" onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="Employé" error={errors.employeeId?.message} {...register('employeeId', { required: 'Employé requis' })}>
          <option value="">Choisir…</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </Select>
        <Select label="Type" {...register('type', { required: true })}>
          <option value="">Choisir…</option>
          {Object.entries(GOAL_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input className="sm:col-span-2" label="Titre" placeholder="Ex : Perdre 5 kg en 3 mois" {...register('title', { required: true })} />
        <Input type="date" label="Date cible (optionnel)" {...register('targetDate')} />
        <Textarea className="sm:col-span-2" label="Description" rows={3} {...register('description')} />
      </form>
    </Modal>
  )
}

function ProgramFormModal({ open, onClose, employees, goals, onSubmit, isPending }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  async function submit(d) { await onSubmit({ ...d, goalId: d.goalId || undefined }); reset() }
  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Créer un programme"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose() }}>Annuler</Button>
          <Button type="submit" form="prog-form" variant="primary" loading={isPending}>Créer</Button>
        </>
      }
    >
      <form id="prog-form" onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="Employé" error={errors.employeeId?.message} {...register('employeeId', { required: 'Employé requis' })}>
          <option value="">Choisir…</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </Select>
        <Select label="Lier à un objectif (optionnel)" {...register('goalId')}>
          <option value="">Aucun</option>
          {goals.map(g => <option key={g.id} value={g.id}>{g.title} — {g.employee.firstName}</option>)}
        </Select>
        <Input className="sm:col-span-2" label="Titre" placeholder="Ex : Programme cardio 4 semaines" {...register('title', { required: true })} />
        <Textarea className="sm:col-span-2 font-mono" label="Contenu" rows={6} placeholder={'Semaine 1 : 3×30 min cardio\nSemaine 2 : …'} {...register('content', { required: true })} />
      </form>
    </Modal>
  )
}
