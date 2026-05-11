import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, X } from 'lucide-react'
import { usersService } from '../services/users.service'
import { Card, Button, Input, Badge, Avatar, Modal, Skeleton, useToast } from '../components/ui'
import UserFormModal from '../components/users/UserFormModal'

const ROLE_LABEL = { ADMIN: 'Administrateur', COACH: 'Coach', EMPLOYEE: 'Employé' }
const ROLE_VARIANT = { ADMIN: 'primary', COACH: 'accent', EMPLOYEE: 'info' }

export default function UsersPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toDisable, setToDisable] = useState(null)

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: usersService.getAll })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q)  ||
      u.email.toLowerCase().includes(q)     ||
      ROLE_LABEL[u.role]?.toLowerCase().includes(q)
    )
  }, [users, search])

  const createMutation = useMutation({
    mutationFn: usersService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowCreate(false)
      toast.success('Compte créé')
    },
    onError: (err) => toast.error('Création impossible', err.response?.data?.message ?? 'Erreur'),
  })

  const disableMutation = useMutation({
    mutationFn: usersService.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setToDisable(null)
      toast.success('Compte désactivé')
    },
    onError: (err) => toast.error('Désactivation impossible', err.response?.data?.message ?? 'Erreur'),
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-ink-500">Administration</p>
          <h1 className="mt-1 font-display text-display-lg text-ink-900 lg:text-display-lg-md">Utilisateurs</h1>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)} leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}>
          Nouveau compte
        </Button>
      </header>

      <Card padding="sm" className="!p-3">
        <Input
          aria-label="Rechercher un utilisateur"
          placeholder="Rechercher par nom, email ou rôle…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" strokeWidth={1.75} />}
        />
      </Card>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <Card padding="md"><p className="py-6 text-center text-body text-ink-500">Aucun utilisateur correspondant.</p></Card>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {filtered.map(u => (
              <li key={u.id}>
                <Card padding="sm">
                  <div className="flex items-center gap-3">
                    <Avatar size="md" name={`${u.firstName} ${u.lastName}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-medium text-ink-900">{u.firstName} {u.lastName}</p>
                      <p className="truncate text-caption text-ink-500">{u.email}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                        {!u.isActive && <Badge variant="neutral">Désactivé</Badge>}
                      </div>
                    </div>
                    {u.isActive && (
                      <Button size="sm" variant="ghost" onClick={() => setToDisable(u)}>Désactiver</Button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <Card padding="none" className="hidden md:block overflow-hidden">
            <table className="w-full text-body">
              <thead className="bg-ink-50/60 text-caption font-medium uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 text-left">Utilisateur</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Rôle</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200/60">
                {filtered.map(u => (
                  <tr key={u.id} className="transition-colors hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm" name={`${u.firstName} ${u.lastName}`} />
                        <span className="font-medium text-ink-900">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{u.email}</td>
                    <td className="px-4 py-3"><Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Actif' : 'Désactivé'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.isActive && (
                        <Button size="sm" variant="ghost" onClick={() => setToDisable(u)} leftIcon={<X className="h-3.5 w-3.5" strokeWidth={1.75} />}>
                          Désactiver
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <UserFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        isPending={createMutation.isPending}
      />

      <Modal
        open={!!toDisable}
        onClose={() => setToDisable(null)}
        title="Désactiver ce compte ?"
        description="L'utilisateur ne pourra plus se connecter. Les données sont conservées."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDisable(null)}>Annuler</Button>
            <Button variant="danger" loading={disableMutation.isPending} onClick={() => disableMutation.mutate(toDisable.id)}>
              Désactiver
            </Button>
          </>
        }
      >
        {toDisable && (
          <p className="text-body text-ink-500">
            Confirmer la désactivation du compte de <strong className="text-ink-900">{toDisable.firstName} {toDisable.lastName}</strong> ({toDisable.email}) ?
          </p>
        )}
      </Modal>
    </div>
  )
}
