import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'

const ROLE_BADGE = {
  ADMIN:      'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-blue-100 text-blue-700',
  USER:       'bg-gray-100 text-gray-600',
}

const TYPE_STYLES = {
  BOOKING_PENDING:   { bg: 'bg-orange-100',  text: 'text-orange-700',  icon: '⏳' },
  BOOKING_APPROVED:  { bg: 'bg-green-100',  text: 'text-green-700',  icon: '✓' },
  BOOKING_REJECTED:  { bg: 'bg-red-100',    text: 'text-red-700',    icon: '✕' },
  BOOKING_CANCELLED: { bg: 'bg-gray-100',   text: 'text-gray-600',   icon: '⊘' },
  TICKET_UPDATED:    { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '↑' },
  NEW_COMMENT:       { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '💬' },
}

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function QuickLink({ to, label, icon }) {
  return (
    <Link to={to}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50
                 transition-colors border border-gray-200">
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  )
}

function StatCard({ label, value, to, color }) {
  return (
    <Link to={to}
      className="card hover:shadow-md transition-shadow flex flex-col gap-2 cursor-pointer">
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
  const { notifications, unreadCount } = useNotifications()

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
            weekday: 'long', day: 'numeric',
            month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      {/* Admin banner */}
      {isAdmin && (
        <div className="card border-purple-200 bg-purple-50/40 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">👑</span>
            <div>
              <h2 className="text-base font-semibold text-purple-900">
                Admin Control Panel
              </h2>
              <p className="text-xs text-purple-600">
                You have full access to manage the Smart Campus system
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/admin/users"
              className="text-center p-3 bg-white rounded-lg border border-purple-100
                         hover:shadow-sm transition-shadow">
              <p className="text-2xl font-bold text-purple-700">👥</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">Manage users</p>
            </Link>
            <Link to="/bookings"
              className="text-center p-3 bg-white rounded-lg border border-purple-100
                         hover:shadow-sm transition-shadow">
              <p className="text-2xl font-bold text-green-600">📅</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">All bookings</p>
            </Link>
            <Link to="/tickets"
              className="text-center p-3 bg-white rounded-lg border border-purple-100
                         hover:shadow-sm transition-shadow">
              <p className="text-2xl font-bold text-red-600">🔧</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">All tickets</p>
            </Link>
          </div>
        </div>
      )}

      {/* Technician banner */}
      {isTechnician && (
        <div className="card border-blue-200 bg-blue-50/40 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔧</span>
            <div>
              <h2 className="text-base font-semibold text-blue-900">
                Technician Dashboard
              </h2>
              <p className="text-xs text-blue-600">
                Manage and resolve assigned maintenance tickets
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/tickets?status=OPEN"
              className="text-center p-3 bg-white rounded-lg border border-blue-100
                         hover:shadow-sm transition-shadow">
              <p className="text-2xl font-bold text-orange-600">📋</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">Open tickets</p>
            </Link>
            <Link to="/tickets?status=IN_PROGRESS"
              className="text-center p-3 bg-white rounded-lg border border-blue-100
                         hover:shadow-sm transition-shadow">
              <p className="text-2xl font-bold text-blue-600">⚙️</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">In progress</p>
            </Link>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Notifications"
          value={unreadCount || 0}
          to="/notifications"
          color="text-blue-600"
        />
        <StatCard
          label={isAdmin ? 'All Bookings' : 'My Bookings'}
          value="—"
          to="/bookings"
          color="text-green-600"
        />
        <StatCard
          label={isAdmin ? 'All Tickets' : 'My Tickets'}
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
            {!isAdmin && (
              <>
                <QuickLink to="/bookings/new" label="New booking"      icon="📅" />
                <QuickLink to="/tickets/new"  label="Report issue"     icon="🔧" />
              </>
            )}
            <QuickLink to="/resources"      label="Browse resources" icon="🏛️" />
            <QuickLink to="/notifications"  label="Notifications"    icon="🔔" />
            {(isAdmin || isTechnician) && (
              <QuickLink to="/tickets?status=OPEN" label="Open tickets" icon="📋" />
            )}
            {isAdmin && (
              <>
                <QuickLink to="/admin/users"  label="Manage users"    icon="👥" />
                <QuickLink to="/bookings"     label="Review bookings" icon="✅" />
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Recent activity
            </h2>
            <Link to="/notifications"
              className="text-xs text-primary-600 hover:underline">
              View all
            </Link>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No activity yet
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((n) => {
                const styles = TYPE_STYLES[n.type] ?? TYPE_STYLES.TICKET_UPDATED
                const href = n.type?.startsWith('BOOKING')
                  ? `/bookings/${n.entityId}`
                  : `/tickets/${n.entityId}`

                return (
                  <Link
                    key={n.id}
                    to={href}
                    className={`flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50
                               transition-colors border
                               ${!n.read ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100'}`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full
                                     flex items-center justify-center text-xs font-bold
                                     ${styles.bg} ${styles.text}`}>
                      {styles.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug
                                     ${!n.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}