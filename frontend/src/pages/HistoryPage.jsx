import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { historyService } from '../services/history.service'
import { Card, Button, Select, Input, Skeleton } from '../components/ui'
import EmployeeHistory from '../components/history/EmployeeHistory'
import CoachHistory from '../components/history/CoachHistory'
import AdminHistory from '../components/history/AdminHistory'

const initialFilters = { page: 1, type: '', attendance: '', from: '', to: '', coachId: '' }

export default function HistoryPage() {
  const { user } = useAuth()
  const reduced = useReducedMotion()
  const [filters, setFilters] = useState(initialFilters)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['history', filters],
    queryFn: () => historyService.get(cleanFilters(filters)),
    keepPreviousData: true,
  })

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value, page: 1 }))
  }
  function setPage(page) {
    setFilters(f => ({ ...f, page }))
  }
  function reset() {
    setFilters(initialFilters)
  }

  const hasFilters = filters.type || filters.attendance || filters.from || filters.to || filters.coachId

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-ink-500">Historique</p>
          <h1 className="mt-1 font-display text-display-lg text-ink-900 lg:text-display-lg-md">Sessions passées</h1>
        </div>
        {isFetching && !isLoading && <span className="text-caption text-ink-500">Mise à jour…</span>}
      </header>

      {/* Sticky filter bar */}
      <Card padding="sm" className="sticky top-0 z-10 flex flex-wrap items-center gap-2 !p-3 lg:top-14">
        <span className="inline-flex items-center gap-1 text-caption text-ink-500">
          <Filter className="h-3.5 w-3.5" strokeWidth={1.75} /> Filtres
        </span>
        <Select aria-label="Type" value={filters.type} onChange={e => setFilter('type', e.target.value)} className="!min-w-[8.5rem]">
          <option value="">Tous types</option>
          <option value="SOLO">Solo</option>
          <option value="DUO">Duo</option>
        </Select>
        <Select aria-label="Présence" value={filters.attendance} onChange={e => setFilter('attendance', e.target.value)} className="!min-w-[12rem]">
          <option value="">Toutes présences</option>
          <option value="PRESENT">Présent</option>
          <option value="ABSENT">Absent</option>
          <option value="CANCELLED">Annulé</option>
          <option value="UNMARKED">Non marqué</option>
        </Select>
        <Input type="date" aria-label="Du" value={filters.from} onChange={e => setFilter('from', e.target.value)} className="!min-w-[10rem]" />
        <Input type="date" aria-label="Au" value={filters.to}   onChange={e => setFilter('to', e.target.value)}   className="!min-w-[10rem]" />
        {hasFilters && (
          <Button size="sm" variant="ghost" onClick={reset} leftIcon={<X className="h-3.5 w-3.5" strokeWidth={1.75} />}>Réinitialiser</Button>
        )}
        {data?.pagination && (
          <span className="ml-auto text-caption text-ink-500">{data.pagination.total} résultat(s)</span>
        )}
      </Card>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={filters.page}
            initial={reduced ? false : { opacity: 0, x: 6 }}
            animate={reduced ? undefined : { opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: -6 }}
            transition={{ duration: 0.18 }}
          >
            {user?.role === 'EMPLOYEE' && <EmployeeHistory data={data} />}
            {user?.role === 'COACH'    && <CoachHistory    data={data} />}
            {user?.role === 'ADMIN'    && <AdminHistory    data={data} setFilter={setFilter} />}
          </motion.div>
        </AnimatePresence>
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="ghost" disabled={data.pagination.page <= 1} onClick={() => setPage(data.pagination.page - 1)} leftIcon={<ChevronLeft className="h-4 w-4" strokeWidth={1.75} />}>
            Précédent
          </Button>
          <span className="text-body text-ink-500">{data.pagination.page} / {data.pagination.totalPages}</span>
          <Button size="sm" variant="ghost" disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => setPage(data.pagination.page + 1)} rightIcon={<ChevronRight className="h-4 w-4" strokeWidth={1.75} />}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}

function cleanFilters(f) {
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v !== null))
}
