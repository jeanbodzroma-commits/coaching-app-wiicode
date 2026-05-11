import { useAuth } from '../store/AuthContext'
import CoachPrograms from '../components/programs/CoachPrograms'
import EmployeePrograms from '../components/programs/EmployeePrograms'

export default function ProgramsPage() {
  const { user } = useAuth()
  const isCoachOrAdmin = ['COACH', 'ADMIN'].includes(user?.role)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <header>
        <p className="text-caption font-medium uppercase tracking-wide text-ink-500">Coaching</p>
        <h1 className="mt-1 font-display text-display-lg text-ink-900 lg:text-display-lg-md">Objectifs &amp; Programmes</h1>
        <p className="mt-2 text-body text-ink-500">
          {isCoachOrAdmin
            ? 'Assigne des objectifs et programmes à tes employés et suis leur progression.'
            : 'Tes objectifs sportifs et programmes assignés par ton coach.'}
        </p>
      </header>

      {isCoachOrAdmin ? <CoachPrograms /> : <EmployeePrograms />}
    </div>
  )
}
