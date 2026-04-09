import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getBookingById, updateBookingStatus, deleteBooking } from '../../api/bookingApi'
import { useAuth } from '../../hooks/useAuth'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED:   { label: 'Approved',   dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED:   { label: 'Rejected',   dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200' },
  CHECKED_IN: { label: 'Checked In', dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
}

const TYPE_ICON = {
  LECTURE_HALL: '🏛️', COMPUTER_LAB: '🖥️', SPORTS_FACILITY: '🏋️',
  MEETING_ROOM: '🪑', VEHICLE: '🚌', LIBRARY_STUDY_ROOM: '📚',
}

const TYPE_BG = {
  LECTURE_HALL: '#eff6ff', COMPUTER_LAB: '#f5f3ff', SPORTS_FACILITY: '#ecfdf5',
  MEETING_ROOM: '#f0f9ff', VEHICLE: '#fffbeb', LIBRARY_STUDY_ROOM: '#f0fdfa',
}

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function formatDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(dt) {
  if (!dt) return ''
  const [, timePart] = dt.split('T')
  const [h, m] = timePart.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayH = hour % 12 === 0 ? 12 : hour % 12
  return `${String(displayH).padStart(2, '0')}:${m} ${ampm}`
}

function formatDate(dt) {
  if (!dt) return ''
  const [datePart] = dt.split('T')
  const [y, m, d] = datePart.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec']
  return `${d} ${months[parseInt(m) - 1]} ${y}`
}

function calcDuration(start, end) {
  if (!start || !end) return ''
  const [, st] = start.split('T')
  const [, et] = end.split('T')
  const [sh, sm] = st.split(':').map(Number)
  const [eh, em] = et.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, user } = useAuth()
  const [booking, setBooking]               = useState(null)
  const [loading, setLoading]               = useState(true)
  const [adminNote, setAdminNote]           = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [actioning, setActioning]           = useState(false)

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false)

  const verifyUrl = `${window.location.origin}/verify/${id}`

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getBookingById(id)
        setBooking(data)
      } catch {
        toast.error('Booking not found.')
        navigate('/bookings')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const handleApprove = async () => {
    try {
      setActioning(true)
      const { data } = await updateBookingStatus(id, 'APPROVED', '')
      setBooking(data)
      toast.success('Booking approved!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve.')
    } finally {
      setActioning(false)
    }
  }

  const handleReject = async () => {
    if (!adminNote.trim()) {
      toast.error('Please enter a reason for rejection.')
      return
    }
    try {
      setActioning(true)
      const { data } = await updateBookingStatus(id, 'REJECTED', adminNote)
      setBooking(data)
      setShowRejectInput(false)
      toast.success('Booking rejected.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject.')
    } finally {
      setActioning(false)
    }
  }

  const handleRevert = async () => {
    try {
      setActioning(true)
      const { data } = await updateBookingStatus(id, 'PENDING', '')
      setBooking(data)
      toast.success('Booking reverted to Pending.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to revert.')
    } finally {
      setActioning(false)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      setActioning(true)
      await deleteBooking(id)
      toast.success('Booking permanently deleted.')
      navigate('/bookings')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete.')
    } finally {
      setActioning(false)
      setDeleteModal(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await deleteBooking(id)
      toast.success('Booking cancelled.')
      navigate('/bookings')
    } catch {
      toast.error('Failed to cancel.')
    }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8
                      border-b-2 border-indigo-600" />
    </div>
  )
  if (!booking) return null

  const status  = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING
  const icon    = TYPE_ICON[booking.resourceType] ?? '📦'
  const iconBg  = TYPE_BG[booking.resourceType]   ?? '#f9fafb'
  const isOwner = user?.id === booking.userId

  return (
    <div className="max-w-2xl mx-auto">

      <Link
        to="/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500
                   hover:text-gray-800 transition-colors mb-6">
        ← Back to Bookings
      </Link>

      {/* ── Main Card ─────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden mb-4">

        <div className={`h-1 ${
          booking.status === 'APPROVED'   ? 'bg-green-400' :
          booking.status === 'REJECTED'   ? 'bg-red-400'   :
          booking.status === 'CHECKED_IN' ? 'bg-blue-400'  : 'bg-amber-400'
        }`} />

        {/* Header */}
        <div className="px-6 py-5 flex items-center gap-4
                        border-b border-gray-50 bg-white">
          <div className="w-14 h-14 rounded-2xl flex items-center
                          justify-center text-3xl flex-shrink-0"
               style={{ background: iconBg }}>
            {icon}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {booking.resourceName}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Booking #{booking.id?.slice(-6).toUpperCase()}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5
                           rounded-full text-sm font-medium border
                           ${status.badge}`}>
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            {status.label}
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5">

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Date',      value: formatDate(booking.startTime) },
              { label: 'Time',      value: `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}` },
              { label: 'Duration',  value: calcDuration(booking.startTime, booking.endTime) },
              { label: 'Booked by', value: booking.userName ?? booking.userEmail ?? 'You' },
              { label: 'Submitted', value: formatDateTime(booking.createdAt) },
              booking.checkedInAt
                ? { label: 'Checked in', value: formatDateTime(booking.checkedInAt) }
                : null,
            ].filter(Boolean).map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-medium text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Purpose */}
          <div className="mb-5">
            <h2 className="text-xs font-semibold text-gray-400
                           uppercase tracking-wider mb-2">
              Purpose
            </h2>
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {booking.purpose}
              </p>
            </div>
          </div>

          {/* Admin note */}
          {booking.adminNote && (
            <div className={`rounded-xl px-4 py-3 mb-5 border ${
              booking.status === 'REJECTED'
                ? 'bg-red-50 border-red-100'
                : 'bg-green-50 border-green-100'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                booking.status === 'REJECTED'
                  ? 'text-red-500' : 'text-green-600'
              }`}>
                {booking.status === 'REJECTED' ? 'Rejection reason' : 'Admin note'}
              </p>
              <p className="text-sm text-gray-700">{booking.adminNote}</p>
            </div>
          )}

          {/* Checked in banner */}
          {booking.status === 'CHECKED_IN' && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl
                            px-4 py-3 mb-5 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Successfully Checked In
                </p>
                <p className="text-xs text-blue-500">
                  {booking.checkedInAt
                    ? `at ${formatDateTime(booking.checkedInAt)}`
                    : ''}
                </p>
              </div>
            </div>
          )}

          {/* User cancel — only PENDING */}
          {isOwner && !isAdmin && booking.status === 'PENDING' && (
            <button
              onClick={handleCancel}
              className="w-full text-sm text-red-600 border border-red-100
                         bg-red-50 rounded-xl py-2.5 hover:bg-red-100
                         transition-colors">
              Cancel this booking
            </button>
          )}
        </div>
      </div>

      {/* ── QR Code — APPROVED only ───────────────────── */}
      {booking.status === 'APPROVED' && (
        <div className="rounded-2xl border border-green-100 bg-green-50/30
                        px-6 py-5 mb-4">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-gray-800 mb-1">
                📱 Check-in QR Code
              </h2>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Show this QR code at the resource location.
                Staff will scan it to verify and check you in.
              </p>
              <div className="flex items-center gap-2 bg-green-100 border
                              border-green-200 rounded-xl px-3 py-2 w-fit">
                <span className="text-green-600 text-sm">✓</span>
                <span className="text-xs font-medium text-green-700">
                  Valid for {formatDate(booking.startTime)} · {formatTime(booking.startTime)}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 bg-white p-3 rounded-2xl
                            border border-green-100 shadow-sm">
              <QRCodeSVG
                value={verifyUrl}
                size={120}
                bgColor="#ffffff"
                fgColor="#1e3a5f"
                level="M"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Controls ────────────────────────────── */}
      {isAdmin && (
        <div className="rounded-2xl border border-orange-100
                        bg-orange-50/40 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            ⚙️ Admin Controls
          </h2>

          {/* PENDING — approve + reject */}
          {booking.status === 'PENDING' && !showRejectInput && (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={actioning}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl
                           bg-green-600 text-white hover:bg-green-700
                           transition-colors disabled:opacity-50">
                ✓ Approve
              </button>
              <button
                onClick={() => setShowRejectInput(true)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl
                           bg-red-50 text-red-600 border border-red-200
                           hover:bg-red-100 transition-colors">
                ✗ Reject
              </button>
            </div>
          )}

          {/* Reject form */}
          {booking.status === 'PENDING' && showRejectInput && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Reason for rejection <span className="text-red-400">*</span>
                </label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="e.g. Room reserved for faculty on that day..."
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={actioning}
                  className="flex-1 py-2 text-sm font-medium rounded-xl
                             bg-red-600 text-white hover:bg-red-700
                             transition-colors disabled:opacity-50">
                  Confirm rejection
                </button>
                <button
                  onClick={() => { setShowRejectInput(false); setAdminNote('') }}
                  className="px-4 py-2 text-sm rounded-xl bg-gray-100
                             text-gray-600 hover:bg-gray-200 transition-colors">
                  Back
                </button>
              </div>
            </div>
          )}

          {/* Revert — only APPROVED and REJECTED */}
          {(booking.status === 'APPROVED' ||
            booking.status === 'REJECTED') && (
            <button
              onClick={handleRevert}
              disabled={actioning}
              className="w-full py-2.5 text-sm font-medium rounded-xl
                         bg-orange-50 text-orange-600 border border-orange-200
                         hover:bg-orange-100 transition-colors disabled:opacity-50
                         mt-3">
              ↩ Revert to Pending
            </button>
          )}

          {/* CHECKED_IN — delete only */}
          {booking.status === 'CHECKED_IN' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl
                              px-4 py-3 text-center">
                <p className="text-sm font-semibold text-blue-700">
                  ✅ Booking Completed
                </p>
                <p className="text-xs text-blue-500 mt-0.5">
                  This booking has been checked in and is complete.
                </p>
              </div>
              <button
                onClick={() => setDeleteModal(true)}
                disabled={actioning}
                className="w-full py-2.5 text-sm font-medium rounded-xl
                           bg-red-50 text-red-600 border border-red-200
                           hover:bg-red-100 transition-colors disabled:opacity-50">
                🗑 Delete this record
              </button>
            </div>
          )}

          {/* REJECTED — delete option */}
          {booking.status === 'REJECTED' && (
            <button
              onClick={() => setDeleteModal(true)}
              disabled={actioning}
              className="w-full py-2.5 text-sm font-medium rounded-xl
                         bg-red-50 text-red-600 border border-red-200
                         hover:bg-red-100 transition-colors disabled:opacity-50
                         mt-3">
              🗑 Delete this record
            </button>
          )}
        </div>
      )}

      {/* View resource link */}
      <div className="text-center mt-4">
        <Link
          to={`/resources/${booking.resourceId}`}
          className="text-sm text-indigo-600 hover:underline">
          View resource details →
        </Link>
      </div>

      {/* ── Delete Modal ──────────────────────────────── */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center
                            justify-center text-red-600 text-xl flex-shrink-0">
              🗑
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Delete Booking</h3>
              <p className="text-xs text-gray-400">
                This action is permanent and cannot be undone
              </p>
            </div>
          </div>

          {/* Extra warning for CHECKED_IN */}
          {booking.status === 'CHECKED_IN' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl
                            p-4 mb-4">
              <p className="text-sm text-blue-800 font-semibold mb-1">
                ℹ️ This booking was checked in
              </p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Deleting this record will remove all evidence that this
                resource was used. This will affect usage history and
                analytics. Only delete if absolutely necessary.
              </p>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <p className="text-sm text-red-800 font-semibold mb-1">
              ⚠️ Permanent deletion
            </p>
            <p className="text-sm text-red-700 leading-relaxed">
              You are about to permanently delete the booking for{' '}
              <span className="font-semibold">{booking.resourceName}</span>
              {' '}by{' '}
              <span className="font-semibold">
                {booking.userName ?? booking.userEmail}
              </span>.
              {' '}This record will be gone forever.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
            {[
              { label: 'Resource', value: booking.resourceName },
              { label: 'User',     value: booking.userName ?? booking.userEmail },
              { label: 'Date',     value: formatDate(booking.startTime) },
              { label: 'Time',     value: `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}` },
              { label: 'Status',   value: booking.status },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{row.label}</span>
                <span className="font-medium text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeleteConfirm}
              disabled={actioning}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl
                         bg-red-600 text-white hover:bg-red-700
                         transition-colors disabled:opacity-50">
              {actioning ? 'Deleting...' : '🗑 Yes, delete permanently'}
            </button>
            <button
              onClick={() => setDeleteModal(false)}
              className="px-4 py-2.5 text-sm rounded-xl bg-gray-100
                         text-gray-600 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}