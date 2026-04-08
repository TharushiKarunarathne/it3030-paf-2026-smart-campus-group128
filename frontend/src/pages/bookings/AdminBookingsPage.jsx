import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllBookings, updateBookingStatus, deleteBooking } from '../../api/bookingApi'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending',  dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejected', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200' },
}

const TYPE_ICON = {
  LECTURE_HALL: '🏛️', COMPUTER_LAB: '🖥️', SPORTS_FACILITY: '🏋️',
  MEETING_ROOM: '🪑', VEHICLE: '🚌', LIBRARY_STUDY_ROOM: '📚',
}

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

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('PENDING')
  const [search, setSearch]     = useState('')
  const [rejectId, setRejectId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [actioning, setActioning]   = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const { data } = await getAllBookings()
      setBookings(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load bookings.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      setActioning(true)
      const { data } = await updateBookingStatus(id, 'APPROVED', '')
      setBookings(prev => prev.map(b => b.id === id ? data : b))
      toast.success('Booking approved!')
    } catch { toast.error('Failed to approve.') }
    finally { setActioning(false) }
  }

  const handleRejectConfirm = async () => {
    if (!rejectNote.trim()) {
      toast.error('Please enter a rejection reason.')
      return
    }
    try {
      setActioning(true)
      const { data } = await updateBookingStatus(rejectId, 'REJECTED', rejectNote)
      setBookings(prev => prev.map(b => b.id === rejectId ? data : b))
      setRejectId(null)
      setRejectNote('')
      toast.success('Booking rejected.')
    } catch { toast.error('Failed to reject.') }
    finally { setActioning(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this booking permanently?')) return
    try {
      await deleteBooking(id)
      setBookings(prev => prev.filter(b => b.id !== id))
      toast.success('Booking deleted.')
    } catch { toast.error('Failed to delete.') }
  }

  const counts = {
    PENDING:  bookings.filter(b => b.status === 'PENDING').length,
    APPROVED: bookings.filter(b => b.status === 'APPROVED').length,
    REJECTED: bookings.filter(b => b.status === 'REJECTED').length,
  }

  const filtered = bookings
    .filter(b => tab === 'ALL' || b.status === tab)
    .filter(b => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        b.resourceName?.toLowerCase().includes(q) ||
        b.userEmail?.toLowerCase().includes(q) ||
        b.userName?.toLowerCase().includes(q) ||
        b.purpose?.toLowerCase().includes(q)
      )
    })

  return (
    <div>
      {/* Hero */}
      <div className="rounded-2xl overflow-hidden mb-6"
           style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}>
        <div className="px-8 py-7">
          <h1 className="text-2xl font-bold text-white mb-1">Booking Queue</h1>
          <p className="text-blue-200 text-sm mb-4">
            Review and approve all campus resource requests
          </p>
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

      {/* Search + Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          className="input flex-1 min-w-[200px]"
          placeholder="Search by name, resource, or purpose..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${tab === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {t === 'ALL' ? 'All' : STATUS_CONFIG[t].label}
              {t !== 'ALL' && counts[t] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs
                  ${t === 'PENDING'  ? 'bg-amber-100 text-amber-700' : ''}
                  ${t === 'APPROVED' ? 'bg-green-100 text-green-700' : ''}
                  ${t === 'REJECTED' ? 'bg-red-100 text-red-700'     : ''}
                `}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">
        Showing {filtered.length} bookings
      </p>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Reject booking</h3>
            <p className="text-sm text-gray-500 mb-4">
              Provide a reason so the user understands why.
            </p>
            <textarea
              className="input resize-none mb-4"
              rows={3}
              placeholder="e.g. Room reserved for faculty on that day..."
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={handleRejectConfirm}
                disabled={actioning}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl
                           bg-red-600 text-white hover:bg-red-700
                           transition-colors disabled:opacity-50">
                Confirm rejection
              </button>
              <button
                onClick={() => { setRejectId(null); setRejectNote('') }}
                className="px-4 py-2.5 text-sm rounded-xl bg-gray-100
                           text-gray-600 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-24 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-20">
          <p className="text-4xl mb-4">📋</p>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No bookings</h3>
          <p className="text-sm text-gray-400">
            {tab === 'PENDING' ? 'No pending requests right now.' : 'Nothing to show here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => {
            const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING
            const icon   = TYPE_ICON[booking.resourceType] ?? '📦'

            return (
              <div key={booking.id}
                className="bg-white rounded-2xl border border-gray-100
                           hover:shadow-md transition-all duration-200">

                <div className={`h-0.5 rounded-t-2xl ${
                  booking.status === 'APPROVED' ? 'bg-green-400' :
                  booking.status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400'
                }`} />

                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center
                                      justify-center text-lg flex-shrink-0">
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">
                            {booking.userName ?? booking.userEmail}
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className="text-sm text-gray-700">{booking.resourceName}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(booking.startTime)} &nbsp;·&nbsp;
                          {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                        </p>
                        {booking.purpose && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">
                            "{booking.purpose}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`flex-shrink-0 inline-flex items-center gap-1
                                      px-2.5 py-1 rounded-full text-xs font-medium border
                                      ${status.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </div>
                  </div>

                  {/* Admin note if rejected */}
                  {booking.adminNote && booking.status === 'REJECTED' && (
                    <p className="text-xs text-red-500 mb-2 ml-12">
                      Reason: {booking.adminNote}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 ml-12">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(booking.id)}
                          disabled={actioning}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-green-50
                                     text-green-700 border border-green-200
                                     hover:bg-green-100 transition-colors font-medium
                                     disabled:opacity-50">
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => { setRejectId(booking.id); setRejectNote('') }}
                          className="flex-1 text-xs py-1.5 rounded-lg bg-red-50
                                     text-red-600 border border-red-200
                                     hover:bg-red-100 transition-colors font-medium">
                          ✗ Reject
                        </button>
                      </>
                    )}
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-50
                                 text-gray-600 border border-gray-100
                                 hover:bg-gray-100 transition-colors">
                      View
                    </Link>
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50
                                 text-red-600 border border-red-100
                                 hover:bg-red-100 transition-colors">
                      Delete
                    </button>
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