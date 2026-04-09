import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'

const TABS = ['All', 'Unread', 'Bookings', 'Tickets']

const TYPE_META = {
  BOOKING_PENDING:   { label: 'Pending',   dot: 'bg-amber-400',  border: 'border-l-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  BOOKING_APPROVED:  { label: 'Approved',  dot: 'bg-green-500',  border: 'border-l-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
  BOOKING_REJECTED:  { label: 'Rejected',  dot: 'bg-red-500',    border: 'border-l-red-500',    badge: 'bg-red-50 text-red-700 border-red-200' },
  BOOKING_CANCELLED: { label: 'Cancelled', dot: 'bg-gray-400',   border: 'border-l-gray-300',   badge: 'bg-gray-100 text-gray-600 border-gray-200' },
  TICKET_UPDATED:    { label: 'Ticket',    dot: 'bg-blue-500',   border: 'border-l-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  NEW_COMMENT:       { label: 'Comment',   dot: 'bg-yellow-500', border: 'border-l-yellow-400', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
}
const DEFAULT_META = { label: 'Update', dot: 'bg-gray-400', border: 'border-l-gray-300', badge: 'bg-gray-100 text-gray-600 border-gray-200' }

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

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const [tab, setTab] = useState('All')
  const navigate      = useNavigate()
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications()

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
    <div className="max-w-2xl mx-auto page-fade-in">

      {/* ── Hero ─────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden mb-6 px-8 py-7"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Notifications</h1>
            <p className="text-blue-200 text-sm">
              {unread > 0
                ? <><span className="font-semibold text-white">{unread} unread</span> · {notifications.length} total</>
                : `${notifications.length} total notifications`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              disabled={unread === 0}
              className="px-4 py-2 text-xs font-semibold rounded-xl transition-colors
                         bg-white/15 hover:bg-white/25 border border-white/25 text-white
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mark all read
            </button>
            <button
              onClick={clearNotifications}
              className="px-4 py-2 text-xs font-semibold rounded-xl transition-colors
                         bg-white/10 hover:bg-white/20 border border-white/20 text-blue-200
                         hover:text-white"
            >
              Clear read
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {t}
            {t === 'Unread' && unread > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold
                               px-1.5 py-0.5 rounded-full">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">
        Showing {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* ── List ─────────────────────────────────────── */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center
                          justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-800 font-semibold">You're all caught up!</p>
              <p className="text-gray-400 text-sm mt-1">
                {tab === 'All' ? 'No notifications yet.' : `No ${tab.toLowerCase()} notifications.`}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((n) => {
            const meta = TYPE_META[n.type] ?? DEFAULT_META
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left bg-white rounded-2xl border border-l-4
                            ${meta.border} border-gray-100
                            hover:shadow-md hover:-translate-y-0.5
                            transition-all duration-200
                            ${!n.read ? 'bg-blue-50/20' : ''}`}
              >
                <div className="flex gap-4 items-start p-4">
                  {/* Status dot */}
                  <div className="flex-shrink-0 mt-2">
                    <span className={`block w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full
                                        text-xs font-semibold border ${meta.badge}`}>
                        {meta.label}
                      </span>
                      {!n.read && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                         font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                          New
                        </span>
                      )}
                    </div>
                    <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-gray-400">{n.createdAt ? timeAgo(n.createdAt) : ''}</p>
                      {n.createdAt && (
                        <>
                          <span className="text-gray-200 text-xs">·</span>
                          <p className="text-xs text-gray-300">{formatDate(n.createdAt)}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!n.read && (
                    <span className="flex-shrink-0 mt-2 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
