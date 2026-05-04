import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { usersService } from '../services/users.service'

export default function UsersPage() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: usersService.getAll })
  const { register, handleSubmit, reset } = useForm()

  const createMutation = useMutation({
    mutationFn: usersService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); reset() },
  })

  const deactivateMutation = useMutation({
    mutationFn: usersService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Utilisateurs</h2>

      <form onSubmit={handleSubmit(data => createMutation.mutate(data))} className="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-700">Créer un compte</h3>
        <div className="grid grid-cols-2 gap-4">
          <input {...register('firstName', { required: true })} placeholder="Prénom" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input {...register('lastName', { required: true })} placeholder="Nom" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="email" {...register('email', { required: true })} placeholder="Email" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" {...register('password', { required: true })} placeholder="Mot de passe" className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select {...register('role')} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="EMPLOYEE">Employé</option>
            <option value="COACH">Coach</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {createMutation.isPending ? 'Création…' : 'Créer'}
        </button>
      </form>

      {isLoading ? <p className="text-gray-400">Chargement…</p> : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rôle</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.isActive && (
                      <button onClick={() => { if (confirm('Désactiver ce compte ?')) deactivateMutation.mutate(u.id) }} className="text-xs text-red-500 hover:underline">
                        Désactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
