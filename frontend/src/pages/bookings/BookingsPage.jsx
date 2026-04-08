import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyBookings, deleteBooking } from '../../api/bookingApi'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending',  dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejected', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200' },
}

const TYPE_ICON = {
  LECTURE_HALL:       '🏛️',
  COMPUTER_LAB:       '🖥️',
  SPORTS_FACILITY:    '🏋️',
  MEETING_ROOM:       '🪑',
  VEHICLE:            '🚌',
  LIBRARY_STUDY_ROOM: '📚',
}

const TYPE_BG = {
  LECTURE_HALL:       'bg-blue-50',
  COMPUTER_LAB:       'bg-purple-50',
  SPORTS_FACILITY:    'bg-green-50',
  MEETING_ROOM:       'bg-sky-50',
  VEHICLE:            'bg-amber-50',
  LIBRARY_STUDY_ROOM: 'bg-teal-50',
}

const TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED']

function formatDate(dt) {
  return new Date(dt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime(dt) {
  return new Date(dt).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  })
}

function calcDuration(start, end) {
  const mins = (new Date(end) - new Date(start)) / 60000
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]  = useState(true)
  const [tab, setTab]          = useState('ALL')

  useEffect(() => { fetchBookings() }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { data } = await getMyBookings()
      setBookings(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load bookings.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await deleteBooking(id)
      setBookings(prev => prev.filter(b => b.id !== id))
      toast.success('Booking cancelled.')
    } catch {
      toast.error('Failed to cancel.')
    }
  }

  const filtered = tab === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === tab)

  const counts = {
    PENDING:  bookings.filter(b => b.status === 'PENDING').length,
    APPROVED: bookings.filter(b => b.status === 'APPROVED').length,
    REJECTED: bookings.filter(b => b.status === 'REJECTED').length,
  }

  return (
    <div>
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden mb-6"
           style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}>
        <div className="px-8 py-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">My Bookings</h1>
              <p className="text-blue-200 text-sm">Track and manage your resource reservations</p>
            </div>
            <Link
              to="/bookings/new"
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25
                         border border-white/30 text-white text-sm font-medium
                         px-4 py-2.5 rounded-xl transition-colors">
              + New Booking
            </Link>
          </div>
          <div className="flex gap-8">
            {[
              { label: 'Pending',  count: counts.PENDING,  color: 'text-amber-300' },
              { label: 'Approved', count: counts.APPROVED, color: 'text-green-300' },
              { label: 'Rejected', count: counts.REJECTED, color: 'text-red-300' },
              { label: 'Total',    count: bookings.length, color: 'text-white' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-blue-300 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all
              ${tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {t === 'ALL' ? 'All' : STATUS_CONFIG[t].label}
            {t !== 'ALL' && counts[t] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs
                ${t === 'PENDING'  ? 'bg-amber-100 text-amber-700'  : ''}
                ${t === 'APPROVED' ? 'bg-green-100 text-green-700'  : ''}
                ${t === 'REJECTED' ? 'bg-red-100 text-red-700'      : ''}
              `}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-20 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-20">
          <p className="text-4xl mb-4">📅</p>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No bookings found</h3>
          <p className="text-sm text-gray-400 mb-5">
            {tab === 'ALL'
              ? "You haven't made any bookings yet."
              : `No ${STATUS_CONFIG[tab].label.toLowerCase()} bookings.`}
          </p>
          <Link to="/resources" className="btn-primary inline-block">
            Browse resources
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => {
            const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING
            const icon   = TYPE_ICON[booking.resourceType] ?? '📦'
            const iconBg = TYPE_BG[booking.resourceType]  ?? 'bg-gray-50'

            return (
              <div key={booking.id}
                className="bg-white rounded-2xl border border-gray-100
                           hover:shadow-md transition-all duration-200">

                {/* Status accent bar */}
                <div className={`h-0.5 rounded-t-2xl ${
                  booking.status === 'APPROVED' ? 'bg-green-400' :
                  booking.status === 'REJECTED' ? 'bg-red-400' :
                  'bg-amber-400'
                }`} />

                <div className="p-4 flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center
                                   justify-center text-xl flex-shrink-0 ${iconBg}`}>
                    {icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {booking.resourceName}
                      </h3>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1
                                        px-2.5 py-1 rounded-full text-xs font-medium border
                                        ${status.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      📅 {formatDate(booking.startTime)} &nbsp;·&nbsp;
                      🕐 {formatTime(booking.startTime)} – {formatTime(booking.endTime)} &nbsp;·&nbsp;
                      ⏱ {calcDuration(booking.startTime, booking.endTime)}
                    </p>
                    {booking.purpose && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        "{booking.purpose}"
                      </p>
                    )}
                    {booking.status === 'REJECTED' && booking.adminNote && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Reason: {booking.adminNote}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-50
                                 text-gray-600 border border-gray-100 hover:bg-gray-100
                                 transition-colors">
                      View
                    </Link>
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50
                                   text-red-600 border border-red-100 hover:bg-red-100
                                   transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}