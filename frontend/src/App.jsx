import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import MainLayout     from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Member 4 pages
import LoginPage          from './pages/auth/LoginPage'
import DashboardPage      from './pages/dashboard/DashboardPage'
import NotificationsPage  from './pages/notifications/NotificationsPage'
import UserManagement     from './pages/admin/UserManagement'
import ProfilePage from './pages/profile/ProfilePage'

// Member 1 — Facilities & Assets
import ResourcesPage      from './pages/resources/ResourcesPage'
import ResourceDetailPage from './pages/resources/ResourceDetailPage'
import NewResourcePage  from './pages/resources/NewResourcePage'
import EditResourcePage from './pages/resources/EditResourcePage'

// Placeholder pages for teammates
const Placeholder = ({ label }) => (
  <div className="card text-center py-16">
    <p className="text-3xl mb-3">🚧</p>
    <h2 className="text-lg font-semibold text-gray-700">{label}</h2>
    <p className="text-sm text-gray-400 mt-1">Coming soon</p>
  </div>
)

// Unauthorized page
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="text-center max-w-md">
      <p className="text-6xl mb-4">🚫</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
      <p className="text-gray-500 mb-6 text-sm">
        You do not have permission to view this page.
      </p>
      <a href="/dashboard" className="btn-primary">
        Go to dashboard
      </a>
    </div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>

            {/* Public routes */}
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* All authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Member 4 — Auth, Roles & Notifications */}
                <Route path="/dashboard"     element={<DashboardPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                <Route path="/resources"     element={<ResourcesPage />} />
                <Route path="/resources/:id" element={<ResourceDetailPage />} />

                {/* Member 1 — Facilities & Assets */}
                <Route path="/resources"
                  element={<Placeholder label="Member 1 — Resources" />} />
                <Route path="/resources/:id"
                  element={<Placeholder label="Member 1 — Resource Detail" />} />
                <Route path="/resources/new"      element={<NewResourcePage />} />
<Route path="/resources/:id/edit" element={<EditResourcePage />} />

                {/* Member 2 — Booking Management */}
                <Route path="/bookings"
                  element={<Placeholder label="Member 2 — Bookings" />} />
                <Route path="/bookings/new"
                  element={<Placeholder label="Member 2 — New Booking" />} />
                <Route path="/bookings/:id"
                  element={<Placeholder label="Member 2 — Booking Detail" />} />

                {/* Member 3 — Incident Ticketing */}
                <Route path="/tickets"
                  element={<Placeholder label="Member 3 — Tickets" />} />
                <Route path="/tickets/new"
                  element={<Placeholder label="Member 3 — New Ticket" />} />
                <Route path="/tickets/:id"
                  element={<Placeholder label="Member 3 — Ticket Detail" />} />
              </Route>
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route element={<MainLayout />}>
              {/* Admin-only pages resources */}
                <Route path="/resources/new"      element={<NewResourcePage />} />
                <Route path="/resources/:id/edit" element={<EditResourcePage />} />

                <Route path="/admin/users" element={<UserManagement />} />
              </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}