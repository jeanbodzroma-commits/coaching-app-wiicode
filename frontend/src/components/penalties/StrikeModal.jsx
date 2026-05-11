import { useForm } from 'react-hook-form'
import { Modal, Button, Textarea } from '../ui'

/**
 * Modal to add a manual strike to an employee.
 *
 * @typedef {object} StrikeModalProps
 * @property {object|null} user
 * @property {() => void} onClose
 * @property {(reason: string) => Promise<void>|void} onSubmit
 * @property {boolean} [isPending]
 */
export default function StrikeModal({ user, onClose, onSubmit, isPending }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  async function submit({ reason }) {
    await onSubmit(reason)
    reset()
  }

  function handleClose() { reset(); onClose() }

  return (
    <Modal
      open={!!user}
      onClose={handleClose}
      title={user ? `Strike pour ${user.firstName} ${user.lastName}` : ''}
      description="Ajoute manuellement un strike. La personne sera notifiée."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Annuler</Button>
          <Button type="submit" form="strike-form" variant="danger" loading={isPending}>
            Ajouter le strike
          </Button>
        </>
      }
    >
      <form id="strike-form" onSubmit={handleSubmit(submit)}>
        <Textarea
          label="Raison"
          placeholder="Ex : absence non justifiée au cours du 12 mai…"
          rows={4}
          error={errors.reason?.message}
          {...register('reason', { required: 'Raison requise' })}
        />
      </form>
    </Modal>
  )
}
