import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import MainLayout     from './components/layout/MainLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Member 4 pages
import LoginPage          from './pages/auth/LoginPage'
import DashboardPage      from './pages/dashboard/DashboardPage'
import NotificationsPage  from './pages/notifications/NotificationsPage'
import UserManagement     from './pages/admin/UserManagement.jsx'
import ProfilePage from './pages/profile/ProfilePage'
import HomePage    from './pages/home/HomePage'

import TicketsPage      from './pages/tickets/TicketsPage'
import NewTicketPage    from './pages/tickets/NewTicketPage'
import TicketDetailPage from './pages/tickets/TicketDetailPage'

// Member 1 — Facilities & Assets
import ResourcesPage      from './pages/resources/ResourcesPage'
import ResourceDetailPage from './pages/resources/ResourceDetailPage'
import NewResourcePage    from './pages/resources/NewResourcePage'
import EditResourcePage   from './pages/resources/EditResourcePage'

// Member 2 — Booking Management
import BookingsPage      from './pages/bookings/BookingsPage'
import NewBookingPage    from './pages/bookings/NewBookingPage'
import BookingDetailPage from './pages/bookings/BookingDetailPage'

// Member 2 — QR verification (public, no login needed)
import VerifyBookingPage from './pages/bookings/VerifyBookingPage'

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

            {/* ── Public routes — no login needed ─────── */}
            <Route path="/"            element={<HomePage />} />
            <Route path="/login"       element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* QR verification — public, anyone can scan */}
            <Route path="/verify/:id"  element={<VerifyBookingPage />} />

            {/* ── All authenticated users ──────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>

                {/* Member 4 — Auth, Roles & Notifications */}
                <Route path="/dashboard"     element={<DashboardPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Member 1 — Facilities & Assets */}
                <Route path="/resources"          element={<ResourcesPage />} />
                <Route path="/resources/:id"      element={<ResourceDetailPage />} />

                {/* Member 2 — Booking Management */}
                <Route path="/bookings"           element={<BookingsPage />} />
                <Route path="/bookings/new"       element={<NewBookingPage />} />
                <Route path="/bookings/:id"       element={<BookingDetailPage />} />

                {/* Member 3 — Incident Ticketing */}
                <Route path="/tickets"     element={<TicketsPage />} />
                <Route path="/tickets/new" element={<NewTicketPage />} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />
              </Route>
            </Route>

            {/* ── Admin only ───────────────────────────── */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route element={<MainLayout />}>
                <Route path="/resources/new"      element={<NewResourcePage />} />
                <Route path="/resources/:id/edit" element={<EditResourcePage />} />
                <Route path="/admin/users"        element={<UserManagement />} />
              </Route>
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
