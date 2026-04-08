import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'

const TYPE_STYLES = {
  BOOKING_PENDING:   { bg: 'bg-orange-100',  text: 'text-orange-700',  icon: '⏳' },
  BOOKING_APPROVED:  { bg: 'bg-green-100',  text: 'text-green-700',  icon: '✓' },
  BOOKING_REJECTED:  { bg: 'bg-red-100',    text: 'text-red-700',    icon: '✕' },
  BOOKING_CANCELLED: { bg: 'bg-gray-100',   text: 'text-gray-600',   icon: '⊘' },
  TICKET_UPDATED:    { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '↑' },
  NEW_COMMENT:       { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '💬' },
  DEFAULT:           { bg: 'bg-gray-100',   text: 'text-gray-600',   icon: '•' },
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

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = (n) => {
    if (!n.read) markAsRead(n.id)
    if (n.type?.startsWith('BOOKING'))
      navigate(`/bookings/${n.entityId}`)
    else if (n.type?.startsWith('TICKET') || n.type === 'NEW_COMMENT')
      navigate(`/tickets/${n.entityId}`)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>

      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center
                           rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg
                        border border-gray-200 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 badge bg-red-100 text-red-700">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={clearNotifications}
                className="text-xs text-gray-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          {/* List */}
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </li>
            ) : (
              notifications.map((n) => {
                const s = TYPE_STYLES[n.type] ?? TYPE_STYLES.DEFAULT
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50
                                  transition-colors flex gap-3 items-start
                                  ${!n.read ? 'bg-blue-50/40' : ''}`}
                    >
                      <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full
                                        flex items-center justify-center text-xs
                                        ${s.bg} ${s.text}`}>
                        {s.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug
                                       ${!n.read
                                         ? 'font-medium text-gray-900'
                                         : 'text-gray-700'}`}>
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2 text-center">
            <button
              onClick={() => { navigate('/notifications'); setOpen(false) }}
              className="text-xs text-primary-600 hover:underline"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}