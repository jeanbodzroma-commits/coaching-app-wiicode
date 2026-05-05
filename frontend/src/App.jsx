import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './store/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlanningPage from './pages/PlanningPage'
import SessionDetailPage from './pages/SessionDetailPage'
import HistoryPage from './pages/HistoryPage'
import UsersPage from './pages/UsersPage'
import PenaltiesPage from './pages/PenaltiesPage'
import ProgramsPage from './pages/ProgramsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="planning" element={<PlanningPage />} />
            <Route path="planning/:id" element={<SessionDetailPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="users" element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
            <Route path="penalties" element={<ProtectedRoute roles={['ADMIN']}><PenaltiesPage /></ProtectedRoute>} />
            <Route path="programs" element={<ProgramsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
