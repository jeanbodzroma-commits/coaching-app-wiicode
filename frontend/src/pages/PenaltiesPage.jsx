import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { penaltiesService } from '../services/penalties.service'

export default function PenaltiesPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['penalties'],
    queryFn: penaltiesService.getStrikes,
  })

  const unblockMutation = useMutation({
    mutationFn: (userId) => penaltiesService.unblock(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['penalties'] }),
  })

  const strikeMutation = useMutation({
    mutationFn: ({ userId, reason }) => penaltiesService.addStrike(userId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['penalties'] }),
  })

  const users = data?.users || []
  const config = data?.config || { strikeThreshold: 3, blockDays: 7 }
  const blocked = users.filter(u => u.isBlocked)
  const warned = users.filter(u => !u.isBlocked)

  if (isLoading) return <div className="p-6 text-gray-400">Chargement…</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pénalités</h2>
        <p className="text-gray-500 text-sm mt-1">
          Suspension automatique après <strong>{config.strikeThreshold} strikes</strong> — durée : <strong>{config.blockDays} jours</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard value={users.length} label="Employés avec strikes" color="amber" />
        <StatCard value={blocked.length} label="Comptes suspendus" color={blocked.length > 0 ? 'red' : 'gray'} />
        <StatCard value={warned.length} label="Avertissements actifs" color={warned.length > 0 ? 'orange' : 'gray'} />
      </div>

      {/* Comptes suspendus */}
      {blocked.length > 0 && (
        <Section title="Comptes suspendus" accent="red">
          {blocked.map(u => (
            <UserRow
              key={u.id}
              user={u}
              config={config}
              onUnblock={() => { if (confirm(`Débloquer ${u.firstName} ${u.lastName} et réinitialiser ses strikes ?`)) unblockMutation.mutate(u.id) }}
              onStrike={() => {
                const reason = prompt(`Raison du strike pour ${u.firstName} ${u.lastName} :`)
                if (reason) strikeMutation.mutate({ userId: u.id, reason })
              }}
              isPending={unblockMutation.isPending || strikeMutation.isPending}
            />
          ))}
        </Section>
      )}

      {/* Avertissements */}
      {warned.length > 0 && (
        <Section title="Avertissements actifs" accent="amber">
          {warned.map(u => (
            <UserRow
              key={u.id}
              user={u}
              config={config}
              onUnblock={() => { if (confirm(`Réinitialiser les strikes de ${u.firstName} ${u.lastName} ?`)) unblockMutation.mutate(u.id) }}
              onStrike={() => {
                const reason = prompt(`Raison du strike pour ${u.firstName} ${u.lastName} :`)
                if (reason) strikeMutation.mutate({ userId: u.id, reason })
              }}
              isPending={unblockMutation.isPending || strikeMutation.isPending}
            />
          ))}
        </Section>
      )}

      {users.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-green-700 font-medium">Aucune pénalité active</p>
          <p className="text-green-600 text-sm mt-1">Tous les employés ont un bilan propre.</p>
        </div>
      )}
    </div>
  )
}

function UserRow({ user: u, config, onUnblock, onStrike, isPending }) {
  const pct = Math.min((u.strikes / config.strikeThreshold) * 100, 100)
  const blockedUntilStr = u.blockedUntil
    ? new Date(u.blockedUntil).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-800">{u.firstName} {u.lastName}</p>
          {u.isBlocked && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Suspendu</span>
          )}
          {u.blockExpired && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Expirée</span>
          )}
        </div>
        <p className="text-xs text-gray-400">{u.email}</p>
        {blockedUntilStr && u.isBlocked && (
          <p className="text-xs text-red-500 mt-0.5">Suspendu jusqu'au {blockedUntilStr}</p>
        )}

        {/* Barre de strikes */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: config.strikeThreshold }).map((_, i) => (
              <span
                key={i}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < u.strikes ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-300'
                }`}
              >
                ✕
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500">{u.strikes}/{config.strikeThreshold} strikes</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onStrike}
          disabled={isPending}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          + Strike
        </button>
        <button
          onClick={onUnblock}
          disabled={isPending}
          className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {u.isBlocked ? 'Débloquer' : 'Réinitialiser'}
        </button>
      </div>
    </div>
  )
}

function Section({ title, accent, children }) {
  const colors = { red: 'border-red-200 bg-red-50/30', amber: 'border-amber-200 bg-amber-50/30' }
  const titleColors = { red: 'text-red-700', amber: 'text-amber-700' }
  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden border ${colors[accent]}`}>
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className={`font-semibold ${titleColors[accent]}`}>{title}</h3>
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}

function StatCard({ value, label, color }) {
  const colors = { amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', orange: 'bg-orange-50 text-orange-700', gray: 'bg-gray-50 text-gray-600' }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80">{label}</p>
    </div>
  )
}
