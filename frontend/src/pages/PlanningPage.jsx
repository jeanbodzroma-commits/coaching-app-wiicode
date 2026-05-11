import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, CalendarRange, List, Search } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { sessionsService } from '../services/sessions.service'
import { reservationsService } from '../services/reservations.service'
import { Card, Button, Badge, Skeleton, useToast } from '../components/ui'
import WeekCalendar from '../components/planning/WeekCalendar'
import SessionListView from '../components/planning/SessionListView'
import CreateSessionModal from '../components/planning/CreateSessionModal'

const FILTER_TYPES = [
  { value: 'all',  label: 'Tous' },
  { value: 'SOLO', label: 'Solo' },
  { value: 'DUO',  label: 'Duo' },
]

export default function PlanningPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const toast = useToast()
  const canCreate = ['COACH', 'ADMIN'].includes(user?.role)
  const canReserve = ['EMPLOYEE', 'ADMIN'].includes(user?.role)

  const [anchor, setAnchor] = useState(() => new Date())
  const [view, setView] = useState('week')   // 'week' (desktop default) | 'list'
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsService.getAll,
  })

  const { data: myReservations = [] } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: reservationsService.getMine,
    enabled: !!user,
  })

  const reservedIds = useMemo(
    () => myReservations.filter(r => r.status !== 'CANCELLED').map(r => r.sessionId),
    [myReservations]
  )

  const filtered = useMemo(() => {
    return sessions.filter(s => typeFilter === 'all' || s.type === typeFilter)
  }, [sessions, typeFilter])

  const futureFiltered = useMemo(
    () => filtered.filter(s => new Date(s.date) >= startOfDay(new Date())).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [filtered]
  )

  const reserveMutation = useMutation({
    mutationFn: sessionId => reservationsService.create(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      qc.invalidateQueries({ queryKey: ['my-reservations'] })
      toast.success('Réservation confirmée')
    },
    onError: (err) => toast.error('Réservation impossible', err.response?.data?.message ?? 'Erreur inconnue'),
  })

  const createMutation = useMutation({
    mutationFn: sessionsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      setShowCreate(false)
      toast.success('Créneau créé')
    },
    onError: (err) => toast.error('Création impossible', err.response?.data?.message ?? 'Erreur inconnue'),
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-ink-500">Planning</p>
          <h1 className="mt-1 font-display text-display-lg text-ink-900 lg:text-display-lg-md">Les créneaux</h1>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={() => setShowCreate(true)} leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}>
            Nouveau créneau
          </Button>
        )}
      </header>

      {/* Filters */}
      <Card padding="sm" className="flex flex-wrap items-center gap-3 !p-3">
        <span className="inline-flex items-center gap-1 text-caption text-ink-500">
          <Search className="h-3.5 w-3.5" strokeWidth={1.75} /> Filtre
        </span>
        <div className="flex gap-1 rounded-full bg-ink-50 p-1">
          {FILTER_TYPES.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={`rounded-full px-3 py-1 text-caption font-medium transition-colors ${
                typeFilter === f.value ? 'bg-surface text-primary-700 shadow-soft' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-ink-50 p-1">
          <ViewToggleButton active={view === 'week'} onClick={() => setView('week')} icon={<CalendarRange className="h-3.5 w-3.5" />} label="Semaine" />
          <ViewToggleButton active={view === 'list'} onClick={() => setView('list')} icon={<List className="h-3.5 w-3.5" />} label="Liste" />
        </span>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3"><Skeleton className="h-72" /></div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Desktop week calendar (only when view=week) */}
            {view === 'week' && (
              <div className="hidden lg:block">
                <WeekCalendar
                  anchor={anchor}
                  onAnchorChange={setAnchor}
                  sessions={filtered}
                  reservedSessionIds={reservedIds}
                />
              </div>
            )}
            {/* List view (always visible on mobile, only when view=list on desktop) */}
            <div className={view === 'week' ? 'lg:hidden' : ''}>
              <Card padding="md">
                <h3 className="mb-4 font-heading text-h3 font-semibold text-ink-900">À venir</h3>
                <SessionListView
                  sessions={futureFiltered}
                  reservedSessionIds={reservedIds}
                  canReserve={canReserve}
                  onReserve={(id) => reserveMutation.mutate(id)}
                  isPending={reserveMutation.isPending}
                />
              </Card>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Mobile FAB */}
      {canCreate && (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          aria-label="Nouveau créneau"
          className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-700 text-white shadow-elevated transition-colors duration-300 hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 lg:hidden"
        >
          <Plus className="h-6 w-6" strokeWidth={2} />
        </button>
      )}

      <CreateSessionModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        isPending={createMutation.isPending}
      />
    </div>
  )
}

function ViewToggleButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-caption font-medium transition-colors ${
        active ? 'bg-surface text-primary-700 shadow-soft' : 'text-ink-500 hover:text-ink-700'
      }`}
    >
      {icon}<span>{label}</span>
    </button>
  )
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
