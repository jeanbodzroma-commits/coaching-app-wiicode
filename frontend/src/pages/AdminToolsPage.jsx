import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Wrench, Trash2, Sprout, AlertTriangle } from 'lucide-react'
import { adminService } from '../services/admin.service'
import { Card, Button, Modal, useToast } from '../components/ui'

const CONFIRM_PHRASE = 'RESET'

export default function AdminToolsPage() {
  const qc = useQueryClient()
  const toast = useToast()

  const [resetOpen, setResetOpen] = useState(false)
  const [seedOpen, setSeedOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const resetMutation = useMutation({
    mutationFn: adminService.reset,
    onSuccess: (data) => {
      qc.invalidateQueries()
      setResetOpen(false)
      setConfirmText('')
      const d = data?.deleted ?? {}
      toast.success(
        'Base réinitialisée',
        `${d.users ?? 0} utilisateurs · ${d.sessions ?? 0} sessions · ${d.reservations ?? 0} réservations supprimés.`
      )
    },
    onError: (err) =>
      toast.error('Reset impossible', err.response?.data?.message ?? 'Erreur serveur'),
  })

  const seedMutation = useMutation({
    mutationFn: adminService.seed,
    onSuccess: () => {
      qc.invalidateQueries()
      setSeedOpen(false)
      toast.success('Seed exécuté', 'Comptes démo et données factices créés.')
    },
    onError: (err) =>
      toast.error('Seed impossible', err.response?.data?.message ?? 'Erreur serveur'),
  })

  const resetReady = confirmText.trim().toUpperCase() === CONFIRM_PHRASE

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header>
        <p className="text-caption font-medium uppercase tracking-wide text-ink-500">Administration</p>
        <h1 className="mt-1 font-display text-display-lg text-ink-900 lg:text-display-lg-md">Outils système</h1>
        <p className="mt-2 max-w-2xl text-body text-ink-500">
          Actions de maintenance sur la base de données. Réservé à l'administrateur — usage prudent.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* === Carte SEED === */}
        <Card padding="lg" className="flex flex-col gap-4 border border-primary-100 bg-primary-50/40">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <Sprout className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-h3 font-semibold text-ink-900">Seeder la base</h2>
              <p className="mt-1 text-body text-ink-500">
                Crée les 3 comptes canoniques (admin / coach / employé) puis le jeu de démo : 2 coachs supplémentaires, 12 employés, sessions sur ±90 jours, réservations, présences, strikes, objectifs, programmes, suivis et notifications.
              </p>
              <ul className="mt-3 space-y-1 text-caption text-ink-700">
                <li>· Idempotent sur les comptes canoniques (upsert)</li>
                <li>· Force la régénération des données démo même si déjà appliqué</li>
                <li>· N'écrase pas le compte admin connecté</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              loading={seedMutation.isPending}
              onClick={() => setSeedOpen(true)}
              leftIcon={<Sprout className="h-4 w-4" strokeWidth={2} />}
            >
              Lancer le seed
            </Button>
          </div>
        </Card>

        {/* === Carte RESET === */}
        <Card padding="lg" className="flex flex-col gap-4 border border-danger-500/20 bg-red-50/30">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-danger-500">
              <Trash2 className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-h3 font-semibold text-ink-900">Réinitialiser la base</h2>
              <p className="mt-1 text-body text-ink-500">
                Supprime toutes les données métier : coachs, employés, sessions, réservations, objectifs, programmes, notifications, suivis. <strong className="text-ink-900">Seuls les comptes administrateur sont conservés.</strong>
              </p>
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-danger-500/30 bg-white/60 p-3 text-caption text-danger-500">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                <span>Action irréversible. Pense à faire un <code className="rounded bg-white px-1 py-0.5 font-mono">pg_dump</code> au préalable si tu travailles sur des vraies données.</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="danger"
              loading={resetMutation.isPending}
              onClick={() => setResetOpen(true)}
              leftIcon={<Trash2 className="h-4 w-4" strokeWidth={2} />}
            >
              Réinitialiser la base
            </Button>
          </div>
        </Card>
      </div>

      <Card padding="lg" className="border border-ink-200 bg-surface">
        <div className="flex items-start gap-3">
          <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" strokeWidth={1.75} />
          <div>
            <p className="font-heading text-h3 font-semibold text-ink-900">Workflow recommandé</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-body text-ink-500">
              <li>Réinitialiser la base pour partir d'un état propre.</li>
              <li>Lancer le seed pour repeupler les comptes et données démo.</li>
              <li>Se reconnecter avec un compte de démo si nécessaire.</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* === Modale confirmation SEED === */}
      <Modal
        open={seedOpen}
        onClose={() => !seedMutation.isPending && setSeedOpen(false)}
        title="Lancer le seed ?"
        description="Cette action crée ou met à jour les comptes démo et génère un jeu de données réaliste."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSeedOpen(false)} disabled={seedMutation.isPending}>
              Annuler
            </Button>
            <Button variant="primary" loading={seedMutation.isPending} onClick={() => seedMutation.mutate()}>
              Lancer le seed
            </Button>
          </>
        }
      >
        <p className="text-body text-ink-500">
          Le seed peut prendre quelques secondes (création de sessions sur 90 jours, présences, notifications…).
        </p>
      </Modal>

      {/* === Modale confirmation RESET === */}
      <Modal
        open={resetOpen}
        onClose={() => {
          if (resetMutation.isPending) return
          setResetOpen(false)
          setConfirmText('')
        }}
        title="Réinitialiser la base ?"
        description="Toutes les données métier seront définitivement supprimées."
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => { setResetOpen(false); setConfirmText('') }}
              disabled={resetMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              disabled={!resetReady}
              loading={resetMutation.isPending}
              onClick={() => resetMutation.mutate()}
            >
              Confirmer la suppression
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <ul className="space-y-1 text-caption text-ink-700">
            <li>· Tous les coachs et employés</li>
            <li>· Toutes les sessions et réservations</li>
            <li>· Tous les objectifs, programmes, suivis</li>
            <li>· Toutes les notifications</li>
          </ul>
          <p className="text-caption text-ink-500">
            Tape <strong className="text-ink-900 font-mono">{CONFIRM_PHRASE}</strong> pour activer le bouton de confirmation.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={resetMutation.isPending}
            placeholder={CONFIRM_PHRASE}
            autoFocus
            className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 font-mono text-body text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
            aria-label={`Tape ${CONFIRM_PHRASE} pour confirmer`}
          />
        </div>
      </Modal>
    </div>
  )
}
