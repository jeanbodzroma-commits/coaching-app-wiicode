import { useForm } from 'react-hook-form'
import { Modal, Button, Input, Select } from '../ui'

/**
 * Modal form to create a session (coach / admin).
 *
 * @typedef {object} CreateSessionModalProps
 * @property {boolean} open
 * @property {() => void} onClose
 * @property {(payload: object) => Promise<void>|void} onSubmit
 * @property {boolean} [isPending]
 */
export default function CreateSessionModal({ open, onClose, onSubmit, isPending }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { duration: 60, type: 'SOLO' },
  })

  async function submit(data) {
    await onSubmit({ ...data, date: new Date(data.date).toISOString(), duration: Number(data.duration) })
    reset()
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Nouveau créneau"
      description="Crée un créneau d'entraînement."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => { reset(); onClose() }}>Annuler</Button>
          <Button type="submit" form="create-session-form" variant="primary" loading={isPending}>
            Créer le créneau
          </Button>
        </>
      }
    >
      <form id="create-session-form" onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <Input
          type="datetime-local"
          label="Date et heure"
          error={errors.date?.message}
          {...register('date', { required: 'Date requise' })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Durée (min)"
            min={15}
            max={180}
            hint="Entre 15 et 180 min"
            error={errors.duration?.message}
            {...register('duration', { required: true, valueAsNumber: true, min: 15, max: 180 })}
          />
          <Select
            label="Type"
            error={errors.type?.message}
            {...register('type', { required: true })}
          >
            <option value="SOLO">Solo · 1 place</option>
            <option value="DUO">Duo · 2 places</option>
          </Select>
        </div>
      </form>
    </Modal>
  )
}
