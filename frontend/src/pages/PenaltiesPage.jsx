import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldAlert, ShieldCheck, Plus, X } from 'lucide-react'
import { penaltiesService } from '../services/penalties.service'
import { Card, Button, Badge, Avatar, Modal, Skeleton, useToast } from '../components/ui'
import { StatCard } from '../components/dashboard'
import StrikeModal from '../components/penalties/StrikeModal'
import { cn } from '../utils/cn'

export default function PenaltiesPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const reduced = useReducedMotion()

  const [strikeTarget, setStrikeTarget] = useState(null)
  const [unblockTarget, setUnblockTarget] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['penalties'],
    queryFn: penaltiesService.getStrikes,
  })

  const unblockMutation = useMutation({
    mutationFn: (userId) => penaltiesService.unblock(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['penalties'] })
      setUnblockTarget(null)
      toast.success('Compte débloqué')
    },
    onError: (err) => toast.error('Action impossible', err.response?.data?.message ?? 'Erreur'),
  })

  const strikeMutation = useMutation({
    mutationFn: ({ userId, reason }) => penaltiesService.addStrike(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['penalties'] })
      setStrikeTarget(null)
      toast.success('Strike ajouté')
    },
    onError: (err) => toast.error('Action impossible', err.response?.data?.message ?? 'Erreur'),
  })

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">{[0, 1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-40" />
      </div>
    )
  }

  const users = data?.users ?? []
  const config = data?.config ?? { strikeThreshold: 3, blockDays: 7 }
  const blocked = users.filter(u => u.isBlocked)
  const warned = users.filter(u => !u.isBlocked)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header>
        <p className="text-caption font-medium uppercase tracking-wide text-ink-500">Administration</p>
        <h1 className="mt-1 font-display text-display-lg text-ink-900 lg:text-display-lg-md">Pénalités</h1>
        <p className="mt-2 text-body text-ink-500">
          Suspension automatique après <strong className="text-ink-900">{config.strikeThreshold} strikes</strong> · durée <strong className="text-ink-900">{config.blockDays} jours</strong>.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard tone="warning" value={users.length} label="Employés à strikes" icon={<ShieldAlert className="h-5 w-5" strokeWidth={1.75} />} />
        <StatCard tone={blocked.length ? 'danger' : 'neutral'} value={blocked.length} label="Comptes suspendus" icon={<ShieldAlert className="h-5 w-5" strokeWidth={1.75} />} />
        <StatCard tone={warned.length ? 'accent' : 'neutral'} value={warned.length} label="Avertissements" />
      </div>

      {users.length === 0 ? (
        <Card padding="lg" className="bg-green-50/40 border border-success-500/20">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-success-500" strokeWidth={1.75} />
            <div>
              <p className="font-heading text-h3 font-semibold text-ink-900">Aucune pénalité active</p>
              <p className="text-body text-ink-500">Tous les employés ont un bilan propre.</p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {blocked.length > 0 && (
            <Section title="Comptes suspendus" accent="danger">
              <UserList
                users={blocked}
                config={config}
                reduced={reduced}
                onStrike={setStrikeTarget}
                onUnblock={setUnblockTarget}
              />
            </Section>
          )}
          {warned.length > 0 && (
            <Section title="Avertissements actifs" accent="warning">
              <UserList
                users={warned}
                config={config}
                reduced={reduced}
                onStrike={setStrikeTarget}
                onUnblock={setUnblockTarget}
              />
            </Section>
          )}
        </>
      )}

      <StrikeModal
        user={strikeTarget}
        onClose={() => setStrikeTarget(null)}
        onSubmit={(reason) => strikeMutation.mutate({ userId: strikeTarget.id, reason })}
        isPending={strikeMutation.isPending}
      />

      <Modal
        open={!!unblockTarget}
        onClose={() => setUnblockTarget(null)}
        title={unblockTarget?.isBlocked ? 'Débloquer ce compte ?' : 'Réinitialiser les strikes ?'}
        description="Les strikes seront remis à 0 et la suspension levée. La personne sera notifiée."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUnblockTarget(null)}>Annuler</Button>
            <Button variant="primary" loading={unblockMutation.isPending} onClick={() => unblockMutation.mutate(unblockTarget.id)}>
              Confirmer
            </Button>
          </>
        }
      >
        {unblockTarget && (
          <p className="text-body text-ink-500">
            <strong className="text-ink-900">{unblockTarget.firstName} {unblockTarget.lastName}</strong> · {unblockTarget.strikes} strike(s).
          </p>
        )}
      </Modal>
    </div>
  )
}

function Section({ title, accent, children }) {
  const ring = accent === 'danger' ? 'border-danger-500/20 bg-red-50/30' : 'border-warning-500/20 bg-amber-50/20'
  const tone = accent === 'danger' ? 'text-danger-500' : 'text-warning-500'
  return (
    <Card padding="none" className={cn('overflow-hidden border', ring)}>
      <header className="px-5 py-3 border-b border-ink-200/60">
        <h2 className={cn('font-heading text-h3 font-semibold', tone)}>{title}</h2>
      </header>
      <div className="p-2">{children}</div>
    </Card>
  )
}

function UserList({ users, config, reduced, onStrike, onUnblock }) {
  return (
    <motion.ul
      initial={reduced ? false : 'hidden'}
      animate="visible"
      variants={reduced ? {} : { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
      className="flex flex-col gap-1"
    >
      {users.map(u => (
        <motion.li key={u.id} variants={reduced ? {} : { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}>
          <UserRow user={u} config={config} onStrike={() => onStrike(u)} onUnblock={() => onUnblock(u)} />
        </motion.li>
      ))}
    </motion.ul>
  )
}

function UserRow({ user: u, config, onStrike, onUnblock }) {
  const blockedUntilStr = u.blockedUntil
    ? new Date(u.blockedUntil).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl p-3 hover:bg-surface transition-colors">
      <Avatar size="md" name={`${u.firstName} ${u.lastName}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-body font-medium text-ink-900">{u.firstName} {u.lastName}</p>
          {u.isBlocked && <Badge variant="danger">Suspendu</Badge>}
          {u.blockExpired && <Badge variant="neutral">Expirée</Badge>}
        </div>
        <p className="text-caption text-ink-500">{u.email}</p>
        {blockedUntilStr && u.isBlocked && (
          <p className="mt-0.5 text-caption text-danger-500">Suspendu jusqu'au {blockedUntilStr}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex gap-1" aria-label={`${u.strikes} sur ${config.strikeThreshold} strikes`}>
            {Array.from({ length: config.strikeThreshold }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-caption font-bold transition-colors',
                  i < u.strikes ? 'bg-danger-500 text-white' : 'bg-ink-200 text-ink-200/0'
                )}
                aria-hidden="true"
              >
                ✕
              </span>
            ))}
          </div>
          <span className="text-caption text-ink-500">{u.strikes}/{config.strikeThreshold} strikes</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onStrike} leftIcon={<Plus className="h-3.5 w-3.5" strokeWidth={2} />}>
          Strike
        </Button>
        <Button size="sm" variant={u.isBlocked ? 'primary' : 'ghost'} onClick={onUnblock}>
          {u.isBlocked ? 'Débloquer' : 'Réinitialiser'}
        </Button>
      </div>
    </div>
  )
}
