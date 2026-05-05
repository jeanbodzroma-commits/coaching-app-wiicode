import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../store/AuthContext'
import { historyService } from '../services/history.service'
import EmployeeHistory from '../components/history/EmployeeHistory'
import CoachHistory from '../components/history/CoachHistory'
import AdminHistory from '../components/history/AdminHistory'

export default function HistoryPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({ page: 1, type: '', attendance: '', from: '', to: '' })

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

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Historique</h2>
        {isFetching && !isLoading && <span className="text-xs text-gray-400">Mise à jour…</span>}
      </div>

      <FilterBar filters={filters} setFilter={setFilter} userRole={user?.role} data={data} />

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {user?.role === 'EMPLOYEE' && <EmployeeHistory data={data} />}
          {user?.role === 'COACH' && <CoachHistory data={data} />}
          {user?.role === 'ADMIN' && <AdminHistory data={data} setFilter={setFilter} />}

          {data?.pagination && data.pagination.totalPages > 1 && (
            <Pagination pagination={data.pagination} onPage={setPage} />
          )}
        </>
      )}
    </div>
  )
}

function FilterBar({ filters, setFilter, userRole, data }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
      <select value={filters.type} onChange={e => setFilter('type', e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Tous les types</option>
        <option value="SOLO">Solo</option>
        <option value="DUO">Duo</option>
      </select>

      {userRole === 'EMPLOYEE' && (
        <select value={filters.attendance} onChange={e => setFilter('attendance', e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes les présences</option>
          <option value="PRESENT">Présent</option>
          <option value="ABSENT">Absent</option>
          <option value="CANCELLED">Annulé</option>
          <option value="UNMARKED">Non marqué</option>
        </select>
      )}

      {(userRole === 'COACH' || userRole === 'ADMIN') && (
        <select value={filters.attendance} onChange={e => setFilter('attendance', e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Toutes les présences</option>
          <option value="PRESENT">Présents</option>
          <option value="ABSENT">Absents</option>
          <option value="UNMARKED">Non marqués</option>
        </select>
      )}

      <div className="flex items-center gap-2">
        <input type="date" value={filters.from} onChange={e => setFilter('from', e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-gray-400 text-sm">→</span>
        <input type="date" value={filters.to} onChange={e => setFilter('to', e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {(filters.type || filters.attendance || filters.from || filters.to) && (
        <button onClick={() => setFilter('type', '') || setFilter('attendance', '') || setFilter('from', '') || setFilter('to', '')}
          className="text-xs text-gray-400 hover:text-gray-600 underline">
          Réinitialiser
        </button>
      )}

      {data?.pagination && (
        <span className="ml-auto text-xs text-gray-400">{data.pagination.total} résultat(s)</span>
      )}
    </div>
  )
}

function Pagination({ pagination, onPage }) {
  const { page, totalPages } = pagination
  return (
    <div className="flex items-center justify-center gap-2">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">← Précédent</button>
      <span className="text-sm text-gray-500">{page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Suivant →</button>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  )
}

function cleanFilters(f) {
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v !== null))
}
