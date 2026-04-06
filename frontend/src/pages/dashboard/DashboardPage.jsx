import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'

const ROLE_BADGE = {
  ADMIN:      'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-blue-100 text-blue-700',
  USER:       'bg-gray-100 text-gray-600',
}

function QuickLink({ to, label, icon }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50
                 transition-colors border border-gray-200"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  )
}

function StatCard({ label, value, to, color }) {
  return (
    <Link
      to={to}
      className="card hover:shadow-md transition-shadow flex flex-col gap-2 cursor-pointer"
    >
      <span className={`text-xs font-medium uppercase tracking-wide ${color}`}>
        {label}
      </span>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-400">View all →</span>
    </Link>
  )
}

export default function DashboardPage() {
  const { user, isAdmin, isTechnician } = useAuth()
  const { unreadCount } = useNotifications()

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <span className={`badge ${ROLE_BADGE[user?.role] ?? ROLE_BADGE.USER}`}>
            {user?.role}
          </span>
        </div>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Notifications"
          value={unreadCount || 0}
          to="/notifications"
          color="text-blue-600"
        />
        <StatCard
          label="My Bookings"
          value="—"
          to="/bookings"
          color="text-green-600"
        />
        <StatCard
          label="My Tickets"
          value="—"
          to="/tickets"
          color="text-orange-600"
        />
        <StatCard
          label="Resources"
          value="—"
          to="/resources"
          color="text-purple-600"
        />
      </div>

      {/* Quick actions + activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <QuickLink to="/bookings/new"       label="New booking"      icon="📅" />
            <QuickLink to="/tickets/new"         label="Report issue"     icon="🔧" />
            <QuickLink to="/resources"           label="Browse resources" icon="🏛️" />
            <QuickLink to="/notifications"       label="Notifications"    icon="🔔" />
            {(isAdmin || isTechnician) && (
              <QuickLink to="/tickets?status=OPEN" label="Open tickets"  icon="📋" />
            )}
            {isAdmin && (
              <QuickLink to="/admin/users"       label="Manage users"     icon="👥" />
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Recent activity
            </h2>
            <Link
              to="/notifications"
              className="text-xs text-primary-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {unreadCount === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No new notifications
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              You have{' '}
              <span className="font-semibold text-blue-600">{unreadCount}</span>
              {' '}unread notification{unreadCount !== 1 ? 's' : ''}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}