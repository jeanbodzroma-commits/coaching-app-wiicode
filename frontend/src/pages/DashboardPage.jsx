import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../store/AuthContext'
import { dashboardService } from '../services/dashboard.service'
import { Skeleton } from '../components/ui'
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard'
import CoachDashboard from '../components/dashboard/CoachDashboard'
import AdminDashboard from '../components/dashboard/AdminDashboard'

const ROLE_GREETING = {
  EMPLOYEE: 'Prêt à bouger ?',
  COACH:    'Voici ta journée.',
  ADMIN:    'Vue d\'ensemble de l\'activité.',
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: dashboardService.get,
    refetchInterval: 60_000,
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      {/* Hero */}
      <header>
        <p className="text-caption font-medium uppercase tracking-wide text-ink-500">
          Bonjour {user?.firstName ? `, ${user.firstName}` : ''} 👋
        </p>
        <h1 className="mt-1 font-display text-display-lg text-ink-900 lg:text-display-lg-md">
          {ROLE_GREETING[user?.role] ?? 'Dashboard'}
        </h1>
      </header>

      {isLoading ? <DashboardSkeleton /> : (
        <>
          {user?.role === 'EMPLOYEE' && <EmployeeDashboard data={data} />}
          {user?.role === 'COACH'    && <CoachDashboard    data={data} />}
          {user?.role === 'ADMIN'    && <AdminDashboard    data={data} />}
        </>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-56" />
      <Skeleton className="h-64" />
    </div>
  )
}
