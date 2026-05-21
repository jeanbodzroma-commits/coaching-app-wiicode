import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './store/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import RouteFallback from './routes/RouteFallback'
import ScrollToTop from './routes/ScrollToTop'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/LoginPage'

const DashboardPage      = lazy(() => import('./pages/DashboardPage'))
const PlanningPage       = lazy(() => import('./pages/PlanningPage'))
const SessionDetailPage  = lazy(() => import('./pages/SessionDetailPage'))
const HistoryPage        = lazy(() => import('./pages/HistoryPage'))
const UsersPage          = lazy(() => import('./pages/UsersPage'))
const PenaltiesPage      = lazy(() => import('./pages/PenaltiesPage'))
const ProgramsPage       = lazy(() => import('./pages/ProgramsPage'))
const AdminToolsPage     = lazy(() => import('./pages/AdminToolsPage'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"      element={<Suspense fallback={<RouteFallback />}><DashboardPage /></Suspense>} />
            <Route path="planning"       element={<Suspense fallback={<RouteFallback />}><PlanningPage /></Suspense>} />
            <Route path="planning/:id"   element={<Suspense fallback={<RouteFallback />}><SessionDetailPage /></Suspense>} />
            <Route path="history"        element={<Suspense fallback={<RouteFallback />}><HistoryPage /></Suspense>} />
            <Route path="users"          element={<ProtectedRoute roles={['ADMIN']}><Suspense fallback={<RouteFallback />}><UsersPage /></Suspense></ProtectedRoute>} />
            <Route path="penalties"      element={<ProtectedRoute roles={['ADMIN']}><Suspense fallback={<RouteFallback />}><PenaltiesPage /></Suspense></ProtectedRoute>} />
            <Route path="programs"       element={<Suspense fallback={<RouteFallback />}><ProgramsPage /></Suspense>} />
            <Route path="admin/tools"    element={<ProtectedRoute roles={['ADMIN']}><Suspense fallback={<RouteFallback />}><AdminToolsPage /></Suspense></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
