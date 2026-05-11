import { useForm } from 'react-hook-form'
import { Modal, Button, Input, Select } from '../ui'

/**
 * Modal for creating a new user account.
 *
 * @typedef {object} UserFormModalProps
 * @property {boolean} open
 * @property {() => void} onClose
 * @property {(payload: object) => Promise<void>|void} onSubmit
 * @property {boolean} [isPending]
 */
export default function UserFormModal({ open, onClose, onSubmit, isPending }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { role: 'EMPLOYEE' },
  })

  async function submit(data) {
    await onSubmit(data)
    reset()
  }

  function handleClose() { reset(); onClose() }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nouveau compte"
      description="Le compte est créé immédiatement, le mot de passe doit être transmis à la personne."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Annuler</Button>
          <Button type="submit" form="user-create-form" variant="primary" loading={isPending}>
            Créer le compte
          </Button>
        </>
      }
    >
      <form id="user-create-form" onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Prénom"
            error={errors.firstName?.message}
            {...register('firstName', { required: 'Prénom requis' })}
          />
          <Input
            label="Nom"
            error={errors.lastName?.message}
            {...register('lastName', { required: 'Nom requis' })}
          />
        </div>
        <Input
          type="email"
          label="Email"
          placeholder="prenom.nom@wiicode.fr"
          error={errors.email?.message}
          {...register('email', { required: 'Email requis' })}
        />
        <Input
          type="password"
          label="Mot de passe initial"
          hint="Min. 6 caractères"
          error={errors.password?.message}
          {...register('password', { required: 'Mot de passe requis', minLength: { value: 6, message: 'Min. 6 caractères' } })}
        />
        <Select label="Rôle" {...register('role', { required: true })}>
          <option value="EMPLOYEE">Employé</option>
          <option value="COACH">Coach</option>
          <option value="ADMIN">Administrateur</option>
        </Select>
      </form>
    </Modal>
  )
}
