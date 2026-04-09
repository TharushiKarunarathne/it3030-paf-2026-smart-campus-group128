import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getBookingById, updateBookingStatus, deleteBooking } from '../../api/bookingApi'
import { useAuth } from '../../hooks/useAuth'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',    strip: 'from-amber-500 to-amber-600',   icon: '⏳' },
  APPROVED:   { label: 'Approved',   dot: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', strip: 'from-emerald-500 to-teal-600', icon: '✓'  },
  REJECTED:   { label: 'Rejected',   dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',           strip: 'from-red-500 to-rose-600',      icon: '✕'  },
  CHECKED_IN: { label: 'Checked In', dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200',        strip: 'from-blue-500 to-indigo-600',   icon: '✅' },
}

const TYPE_CONFIG = {
  LECTURE_HALL:       { icon: '🏛️', label: 'Lecture Hall',       bg: '#eff6ff' },
  COMPUTER_LAB:       { icon: '🖥️', label: 'Computer Lab',       bg: '#f5f3ff' },
  SPORTS_FACILITY:    { icon: '🏋️', label: 'Sports / Gym',       bg: '#ecfdf5' },
  MEETING_ROOM:       { icon: '🪑', label: 'Meeting Room',       bg: '#f0f9ff' },
  VEHICLE:            { icon: '🚌', label: 'Vehicle',            bg: '#fffbeb' },
  LIBRARY_STUDY_ROOM: { icon: '📚', label: 'Library Study Room', bg: '#f0fdfa' },
}

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function fmt24(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtShortDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function calcDuration(start, end) {
  if (!start || !end) return ''
  const mins = Math.round((new Date(end) - new Date(start)) / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h} hour${h > 1 ? 's' : ''}`
}

/* ── Back button ────────────────────────────────────────────────────────── */
function BackButton({ to, label }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => to ? navigate(to) : navigate(-1)}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200
                 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900
                 shadow-sm transition-all mb-6"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
      </svg>
      {label}
    </button>
  )
}

/* ── Perforated divider ─────────────────────────────────────────────────── */
function Perforation() {
  return (
    <div className="relative flex items-center my-0 overflow-visible">
      <div className="absolute -left-5 w-9 h-9 rounded-full bg-gray-100 z-10 border border-gray-200" />
      <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-4" />
      <div className="absolute -right-5 w-9 h-9 rounded-full bg-gray-100 z-10 border border-gray-200" />
    </div>
  )
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
  const [deleteModal, setDeleteModal]       = useState(false)

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
    try { setActioning(true); const { data } = await updateBookingStatus(id, 'APPROVED', ''); setBooking(data); toast.success('Booking approved!') }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to approve.') }
    finally { setActioning(false) }
  }
  const handleReject = async () => {
    if (!adminNote.trim()) { toast.error('Please enter a reason.'); return }
    try { setActioning(true); const { data } = await updateBookingStatus(id, 'REJECTED', adminNote); setBooking(data); setShowRejectInput(false); toast.success('Booking rejected.') }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to reject.') }
    finally { setActioning(false) }
  }
  const handleRevert = async () => {
    try { setActioning(true); const { data } = await updateBookingStatus(id, 'PENDING', ''); setBooking(data); toast.success('Reverted to Pending.') }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to revert.') }
    finally { setActioning(false) }
  }
  const handleDeleteConfirm = async () => {
    try { setActioning(true); await deleteBooking(id); toast.success('Booking deleted.'); navigate('/bookings') }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to delete.') }
    finally { setActioning(false); setDeleteModal(false) }
  }
  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return
    try { await deleteBooking(id); toast.success('Booking cancelled.'); navigate('/bookings') }
    catch { toast.error('Failed to cancel.') }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!booking) return null

  const sc      = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING
  const tc      = TYPE_CONFIG[booking.resourceType] ?? { icon: '📦', label: booking.resourceType, bg: '#f9fafb' }
  const isOwner = user?.id === booking.userId

  return (
    <div className="max-w-2xl mx-auto">

      <BackButton to="/bookings" label="Back to Bookings" />

      {/* ════════════════════════════════════
          TICKET CARD
      ════════════════════════════════════ */}
      <div className="bg-white rounded-3xl overflow-visible shadow-xl border border-gray-100 mb-4">

        {/* ── Ticket Header (colored strip) ── */}
        <div className={`bg-gradient-to-r ${sc.strip} px-6 py-5 rounded-t-3xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-white/20 backdrop-blur-sm">
                {tc.icon}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">{booking.resourceName}</h1>
                <p className="text-white/70 text-xs mt-0.5">{tc.label}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="text-white font-bold text-sm">{sc.icon} {sc.label}</span>
              </div>
              <p className="text-white/50 text-[10px] mt-1">#{booking.id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* ── Ticket Body ── */}
        {booking.status === 'APPROVED' ? (
          /* Two-column layout when QR is available */
          <div className="flex">
            {/* Left: details */}
            <div className="flex-1 px-6 py-5 space-y-4">
              <DetailRow icon="📅" label="Date"     value={fmtDate(booking.startTime)} />
              <DetailRow icon="🕐" label="Time"     value={`${fmt24(booking.startTime)} – ${fmt24(booking.endTime)}`} />
              <DetailRow icon="⏱"  label="Duration" value={calcDuration(booking.startTime, booking.endTime)} />
              <DetailRow icon="👤" label="Booked by" value={booking.userName ?? booking.userEmail ?? 'You'} />
              {booking.purpose && <DetailRow icon="📝" label="Purpose" value={booking.purpose} />}
              {booking.checkedInAt && <DetailRow icon="✅" label="Checked in" value={fmtDateTime(booking.checkedInAt)} />}
            </div>

            {/* Vertical dashed divider */}
            <div className="relative flex flex-col items-center py-4 mx-0">
              <div className="absolute -top-3 w-7 h-7 rounded-full bg-gray-100 border border-gray-200 z-10" />
              <div className="flex-1 border-l-2 border-dashed border-gray-200 my-3" />
              <div className="absolute -bottom-3 w-7 h-7 rounded-full bg-gray-100 border border-gray-200 z-10" />
            </div>

            {/* Right: QR code */}
            <div className="flex flex-col items-center justify-center px-6 py-5 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <QRCodeSVG value={verifyUrl} size={110} bgColor="#ffffff" fgColor="#1e3a5f" level="M" />
              </div>
              <p className="text-[10px] text-gray-400 text-center leading-tight max-w-[110px]">
                Scan at venue to check in
              </p>
            </div>
          </div>
        ) : (
          /* Single column otherwise */
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <DetailRow icon="📅" label="Date"      value={fmtDate(booking.startTime)} />
              <DetailRow icon="🕐" label="Time"      value={`${fmt24(booking.startTime)} – ${fmt24(booking.endTime)}`} />
              <DetailRow icon="⏱"  label="Duration"  value={calcDuration(booking.startTime, booking.endTime)} />
              <DetailRow icon="👤" label="Booked by"  value={booking.userName ?? booking.userEmail ?? 'You'} />
              {booking.purpose && (
                <div className="col-span-2">
                  <DetailRow icon="📝" label="Purpose" value={booking.purpose} />
                </div>
              )}
              {booking.checkedInAt && (
                <div className="col-span-2">
                  <DetailRow icon="✅" label="Checked in" value={fmtDateTime(booking.checkedInAt)} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin note / rejection */}
        {booking.adminNote && (
          <div className="mx-6 mb-4">
            <div className={`rounded-xl px-4 py-3 border text-sm
              ${booking.status === 'REJECTED'
                ? 'bg-red-50 border-red-100 text-red-700'
                : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
              <p className="font-semibold text-xs uppercase tracking-wider mb-1 opacity-60">
                {booking.status === 'REJECTED' ? 'Rejection reason' : 'Admin note'}
              </p>
              {booking.adminNote}
            </div>
          </div>
        )}

        {/* User cancel */}
        {isOwner && !isAdmin && booking.status === 'PENDING' && (
          <div className="px-6 pb-5">
            <button onClick={handleCancel}
              className="w-full text-sm text-red-600 border border-red-100 bg-red-50
                         rounded-xl py-2.5 hover:bg-red-100 transition-colors">
              Cancel this booking
            </button>
          </div>
        )}

        {/* ── Perforated divider ── */}
        <div className="px-2">
          <Perforation />
        </div>

        {/* ── Ticket Stub ── */}
        <div className="flex items-center justify-between px-6 py-4 rounded-b-3xl">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Booking ID</p>
            <p className="text-xs font-mono font-bold text-gray-600 tracking-wider mt-0.5">
              #{booking.id?.slice(-10).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({length: 14}).map((_, i) => (
                <div key={i} className="w-1 bg-gray-200 rounded-full"
                     style={{ height: `${8 + Math.sin(i) * 4}px` }} />
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Submitted</p>
            <p className="text-xs font-medium text-gray-600 mt-0.5">{fmtShortDate(booking.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* ── View resource link ── */}
      <div className="text-center mb-4">
        <Link to={`/resources/${booking.resourceId}`}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium">
          View resource details →
        </Link>
      </div>

      {/* ── Admin Controls ── */}
      {isAdmin && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50/40 px-5 py-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">⚙️ Admin Controls</h2>

          {booking.status === 'PENDING' && !showRejectInput && (
            <div className="flex gap-3">
              <button onClick={handleApprove} disabled={actioning}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-emerald-600 text-white
                           hover:bg-emerald-700 transition-colors disabled:opacity-50">
                ✓ Approve
              </button>
              <button onClick={() => setShowRejectInput(true)}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-red-50 text-red-600
                           border border-red-200 hover:bg-red-100 transition-colors">
                ✕ Reject
              </button>
            </div>
          )}

          {booking.status === 'PENDING' && showRejectInput && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea className="input resize-none" rows={2}
                placeholder="e.g. Room reserved for faculty..."
                value={adminNote} onChange={e => setAdminNote(e.target.value)} />
              <div className="flex gap-3">
                <button onClick={handleReject} disabled={actioning}
                  className="flex-1 py-2 text-sm font-medium rounded-xl bg-red-600 text-white
                             hover:bg-red-700 transition-colors disabled:opacity-50">
                  Confirm rejection
                </button>
                <button onClick={() => { setShowRejectInput(false); setAdminNote('') }}
                  className="px-4 py-2 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {(booking.status === 'APPROVED' || booking.status === 'REJECTED') && (
            <button onClick={handleRevert} disabled={actioning}
              className="w-full py-2.5 text-sm font-medium rounded-xl bg-orange-50 text-orange-600
                         border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50">
              ↩ Revert to Pending
            </button>
          )}

          {booking.status === 'CHECKED_IN' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-semibold text-blue-700">✅ Booking Completed</p>
                <p className="text-xs text-blue-500 mt-0.5">Checked in and complete.</p>
              </div>
              <button onClick={() => setDeleteModal(true)} disabled={actioning}
                className="w-full py-2.5 text-sm font-medium rounded-xl bg-red-50 text-red-600
                           border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50">
                🗑 Delete this record
              </button>
            </div>
          )}

          {booking.status === 'REJECTED' && (
            <button onClick={() => setDeleteModal(true)} disabled={actioning}
              className="w-full py-2.5 text-sm font-medium rounded-xl bg-red-50 text-red-600
                         border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 mt-3">
              🗑 Delete this record
            </button>
          )}
        </div>
      )}

      {/* ── Delete Modal ── */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl flex-shrink-0">🗑</div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Delete Booking</h3>
              <p className="text-xs text-gray-400">Permanent — cannot be undone</p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700">
            Delete booking for <span className="font-semibold">{booking.resourceName}</span> by{' '}
            <span className="font-semibold">{booking.userName ?? booking.userEmail}</span>?
          </div>
          <div className="flex gap-3">
            <button onClick={handleDeleteConfirm} disabled={actioning}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-red-600 text-white
                         hover:bg-red-700 transition-colors disabled:opacity-50">
              {actioning ? 'Deleting...' : '🗑 Delete permanently'}
            </button>
            <button onClick={() => setDeleteModal(false)}
              className="px-4 py-2.5 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function DetailRow({ icon, label, value }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
        <span className="text-base">{icon}</span> {value}
      </p>
    </div>
  )
}
