import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getBookingById, updateBookingStatus, deleteBooking } from '../../api/bookingApi'
import { useAuth } from '../../hooks/useAuth'
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

const TYPE_BG = {
  LECTURE_HALL: '#eff6ff', COMPUTER_LAB: '#f5f3ff', SPORTS_FACILITY: '#ecfdf5',
  MEETING_ROOM: '#f0f9ff', VEHICLE: '#fffbeb', LIBRARY_STUDY_ROOM: '#f0fdfa',
}

function formatDateTime(dt) {
  return new Date(dt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(dt) {
  return new Date(dt).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function calcDuration(start, end) {
  const mins = (new Date(end) - new Date(start)) / 60000
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, user } = useAuth()
  const [booking, setBooking]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [adminNote, setAdminNote] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [actioning, setActioning] = useState(false)

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
      const { data } = await updateBookingStatus(id, 'APPROVED', adminNote)
      setBooking(data)
      toast.success('Booking approved!')
    } catch { toast.error('Failed to approve.') }
    finally { setActioning(false) }
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
    } catch { toast.error('Failed to reject.') }
    finally { setActioning(false) }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await deleteBooking(id)
      toast.success('Booking cancelled.')
      navigate(isAdmin ? '/admin/bookings' : '/bookings')
    } catch { toast.error('Failed to cancel.') }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )
  if (!booking) return null

  const status  = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING
  const icon    = TYPE_ICON[booking.resourceType] ?? '📦'
  const iconBg  = TYPE_BG[booking.resourceType]  ?? '#f9fafb'
  const isOwner = user?.id === booking.userId

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={isAdmin ? '/admin/bookings' : '/bookings'}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500
                   hover:text-gray-800 transition-colors mb-6">
        ← Back
      </Link>

      {/* Main card */}
      <div className="rounded-2xl border border-gray-100 overflow-hidden mb-4">

        {/* Status accent */}
        <div className={`h-1 ${
          booking.status === 'APPROVED' ? 'bg-green-400' :
          booking.status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400'
        }`} />

        {/* Header */}
        <div className="px-6 py-5 flex items-center gap-4 border-b border-gray-50 bg-white">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
               style={{ background: iconBg }}>
            {icon}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{booking.resourceName}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Booking #{booking.id?.slice(-6).toUpperCase()}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full
                           text-sm font-medium border ${status.badge}`}>
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            {status.label}
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5">

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Date',     value: formatDate(booking.startTime) },
              { label: 'Time',     value: `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}` },
              { label: 'Duration', value: calcDuration(booking.startTime, booking.endTime) },
              { label: 'Booked by', value: booking.userName ?? booking.userEmail ?? 'You' },
              { label: 'Submitted', value: formatDateTime(booking.createdAt) },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-medium text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Purpose */}
          <div className="mb-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                booking.status === 'REJECTED' ? 'text-red-500' : 'text-green-600'
              }`}>
                {booking.status === 'REJECTED' ? 'Rejection reason' : 'Admin note'}
              </p>
              <p className="text-sm text-gray-700">{booking.adminNote}</p>
            </div>
          )}

          {/* User cancel option */}
          {isOwner && booking.status === 'PENDING' && !isAdmin && (
            <button
              onClick={handleCancel}
              className="w-full text-sm text-red-600 border border-red-100
                         bg-red-50 rounded-xl py-2.5 hover:bg-red-100 transition-colors">
              Cancel this booking
            </button>
          )}

        </div>
      </div>

      {/* Admin panel */}
      {isAdmin && booking.status === 'PENDING' && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50/40 px-5 py-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            ⚙️ Admin Controls
          </h2>

          {!showRejectInput ? (
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
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 text-sm rounded-xl bg-gray-100
                           text-gray-600 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          ) : (
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
        </div>
      )}

      {/* View resource link */}
      <div className="text-center">
        <Link
          to={`/resources/${booking.resourceId}`}
          className="text-sm text-indigo-600 hover:underline">
          View resource details →
        </Link>
      </div>
    </div>
  )
}