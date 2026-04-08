import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyBookings,
  getAllBookings,
  deleteBooking,
  updateBookingStatus,
} from '../../api/bookingApi'
import { useAuth } from '../../hooks/useAuth'
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

// ── Reusable Modal ─────────────────────────────────────
function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center
                    justify-center z-50 p-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl"
           onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default function BookingsPage() {
  const { isAdmin } = useAuth()
  const [bookings, setBookings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('ALL')
  const [search, setSearch]         = useState('')
  const [actioning, setActioning]   = useState(false)

  // Approve modal state
  const [approveModal, setApproveModal]   = useState(false)
  const [approveBooking, setApproveBooking] = useState(null)

  // Revert modal state
  const [revertModal, setRevertModal]   = useState(false)
  const [revertBooking, setRevertBooking] = useState(null)

  // Reject modal state
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectBooking, setRejectBooking] = useState(null)
  const [rejectNote, setRejectNote]   = useState('')

  useEffect(() => { fetchBookings() }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { data } = isAdmin
        ? await getAllBookings()
        : await getMyBookings()
      setBookings(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load bookings.')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  // ── Open modals ────────────────────────────────────

  const openApprove = (booking) => {
    setApproveBooking(booking)
    setApproveModal(true)
  }

  const openReject = (booking) => {
    setRejectBooking(booking)
    setRejectNote('')
    setRejectModal(true)
  }

  const openRevert = (booking) => {
    setRevertBooking(booking)
    setRevertModal(true)
  }

  // ── Actions ────────────────────────────────────────

  const handleApproveConfirm = async () => {
    try {
      setActioning(true)
      const { data } = await updateBookingStatus(approveBooking.id, 'APPROVED', '')
      setBookings(prev => prev.map(b => b.id === approveBooking.id ? data : b))
      toast.success('Booking approved!')
      setApproveModal(false)
      setApproveBooking(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve.')
    } finally {
      setActioning(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectNote.trim()) {
      toast.error('Please enter a rejection reason.')
      return
    }
    try {
      setActioning(true)
      const { data } = await updateBookingStatus(rejectBooking.id, 'REJECTED', rejectNote)
      setBookings(prev => prev.map(b => b.id === rejectBooking.id ? data : b))
      toast.success('Booking rejected.')
      setRejectModal(false)
      setRejectBooking(null)
      setRejectNote('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject.')
    } finally {
      setActioning(false)
    }
  }

  const handleRevertConfirm = async () => {
    try {
      setActioning(true)
      const { data } = await updateBookingStatus(revertBooking.id, 'PENDING', '')
      setBookings(prev => prev.map(b => b.id === revertBooking.id ? data : b))
      toast.success('Booking reverted to Pending.')
      setRevertModal(false)
      setRevertBooking(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to revert.')
    } finally {
      setActioning(false)
    }
  }

  const handleCancel = async (id) => {
    try {
      await deleteBooking(id)
      setBookings(prev => prev.filter(b => b.id !== id))
      toast.success('Booking cancelled.')
    } catch {
      toast.error('Failed to cancel.')
    }
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
        b.userName?.toLowerCase().includes(q) ||
        b.userEmail?.toLowerCase().includes(q) ||
        b.purpose?.toLowerCase().includes(q)
      )
    })

  return (
    <div>

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden mb-6"
           style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}>
        <div className="px-8 py-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {isAdmin ? 'All Bookings' : 'My Bookings'}
              </h1>
              <p className="text-blue-200 text-sm">
                {isAdmin
                  ? 'Review and manage all campus resource booking requests'
                  : 'Track and manage your resource reservations'}
              </p>
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

      {/* ── Search (admin only) ───────────────────────── */}
      {isAdmin && (
        <div className="mb-4">
          <input
            className="input w-full max-w-sm"
            placeholder="Search by name, resource or purpose..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────── */}
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
                ${t === 'REJECTED' ? 'bg-red-100   text-red-700'    : ''}
              `}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">
        Showing {filtered.length} bookings
      </p>

      {/* ── Booking List ──────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i}
              className="bg-white rounded-2xl border border-gray-100 p-4 h-24 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-20">
          <p className="text-4xl mb-4">📅</p>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No bookings found
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            {tab === 'ALL'
              ? isAdmin
                ? 'No bookings have been made yet.'
                : "You haven't made any bookings yet."
              : `No ${STATUS_CONFIG[tab]?.label.toLowerCase()} bookings.`
            }
          </p>
          <Link to="/bookings/new" className="btn-primary inline-block">
            Make a booking
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => {
            const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING
            const icon   = TYPE_ICON[booking.resourceType] ?? '📦'
            const iconBg = TYPE_BG[booking.resourceType]   ?? 'bg-gray-50'

            return (
              <div key={booking.id}
                className="bg-white rounded-2xl border border-gray-100
                           hover:shadow-md transition-all duration-200">

                <div className={`h-0.5 rounded-t-2xl ${
                  booking.status === 'APPROVED' ? 'bg-green-400' :
                  booking.status === 'REJECTED' ? 'bg-red-400'   : 'bg-amber-400'
                }`} />

                <div className="p-4">
                  <div className="flex items-start gap-4">

                    <div className={`w-10 h-10 rounded-xl flex items-center
                                     justify-center text-xl flex-shrink-0 ${iconBg}`}>
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {booking.resourceName}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1
                                          rounded-full text-xs font-medium border
                                          ${status.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>

                      {isAdmin && (
                        <p className="text-xs text-indigo-600 font-medium mb-0.5">
                          👤 {booking.userName ?? booking.userEmail ?? 'Unknown user'}
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        📅 {formatDate(booking.startTime)} &nbsp;·&nbsp;
                        🕐 {formatTime(booking.startTime)} – {formatTime(booking.endTime)} &nbsp;·&nbsp;
                        ⏱ {calcDuration(booking.startTime, booking.endTime)}
                      </p>

                      {booking.purpose && (
                        <p className="text-xs text-gray-400 mt-0.5 italic truncate">
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
                    <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                      <Link
                        to={`/bookings/${booking.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-50
                                   text-gray-600 border border-gray-100
                                   hover:bg-gray-100 transition-colors">
                        View
                      </Link>

                      {/* Admin PENDING — approve + reject */}
                      {isAdmin && booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => openApprove(booking)}
                            disabled={actioning}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-50
                                       text-green-700 border border-green-200
                                       hover:bg-green-100 transition-colors font-medium
                                       disabled:opacity-50">
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => openReject(booking)}
                            disabled={actioning}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-50
                                       text-red-600 border border-red-200
                                       hover:bg-red-100 transition-colors font-medium
                                       disabled:opacity-50">
                            ✗ Reject
                          </button>
                        </>
                      )}

                      {/* Admin APPROVED or REJECTED — revert */}
                      {isAdmin && booking.status !== 'PENDING' && (
                        <button
                          onClick={() => openRevert(booking)}
                          disabled={actioning}
                          className="text-xs px-3 py-1.5 rounded-lg bg-orange-50
                                     text-orange-600 border border-orange-200
                                     hover:bg-orange-100 transition-colors font-medium
                                     disabled:opacity-50">
                          ↩ Revert
                        </button>
                      )}

                      {/* User — cancel own PENDING booking */}
                      {!isAdmin && booking.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50
                                     text-red-600 border border-red-100
                                     hover:bg-red-100 transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Approve Modal ─────────────────────────────── */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)}>
        {approveBooking && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center
                              justify-center text-green-600 text-xl">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Approve Booking</h3>
                <p className="text-xs text-gray-400">
                  Please confirm the details before approving
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2.5">
              {[
                { label: 'Resource',     value: approveBooking.resourceName },
                { label: 'Requested by', value: approveBooking.userName ?? approveBooking.userEmail },
                { label: 'Date',         value: formatDate(approveBooking.startTime) },
                { label: 'Time',         value: `${formatTime(approveBooking.startTime)} – ${formatTime(approveBooking.endTime)}` },
                { label: 'Duration',     value: calcDuration(approveBooking.startTime, approveBooking.endTime) },
                { label: 'Purpose',      value: approveBooking.purpose },
              ].filter(row => row.value).map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-900 text-right max-w-[55%]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApproveConfirm}
                disabled={actioning}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl
                           bg-green-600 text-white hover:bg-green-700
                           transition-colors disabled:opacity-50">
                {actioning ? 'Approving...' : '✓ Yes, approve'}
              </button>
              <button
                onClick={() => { setApproveModal(false); setApproveBooking(null) }}
                className="px-4 py-2.5 text-sm rounded-xl bg-gray-100
                           text-gray-600 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Reject Modal ──────────────────────────────── */}
      <Modal open={rejectModal} onClose={() => setRejectModal(false)}>
        {rejectBooking && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center
                              justify-center text-red-600 text-xl">
                ✗
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Reject Booking</h3>
                <p className="text-xs text-gray-400">
                  {rejectBooking.resourceName} · {rejectBooking.userName ?? rejectBooking.userEmail}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Reason for rejection <span className="text-red-400">*</span>
              </label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="e.g. Room reserved for faculty on that day..."
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                This reason will be shown to the user.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRejectConfirm}
                disabled={actioning}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl
                           bg-red-600 text-white hover:bg-red-700
                           transition-colors disabled:opacity-50">
                {actioning ? 'Rejecting...' : '✗ Confirm rejection'}
              </button>
              <button
                onClick={() => { setRejectModal(false); setRejectBooking(null); setRejectNote('') }}
                className="px-4 py-2.5 text-sm rounded-xl bg-gray-100
                           text-gray-600 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Revert Modal ──────────────────────────────── */}
      <Modal open={revertModal} onClose={() => setRevertModal(false)}>
        {revertBooking && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center
                              justify-center text-orange-600 text-xl">
                ↩
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Revert Booking</h3>
                <p className="text-xs text-gray-400">
                  This will undo the {revertBooking.status.toLowerCase()} decision
                </p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-5">
              <p className="text-sm text-orange-800 leading-relaxed">
                <span className="font-semibold">{revertBooking.resourceName}</span>
                {' '}booked by{' '}
                <span className="font-semibold">
                  {revertBooking.userName ?? revertBooking.userEmail}
                </span>
                {' '}will be moved back to{' '}
                <span className="font-semibold">Pending</span>.
                The admin note will be cleared and the booking will need to be reviewed again.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRevertConfirm}
                disabled={actioning}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl
                           bg-orange-500 text-white hover:bg-orange-600
                           transition-colors disabled:opacity-50">
                {actioning ? 'Reverting...' : '↩ Yes, revert to Pending'}
              </button>
              <button
                onClick={() => { setRevertModal(false); setRevertBooking(null) }}
                className="px-4 py-2.5 text-sm rounded-xl bg-gray-100
                           text-gray-600 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}