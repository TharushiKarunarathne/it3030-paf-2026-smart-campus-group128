import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'

const TABS = ['All', 'Unread', 'Bookings', 'Tickets']

const TYPE_META = {
  BOOKING_PENDING:    { label: 'Booking pending',    color: 'bg-orange-100 text-orange-700' },
  BOOKING_APPROVED:  { label: 'Booking approved',  color: 'bg-green-100 text-green-700' },
  BOOKING_REJECTED:  { label: 'Booking rejected',  color: 'bg-red-100 text-red-700' },
  BOOKING_CANCELLED: { label: 'Booking cancelled', color: 'bg-gray-100 text-gray-600' },
  TICKET_UPDATED:    { label: 'Ticket updated',    color: 'bg-blue-100 text-blue-700' },
  NEW_COMMENT:       { label: 'New comment',        color: 'bg-yellow-100 text-yellow-700' },
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-GB', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const [tab, setTab] = useState('All')
  const navigate      = useNavigate()
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications()

  const unread = notifications.filter((n) => !n.read).length

  const filtered = notifications.filter((n) => {
    if (tab === 'Unread')   return !n.read
    if (tab === 'Bookings') return n.type?.startsWith('BOOKING')
    if (tab === 'Tickets')  return n.type?.startsWith('TICKET') || n.type === 'NEW_COMMENT'
    return true
  })

  const handleClick = (n) => {
    if (!n.read) markAsRead(n.id)
    if (n.type?.startsWith('BOOKING'))
      navigate(`/bookings/${n.entityId}`)
    else if (n.type?.startsWith('TICKET') || n.type === 'NEW_COMMENT')
      navigate(`/tickets/${n.entityId}`)
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread} unread
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllAsRead} className="btn-secondary text-sm">
            Mark all read
          </button>
          <button
            onClick={clearNotifications}
            className="btn-secondary text-sm text-red-600 hover:bg-red-50"
          >
            Clear read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
              ${tab === t
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {t}
            {t === 'Unread' && unread > 0 && (
              <span className="ml-1.5 badge bg-red-100 text-red-700 text-[10px]">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 text-sm">
              No notifications in this category
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const meta = TYPE_META[n.type]
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left card hover:shadow-md transition-shadow
                            p-4 flex gap-4 items-start
                            ${!n.read ? 'border-blue-200 bg-blue-50/30' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {meta && (
                      <span className={`badge text-xs ${meta.color}`}>
                        {meta.label}
                      </span>
                    )}
                    {!n.read && (
                      <span className="badge bg-blue-100 text-blue-700 text-xs">
                        New
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${!n.read
                    ? 'font-medium text-gray-900'
                    : 'text-gray-700'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {n.createdAt ? formatDate(n.createdAt) : ''}
                  </p>
                </div>
                {!n.read && (
                  <span className="flex-shrink-0 mt-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}