import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import { Target, FileText, Sparkles } from 'lucide-react'
import { goalsService, programsService } from '../../services/goals.service'
import { Card, Button, Input, Badge, Skeleton, useToast } from '../ui'
import { GOAL_TYPE_LABELS, GOAL_TYPE_COLORS, GOAL_STATUS_LABELS, GOAL_STATUS_COLORS } from '../../utils/goals'

export default function EmployeePrograms() {
  const qc = useQueryClient()
  const toast = useToast()
  const [tab, setTab] = useState('goals')
  const [selectedId, setSelectedId] = useState(null)

  const { data: goals = [], isLoading: loadingGoals } = useQuery({ queryKey: ['goals'], queryFn: goalsService.getAll })
  const { data: programs = [], isLoading: loadingPrograms } = useQuery({ queryKey: ['programs'], queryFn: programsService.getAll })

  const progressMutation = useMutation({
    mutationFn: ({ id, data }) => goalsService.addProgress(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); toast.success('Suivi ajouté') },
  })

  const items = tab === 'goals' ? goals : programs
  const selected = items.find(i => i.id === selectedId) ?? items[0] ?? null
  const loading = tab === 'goals' ? loadingGoals : loadingPrograms

  return (
    <div className="space-y-5">
      <div className="inline-flex gap-1 rounded-full bg-ink-50 p-1">
        {[['goals', 'Mes objectifs', goals.length], ['programs', 'Mes programmes', programs.length]].map(([k, lab, n]) => (
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

      {loading ? (
        <Skeleton className="h-72" />
      ) : items.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Sparkles className="mx-auto h-10 w-10 text-accent-400" strokeWidth={1.5} />
          <p className="mt-2 font-heading text-h3 font-semibold text-ink-900">
            {tab === 'goals' ? 'Aucun objectif assigné' : 'Aucun programme assigné'}
          </p>
          <p className="mt-1 text-body text-ink-500">
            Ton coach t'en assignera prochainement.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* List */}
          <Card padding="none" className="lg:col-span-5 overflow-hidden">
            <ul className="max-h-[28rem] overflow-y-auto divide-y divide-ink-200/60">
              {items.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${selected?.id === item.id ? 'bg-primary-50' : 'hover:bg-ink-50'}`}
                  >
                    <p className="text-body font-medium text-ink-900">{item.title}</p>
                    {tab === 'goals' && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <span className={`text-caption font-semibold px-2 py-0.5 rounded-full ${GOAL_TYPE_COLORS[item.type]}`}>{GOAL_TYPE_LABELS[item.type]}</span>
                        <span className={`text-caption font-semibold px-2 py-0.5 rounded-full ${GOAL_STATUS_COLORS[item.status]}`}>{GOAL_STATUS_LABELS[item.status]}</span>
                      </div>
                    )}
                    {tab === 'programs' && (
                      <p className="text-caption text-ink-500 mt-0.5">Coach {item.coach.firstName} {item.coach.lastName}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Detail */}
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
                        onProgress={(data) => progressMutation.mutate({ id: selected.id, data })}
                        isProgressPending={progressMutation.isPending}
                      />
                    : <ProgramDetail program={selected} />
                  }
                </motion.div>
              ) : (
                <Card padding="lg" className="text-center text-ink-500">
                  <Target className="mx-auto h-10 w-10 text-ink-200" strokeWidth={1.5} />
                  <p className="mt-2 text-body">Sélectionne un {tab === 'goals' ? 'objectif' : 'programme'}.</p>
                </Card>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

function GoalDetail({ goal: g, onProgress, isProgressPending }) {
  const { register, handleSubmit, reset } = useForm()
  const logsCount = g._count?.progressLogs ?? 0
  const intensity = Math.min(100, logsCount * 20)

  return (
    <Card padding="md" className="space-y-4">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-caption font-semibold px-2 py-0.5 rounded-full ${GOAL_TYPE_COLORS[g.type]}`}>{GOAL_TYPE_LABELS[g.type]}</span>
          <Badge variant="neutral">{GOAL_STATUS_LABELS[g.status]}</Badge>
        </div>
        <h2 className="mt-2 font-heading text-h2 font-semibold text-ink-900">{g.title}</h2>
        {g.description && <p className="mt-1 text-body text-ink-500">{g.description}</p>}
        {g.targetDate && <p className="mt-2 text-caption text-ink-500">Cible : {new Date(g.targetDate).toLocaleDateString('fr-FR')}</p>}
      </header>

      <div>
        <div className="mb-1 flex items-center justify-between text-caption text-ink-500">
          <span>Intensité du suivi</span>
          <span>{logsCount} entrée(s)</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${intensity}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="h-full bg-gradient-to-r from-accent-400 to-accent-500"
          />
        </div>
      </div>

      {g.status === 'ACTIVE' && (
        <section>
          <h3 className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-500">Ajouter un suivi</h3>
          <form onSubmit={handleSubmit(d => { onProgress(d); reset() })} className="flex flex-col gap-2 sm:flex-row">
            <Input className="flex-1" placeholder="Note de progression…" {...register('note', { required: true })} />
            <Input className="sm:w-32" type="number" step="0.1" placeholder="Valeur" {...register('value', { valueAsNumber: true })} />
            <Button type="submit" variant="primary" loading={isProgressPending}>Ajouter</Button>
          </form>
        </section>
      )}
    </Card>
  )
}

function ProgramDetail({ program: p }) {
  return (
    <Card padding="md" className="space-y-3">
      <header>
        <h2 className="font-heading text-h2 font-semibold text-ink-900">{p.title}</h2>
        <p className="mt-1 text-caption text-ink-500">
          <FileText className="mr-1 inline h-3.5 w-3.5 align-[-2px]" strokeWidth={1.75} />
          Coach {p.coach.firstName} {p.coach.lastName} · Créé le {new Date(p.createdAt).toLocaleDateString('fr-FR')}
        </p>
        {p.goal && (
          <p className="mt-1 text-caption text-primary-700">
            Lié à l'objectif « {p.goal.title} »
          </p>
        )}
      </header>
      <pre className="whitespace-pre-wrap rounded-xl bg-ink-50 p-4 font-mono text-body text-ink-700 max-h-[28rem] overflow-y-auto leading-relaxed">{p.content}</pre>
    </Card>
  )
}
