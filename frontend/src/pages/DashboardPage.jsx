import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../store/AuthContext'
import { dashboardService } from '../services/dashboard.service'
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard'
import CoachDashboard from '../components/dashboard/CoachDashboard'
import AdminDashboard from '../components/dashboard/AdminDashboard'

export default function DashboardPage() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: dashboardService.get,
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="h-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Bonjour, {user?.firstName} 👋</h2>
        <p className="text-gray-500 text-sm capitalize">{roleLabel(user?.role)}</p>
      </div>

      {user?.role === 'EMPLOYEE' && <EmployeeDashboard data={data} />}
      {user?.role === 'COACH' && <CoachDashboard data={data} />}
      {user?.role === 'ADMIN' && <AdminDashboard data={data} />}
    </div>
  )
}

function roleLabel(role) {
  return { ADMIN: 'Administrateur', COACH: 'Coach', EMPLOYEE: 'Employé' }[role] || role
}
