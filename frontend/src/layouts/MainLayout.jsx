import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navClass = ({ isActive }) =>
    `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-white font-bold text-lg">Coaching Wiicode</h1>
          <p className="text-gray-400 text-xs mt-1">{user?.firstName} {user?.lastName}</p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white">
            {user?.role}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
          <NavLink to="/planning" className={navClass}>Planning</NavLink>
          <NavLink to="/history" className={navClass}>Historique</NavLink>
          <NavLink to="/programs" className={navClass}>Programmes</NavLink>
          {user?.role === 'ADMIN' && (
            <>
              <NavLink to="/users" className={navClass}>Utilisateurs</NavLink>
              <NavLink to="/penalties" className={navClass}>Pénalités</NavLink>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors">
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
