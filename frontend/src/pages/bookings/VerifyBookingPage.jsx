import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { verifyBooking, checkInBooking } from '../../api/bookingApi'

const TYPE_ICON = {
  LECTURE_HALL: '🏛️', COMPUTER_LAB: '🖥️', SPORTS_FACILITY: '🏋️',
  MEETING_ROOM: '🪑', VEHICLE: '🚌', LIBRARY_STUDY_ROOM: '📚',
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

export default function VerifyBookingPage() {
  const { id } = useParams()
  const [booking, setBooking]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkedIn, setCheckedIn]   = useState(false)

  useEffect(() => {
    verifyBooking(id)
      .then(({ data }) => setBooking(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true)
      const { data } = await checkInBooking(id)
      setBooking(data)
      setCheckedIn(true)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check in.')
    } finally {
      setCheckingIn(false)
    }
  }

  // ── Loading ────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10
                      border-b-2 border-indigo-600" />
    </div>
  )

  // ── Not Found ──────────────────────────────────────
  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl border border-red-100
                      p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center
                        justify-center text-3xl mx-auto mb-4">
          ❌
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Booking Not Found
        </h1>
        <p className="text-sm text-gray-500">
          This QR code is invalid or the booking has been deleted.
        </p>
      </div>
    </div>
  )

  const icon       = TYPE_ICON[booking.resourceType] ?? '📦'
  const isApproved  = booking.status === 'APPROVED'
  const isCheckedIn = booking.status === 'CHECKED_IN'
  const isRejected  = booking.status === 'REJECTED'
  const isPending   = booking.status === 'PENDING'

  // ── Already Checked In ─────────────────────────────
  if (isCheckedIn || checkedIn) return (
    <div className="min-h-screen bg-gray-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl border border-blue-100
                      p-8 max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center
                        justify-center text-4xl mx-auto mb-4">
          ✅
        </div>
        <h1 className="text-2xl font-bold text-blue-700 mb-1">
          Checked In!
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Successfully verified and checked in
        </p>

        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2.5">
          {[
            { label: 'Resource', value: `${icon} ${booking.resourceName}` },
            { label: 'User',     value: booking.userName ?? booking.userEmail },
            { label: 'Date',     value: formatDate(booking.startTime) },
            { label: 'Time',     value: `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}` },
            { label: 'Duration', value: calcDuration(booking.startTime, booking.endTime) },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-sm">
              <span className="text-gray-400">{row.label}</span>
              <span className="font-medium text-gray-800">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-gray-400">
          Smart Campus · Check-in Verified
        </div>
      </div>
    </div>
  )

  // ── Invalid status ─────────────────────────────────
  if (isPending || isRejected) return (
    <div className="min-h-screen bg-gray-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl border border-red-100
                      p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center
                        justify-center text-3xl mx-auto mb-4">
          ⚠️
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Booking Not Valid
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          This booking is currently{' '}
          <span className="font-semibold">{booking.status}</span>.
        </p>
        <p className="text-xs text-gray-400">
          Only approved bookings can be checked in.
        </p>
        {isRejected && booking.adminNote && (
          <div className="mt-4 bg-red-50 border border-red-100
                          rounded-xl px-4 py-3 text-left">
            <p className="text-xs text-red-500 font-semibold mb-1">
              Rejection reason
            </p>
            <p className="text-sm text-red-700">{booking.adminNote}</p>
          </div>
        )}
      </div>
    </div>
  )

  // ── Valid APPROVED — show check-in screen ──────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center
                    justify-center p-4">
      <div className="bg-white rounded-2xl border border-green-100
                      w-full max-w-sm overflow-hidden shadow-sm">

        {/* Header */}
        <div className="px-6 py-5 text-center"
             style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}>
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center
                          justify-center text-4xl mx-auto mb-3">
            {icon}
          </div>
          <h1 className="text-xl font-bold text-white mb-0.5">
            {booking.resourceName}
          </h1>
          <div className="inline-flex items-center gap-2 bg-green-400/20
                          border border-green-300/30 rounded-full
                          px-3 py-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-200 text-xs font-medium">
              Approved Booking
            </span>
          </div>
        </div>

        {/* Booking details */}
        <div className="px-6 py-5">
          <div className="space-y-3 mb-6">
            {[
              { icon: '👤', label: 'Booked by', value: booking.userName ?? booking.userEmail },
              { icon: '📅', label: 'Date',      value: formatDate(booking.startTime) },
              { icon: '🕐', label: 'Time',      value: `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}` },
              { icon: '⏱',  label: 'Duration',  value: calcDuration(booking.startTime, booking.endTime) },
              { icon: '📝', label: 'Purpose',   value: booking.purpose },
            ].map(row => (
              <div key={row.label}
                className="flex items-start gap-3 bg-gray-50
                           rounded-xl px-4 py-3">
                <span className="text-base flex-shrink-0 mt-0.5">
                  {row.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{row.label}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {row.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Check in button */}
          <button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="w-full py-3.5 text-sm font-semibold rounded-xl
                       bg-green-600 text-white hover:bg-green-700
                       transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed">
            {checkingIn ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30
                                border-t-white rounded-full animate-spin" />
                Checking in...
              </span>
            ) : (
              '✓ Mark as Checked In'
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Only staff or admin should tap this button
          </p>
        </div>
      </div>
    </div>
  )
}