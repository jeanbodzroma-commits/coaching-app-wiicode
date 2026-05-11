import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Clock, User, Users, Calendar, Trash2 } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { sessionsService } from '../services/sessions.service'
import { reservationsService } from '../services/reservations.service'
import { Card, Badge, Button, Avatar, Modal, Select, Skeleton, useToast } from '../components/ui'
import { cn } from '../utils/cn'

export default function SessionDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const reduced = useReducedMotion()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionsService.getOne(id),
  })

  const attendanceMutation = useMutation({
    mutationFn: ({ resId, attendance }) => reservationsService.updateAttendance(resId, attendance),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', id] })
      toast.success('Présence enregistrée')
    },
    onError: (err) => toast.error('Impossible', err.response?.data?.message ?? 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => sessionsService.remove(id),
    onSuccess: () => {
      toast.success('Créneau supprimé')
      navigate('/planning')
    },
    onError: (err) => toast.error('Suppression refusée', err.response?.data?.message ?? 'Erreur'),
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
      </div>
    )
  }
  if (!session) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center text-danger-500">Créneau introuvable</div>
    )
  }

  const isPast = new Date(session.date) < new Date()
  const confirmed = session.reservations.filter(r => r.status === 'CONFIRMED')
  const waiting = session.reservations.filter(r => r.status === 'WAITING')
  const isCoachOrAdmin = ['COACH', 'ADMIN'].includes(user?.role)

  const container = reduced ? {} : {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }
  const item = reduced ? {} : {
    hidden:  { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
  }

  const formattedDate = new Date(session.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const time = new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8"
    >
      <motion.button
        type="button"
        variants={item}
        onClick={() => navigate('/planning')}
        className="inline-flex items-center gap-1 text-body font-medium text-primary-700 hover:text-primary-800"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Retour au planning
      </motion.button>

      {/* Hero */}
      <motion.section variants={item} className="rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-caption uppercase tracking-wide text-white/70">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>{isPast ? 'Session passée' : 'À venir'}</span>
            </div>
            <h1 className="mt-1 font-display text-display-lg leading-tight text-white capitalize lg:text-display-lg-md">{formattedDate}</h1>
            <p className="mt-1 text-body-md text-white/80">
              <Clock className="mr-1 inline h-4 w-4 align-[-2px]" strokeWidth={1.75} /> {time} · {session.duration} min
            </p>
            <p className="mt-2 text-body text-white/70">
              <User className="mr-1 inline h-4 w-4 align-[-2px]" strokeWidth={1.75} />
              Coach : {session.coach.firstName} {session.coach.lastName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="accent">{session.type}</Badge>
            {isCoachOrAdmin && !isPast && session.reservations.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="!text-white/80 hover:!bg-white/10 hover:!text-white"
                leftIcon={<Trash2 className="h-4 w-4" strokeWidth={1.75} />}
              >
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Status banner Duo */}
      {session.type === 'DUO' && (
        <motion.div variants={item}>
          <DuoStatus confirmed={confirmed} waiting={waiting} />
        </motion.div>
      )}

      {/* Participants confirmés */}
      <motion.section variants={item}>
        <Card padding="md">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-h3 font-heading font-semibold text-ink-900">
              Participants confirmés
            </h2>
            <Badge variant="primary">{confirmed.length}/{session.capacity}</Badge>
          </header>
          <ParticipantList
            reservations={confirmed}
            empty="Aucun participant confirmé."
            isPast={isPast}
            canMark={isCoachOrAdmin}
            onAttendance={(resId, attendance) => attendanceMutation.mutate({ resId, attendance })}
          />
        </Card>
      </motion.section>

      {/* Liste d'attente Duo */}
      {session.type === 'DUO' && (
        <motion.section variants={item}>
          <Card padding="md" className="bg-amber-50/40">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-h3 font-heading font-semibold text-amber-700">
                <Users className="h-4 w-4" strokeWidth={1.75} />
                En attente d'un partenaire
              </h2>
              <Badge variant="warning">{waiting.length}</Badge>
            </header>
            <ParticipantList reservations={waiting} empty="Personne n'attend." waitingStyle />
          </Card>
        </motion.section>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer ce créneau ?"
        description="Cette action est irréversible. Vérifie qu'aucune réservation n'est active."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Annuler</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-body text-ink-500">Le créneau du {formattedDate} à {time} sera retiré du planning.</p>
      </Modal>
    </motion.div>
  )
}

function DuoStatus({ confirmed, waiting }) {
  if (confirmed.length >= 2) {
    return (
      <div className="rounded-2xl border border-success-500/30 bg-green-50/40 px-4 py-3 text-body font-medium text-success-500">
        Duo complet — 2 participants confirmés
      </div>
    )
  }
  if (waiting.length === 1) {
    return (
      <div className="rounded-2xl border border-warning-500/30 bg-amber-50/40 px-4 py-3 text-body text-amber-700">
        <span className="font-semibold">Duo incomplet</span> — {waiting[0].user.firstName} attend un partenaire
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-primary-200 bg-primary-50/40 px-4 py-3 text-body text-primary-700">
      Duo disponible — 2 places libres
    </div>
  )
}

function ParticipantList({ reservations, empty, isPast, canMark, onAttendance, waitingStyle }) {
  if (reservations.length === 0) {
    return <p className="text-body text-ink-500">{empty}</p>
  }
  return (
    <ul className="flex flex-col gap-2">
      {reservations.map(r => (
        <li
          key={r.id}
          className={cn('flex flex-wrap items-center justify-between gap-3 rounded-xl p-3', waitingStyle ? 'bg-surface' : 'bg-ink-50/60')}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar size="sm" name={`${r.user.firstName} ${r.user.lastName}`} />
            <p className="text-body font-medium text-ink-900">{r.user.firstName} {r.user.lastName}</p>
          </div>
          <div className="flex items-center gap-2">
            {canMark && isPast && (
              <Select
                defaultValue={r.attendance || ''}
                onChange={e => onAttendance(r.id, e.target.value)}
                aria-label="Statut de présence"
                className="!min-w-[10rem]"
              >
                <option value="" disabled>Marquer la présence</option>
                <option value="PRESENT">Présent</option>
                <option value="ABSENT">Absent</option>
                <option value="CANCELLED">Annulé</option>
              </Select>
            )}
            {r.attendance && <AttendanceBadge attendance={r.attendance} />}
          </div>
        </li>
      ))}
    </ul>
  )
}

function AttendanceBadge({ attendance }) {
  const map = {
    PRESENT:   { variant: 'success', label: 'Présent' },
    ABSENT:    { variant: 'danger',  label: 'Absent' },
    CANCELLED: { variant: 'neutral', label: 'Annulé' },
  }
  const m = map[attendance] || { variant: 'neutral', label: attendance }
  return <Badge variant={m.variant}>{m.label}</Badge>
}
