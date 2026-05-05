import { useAuth } from '../store/AuthContext'
import CoachPrograms from '../components/programs/CoachPrograms'
import EmployeePrograms from '../components/programs/EmployeePrograms'

export default function ProgramsPage() {
  const { user } = useAuth()

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Objectifs & Programmes</h2>
        <p className="text-gray-500 text-sm mt-1">
          {user?.role === 'EMPLOYEE'
            ? 'Vos objectifs sportifs et programmes assignés par votre coach'
            : 'Assignez des objectifs et programmes à vos employés'}
        </p>
      </div>

      {(user?.role === 'COACH' || user?.role === 'ADMIN') && <CoachPrograms />}
      {user?.role === 'EMPLOYEE' && <EmployeePrograms />}
    </div>
  )
}
