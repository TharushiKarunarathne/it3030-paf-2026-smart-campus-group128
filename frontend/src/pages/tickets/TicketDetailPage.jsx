import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getTicketById,
  updateTicketStatus,
  assignTechnician,
  addComment,
  deleteComment,
  resolveTicket,
  deleteTicket,
} from '../../api/ticketApi'
import { getAllUsers } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

// ── Status and priority display config ───────────────────────
const STATUS_STYLES = {
  OPEN:        { dot: 'bg-red-500',    border: 'border-red-400',    bg: 'bg-red-50',     text: 'text-red-700',    badge: 'bg-red-50 text-red-700 border-red-200',       label: 'Open' },
  IN_PROGRESS: { dot: 'bg-yellow-500', border: 'border-yellow-400', bg: 'bg-yellow-50',  text: 'text-yellow-700', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'In Progress' },
  RESOLVED:    { dot: 'bg-green-500',  border: 'border-green-400',  bg: 'bg-green-50',   text: 'text-green-700',  badge: 'bg-green-50 text-green-700 border-green-200',   label: 'Resolved' },
  CLOSED:      { dot: 'bg-gray-400',   border: 'border-gray-300',   bg: 'bg-gray-50',    text: 'text-gray-600',   badge: 'bg-gray-100 text-gray-600 border-gray-200',     label: 'Closed' },
}

const PRIORITY_STYLES = {
  LOW:    { dot: 'bg-blue-500',   text: 'text-blue-700',   badge: 'bg-blue-50 text-blue-700 border-blue-200',     label: 'Low' },
  MEDIUM: { dot: 'bg-orange-400', text: 'text-orange-700', badge: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Medium' },
  HIGH:   { dot: 'bg-red-500',    text: 'text-red-700',    badge: 'bg-red-50 text-red-700 border-red-200',         label: 'High' },
}

const STATUS_TRANSITIONS = {
  OPEN:        ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['CLOSED'],
  RESOLVED:    ['CLOSED'],
  CLOSED:      ['OPEN'],
}

// ── Utility functions ────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(minutes) {
  if (minutes == null) return null
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function Spinner({ small }) {
  return (
    <svg className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'}
         style={{ animation: 'spin 0.8s linear infinite' }}
         fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ─── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(to bottom, #1e3a5f, #2d5a8e)' }} />
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, subMessage, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
         style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
           style={{ animation: 'fadeIn 0.15s ease-out' }}>
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{message}</h3>
          {subMessage && <p className="text-sm text-gray-500">{subMessage}</p>}
        </div>
        <div className="flex gap-3 p-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                       text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                       text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Resolution Modal ──────────────────────────────────────────────────────────
function ResolutionModal({ onConfirm, onCancel, loading }) {
  const [note, setNote]   = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!note.trim()) { setError('Please describe how the issue was resolved.'); return }
    onConfirm(note.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
         style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
           style={{ animation: 'fadeIn 0.15s ease-out' }}>
        {/* Modal header */}
        <div className="px-6 py-5 border-b border-gray-100"
             style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Resolve Ticket</h2>
              <p className="text-xs text-gray-500">Describe what was done to fix this issue.</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Resolution Note <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input resize-none"
              rows={4}
              placeholder="e.g. Replaced the faulty capacitor in the AC unit. Unit is now functioning normally."
              value={note}
              onChange={(e) => { setNote(e.target.value); setError('') }}
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5
                         rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #166534, #16a34a)' }}
            >
              {loading ? <Spinner /> : null}
              {loading ? 'Resolving...' : 'Mark as Resolved'}
            </button>
            <button onClick={onCancel} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin, isTechnician } = useAuth()
  const isUser = !isAdmin && !isTechnician

  // ── State ──────────────────────────────────────────────────
  const [ticket, setTicket]                     = useState(null)
  const [technicians, setTechnicians]           = useState([])
  const [loading, setLoading]                   = useState(true)
  const [comment, setComment]                   = useState('')
  const [submitting, setSubmitting]             = useState(false)
  const [statusLoading, setStatusLoading]       = useState(false)
  const [assignLoading, setAssignLoading]       = useState(false)
  const [resolveLoading, setResolveLoading]     = useState(false)
  const [imageExpanded, setImageExpanded]       = useState(null)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchTicket()
    if (isAdmin) fetchTechnicians()
  }, [id])

  // ── Data fetching ───────────────────────────────────────────
  const fetchTicket = async () => {
    try {
      setLoading(true)
      const { data } = await getTicketById(id)
      setTicket(data)
    } catch {
      toast.error('Failed to load ticket.')
      navigate('/tickets')
    } finally {
      setLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const { data } = await getAllUsers()
      setTechnicians(Array.isArray(data) ? data.filter(u => u.role === 'TECHNICIAN') : [])
    } catch {}
  }

  // ── Event handlers ──────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'RESOLVED') { setShowResolveModal(true); return }
    try {
      setStatusLoading(true)
      const { data } = await updateTicketStatus(id, newStatus)
      setTicket(data)
      toast.success(`Status updated to ${STATUS_STYLES[newStatus]?.label}`)
    } catch {
      toast.error('Failed to update status.')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleResolve = async (note) => {
    try {
      setResolveLoading(true)
      const { data } = await resolveTicket(id, note)
      setTicket(data)
      setShowResolveModal(false)
      toast.success('Ticket marked as resolved!')
    } catch {
      toast.error('Failed to resolve ticket.')
    } finally {
      setResolveLoading(false)
    }
  }

  const handleAssign = async (technicianId) => {
    try {
      setAssignLoading(true)
      const { data } = await assignTechnician(id, technicianId)
      setTicket(data)
      toast.success('Technician assigned successfully.')
    } catch {
      toast.error('Failed to assign technician.')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    try {
      setSubmitting(true)
      const { data } = await addComment(id, comment.trim())
      setTicket(data)
      setComment('')
      toast.success('Comment added.')
    } catch {
      toast.error('Failed to add comment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const { data } = await deleteComment(id, commentId)
      setTicket(data)
      toast.success('Comment deleted.')
    } catch {
      toast.error('Failed to delete comment.')
    }
  }

  const handleDeleteTicket = () => setShowDeleteConfirm(true)

  const confirmDeleteTicket = async () => {
    setShowDeleteConfirm(false)
    try {
      await deleteTicket(ticket.id)
      toast.success('Ticket deleted.')
      navigate('/tickets')
    } catch {
      toast.error('Failed to delete ticket.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600"
             style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!ticket) return null

  const s = STATUS_STYLES[ticket.status]     ?? STATUS_STYLES.OPEN
  const p = PRIORITY_STYLES[ticket.priority] ?? PRIORITY_STYLES.MEDIUM
  const isOwner    = ticket.reportedById === user?.id
  const isAssigned = ticket.assignedToId === user?.id

  return (
    <div className="max-w-3xl mx-auto page-fade-in">

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          message="Delete this ticket?"
          subMessage="This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={confirmDeleteTicket}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Resolution modal */}
      {showResolveModal && (
        <ResolutionModal
          onConfirm={handleResolve}
          onCancel={() => setShowResolveModal(false)}
          loading={resolveLoading}
        />
      )}

      {/* Image lightbox */}
      {imageExpanded && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={() => setImageExpanded(null)}
        >
          <img
            src={imageExpanded}
            alt="Ticket attachment"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20
                       text-white flex items-center justify-center transition-colors"
            onClick={() => setImageExpanded(null)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Hero header ─────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl mb-5"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}
      >
        <div className="absolute top-0 right-0 w-52 h-52 rounded-full -translate-y-1/3 translate-x-1/4
                        opacity-10 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }} />

        <div className="relative z-10 px-6 py-5">
          {/* Back link */}
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to tickets
          </button>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                              font-semibold border ${p.badge}`}>
              <span className={`w-2 h-2 rounded-full ${p.dot}`} />
              {p.label} Priority
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                              font-semibold border ${s.badge}`}>
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            {ticket.category && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs
                               font-semibold border bg-white/10 text-blue-100 border-white/20">
                {ticket.category}
              </span>
            )}
            {isTechnician && isAssigned && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                               font-semibold border bg-blue-400/20 text-blue-100 border-blue-400/30">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Assigned to you
              </span>
            )}
          </div>

          {/* Title + ID */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-extrabold text-white leading-tight">{ticket.title}</h1>
            <span className="text-xs text-blue-300 flex-shrink-0 font-mono mt-0.5">
              #{ticket.id?.slice(-6).toUpperCase()}
            </span>
          </div>

          {/* Meta grid */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Reported by', value: ticket.reportedByName ?? 'Unknown' },
              { label: 'Location',    value: ticket.location ?? '—' },
              { label: 'Created',     value: formatDate(ticket.createdAt) },
              { label: 'Last updated',value: formatDate(ticket.updatedAt) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-0.5">{label}</p>
                <p className="text-sm text-white font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* Assigned technician */}
          {ticket.assignedToName && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-blue-300">Assigned to:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
                               font-semibold bg-white/15 text-white border border-white/20">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {ticket.assignedToName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* Left column */}
        <div className="md:col-span-2 space-y-4">

          {/* Description */}
          <SectionCard title="Description">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </SectionCard>

          {/* Resolution note */}
          {ticket.resolutionNote && (
            <div className="bg-green-50 rounded-2xl border border-green-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-green-200">
                <div className="w-1 h-4 rounded-full bg-green-500" />
                <h2 className="text-sm font-bold text-green-800">Resolution Note</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-green-900 leading-relaxed whitespace-pre-wrap">
                  {ticket.resolutionNote}
                </p>
                {ticket.assignedToName && (
                  <p className="text-xs text-green-600 mt-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Resolved by {ticket.assignedToName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Images gallery */}
          {(() => {
            // Prefer imageUrls array; fall back to legacy imageUrl
            const allUrls = (ticket.imageUrls && ticket.imageUrls.length > 0)
              ? ticket.imageUrls
              : ticket.imageUrl ? [ticket.imageUrl] : []
            if (allUrls.length === 0) return null
            return (
              <SectionCard title={`Attachments (${allUrls.length})`}>
                <div className={`grid gap-2 ${allUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {allUrls.map((url, i) => (
                    <div
                      key={i}
                      className="cursor-pointer rounded-xl overflow-hidden border border-gray-100
                                 hover:border-blue-200 transition-colors"
                      onClick={() => setImageExpanded(url)}
                    >
                      <img
                        src={url}
                        alt={`Attachment ${i + 1}`}
                        className="w-full object-cover hover:opacity-90 transition-opacity"
                        style={{ maxHeight: allUrls.length === 1 ? '16rem' : '10rem' }}
                      />
                      <p className="text-xs text-center text-gray-400 py-1.5 bg-gray-50
                                    flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Click to enlarge
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )
          })()}

          {/* Comments */}
          <SectionCard title={`Comments (${ticket.comments?.length ?? 0})`}>
            <div className="space-y-4 mb-4">
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">No comments yet.</p>
                </div>
              ) : (
                ticket.comments.map((c) => (
                  <div key={c.id} className="flex gap-3 items-start group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                    text-xs font-bold text-white"
                         style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}>
                      {c.authorName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-gray-900">{c.authorName}</span>
                          <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                          {c.authorRole && (
                            <span className={`badge text-[10px]
                              ${c.authorRole === 'ADMIN'      ? 'bg-purple-100 text-purple-700' :
                                c.authorRole === 'TECHNICIAN' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-500'}`}>
                              {c.authorRole}
                            </span>
                          )}
                        </div>
                        {(c.authorId === user?.id || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-xs text-red-400 hover:text-red-600
                                       opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <textarea
                className="input resize-none mb-2"
                rows={3}
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment()
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Ctrl+Enter to submit</p>
                <button
                  onClick={handleAddComment}
                  disabled={submitting || !comment.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
                             text-white transition-opacity disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
                >
                  {submitting ? <Spinner small /> : null}
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right column — role-based panel */}
        <div className="space-y-4">

          {/* USER — status card */}
          {isUser && (
            <SectionCard>
              <div className="text-center py-4">
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center
                                 ${s.bg}`}>
                  {ticket.status === 'RESOLVED' ? (
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : ticket.status === 'CLOSED' ? (
                    <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                </div>
                <p className={`text-sm font-bold ${s.text}`}>
                  {ticket.status === 'RESOLVED' ? 'Issue Resolved' :
                   ticket.status === 'CLOSED'   ? 'Ticket Closed' : 'Your Ticket'}
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {ticket.status === 'OPEN'
                    ? 'A technician will be assigned to resolve this issue.'
                    : ticket.status === 'IN_PROGRESS'
                    ? 'A technician is working on this.'
                    : ticket.status === 'RESOLVED'
                    ? 'Check the resolution note below.'
                    : 'This ticket has been closed.'}
                </p>
              </div>
            </SectionCard>
          )}

          {/* TECHNICIAN — status updates + resolve */}
          {isTechnician && (
            <SectionCard title="Update Status">
              <p className="text-xs text-gray-400 mb-3">
                Move this ticket along as you work on it.
              </p>
              <div className="space-y-2">
                {ticket.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    disabled={resolveLoading}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold
                               bg-green-50 text-green-700 border border-green-200
                               hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as Resolved
                  </button>
                )}
                {(STATUS_TRANSITIONS[ticket.status] ?? []).map((nextStatus) => {
                  if (nextStatus === 'RESOLVED') return null
                  const ns = STATUS_STYLES[nextStatus]
                  return (
                    <button
                      key={nextStatus}
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={statusLoading}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm
                                  font-semibold border transition-colors disabled:opacity-50
                                  ${ns.bg} ${ns.text} border-current/20 hover:opacity-80`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      {statusLoading ? 'Updating...' : `Mark as ${ns.label}`}
                    </button>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {/* ADMIN — status + resolve + assign */}
          {isAdmin && (
            <>
              <SectionCard title="Update Status">
                <p className="text-xs text-gray-400 mb-3">Change the ticket status.</p>
                <div className="space-y-2">
                  {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      disabled={resolveLoading}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold
                                 bg-green-50 text-green-700 border border-green-200
                                 hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark as Resolved
                    </button>
                  )}
                  {(STATUS_TRANSITIONS[ticket.status] ?? []).map((nextStatus) => {
                    if (nextStatus === 'RESOLVED') return null
                    const ns = STATUS_STYLES[nextStatus]
                    return (
                      <button
                        key={nextStatus}
                        onClick={() => handleStatusChange(nextStatus)}
                        disabled={statusLoading}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm
                                    font-semibold border transition-colors disabled:opacity-50
                                    ${ns.bg} ${ns.text} border-current/20 hover:opacity-80`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {statusLoading ? 'Updating...' : `Mark as ${ns.label}`}
                      </button>
                    )
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Assign Technician">
                <p className="text-xs text-gray-400 mb-3">
                  Assign a technician to handle this ticket.
                </p>
                <select
                  className="input text-sm"
                  value={ticket.assignedToId ?? ''}
                  disabled={assignLoading}
                  onChange={(e) => handleAssign(e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {assignLoading && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <Spinner small />
                    Assigning...
                  </p>
                )}
              </SectionCard>
            </>
          )}

          {/* Ticket info — all roles */}
          <SectionCard title="Ticket Info">
            <div className="space-y-2.5 text-xs text-gray-500">
              {[
                { label: 'Status',   value: <span className={`font-semibold ${s.text}`}>{s.label}</span> },
                { label: 'Priority', value: <span className={`font-semibold ${p.text}`}>{p.label}</span> },
                { label: 'Category',value: <span className="font-semibold text-gray-700">{ticket.category ?? '—'}</span> },
                { label: 'Location', value: <span className="font-semibold text-gray-700">{ticket.location ?? '—'}</span> },
                { label: 'Comments', value: <span className="font-semibold text-gray-700">{ticket.comments?.length ?? 0}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span>{label}</span>
                  {value}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* SLA Timers — all roles */}
          <SectionCard title="Response Times">
            <div className="space-y-3 text-xs text-gray-500">
              <div className="flex justify-between items-center">
                <span>First Response</span>
                {ticket.timeToFirstResponseMinutes != null ? (
                  <span className="font-semibold text-blue-700 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {formatDuration(ticket.timeToFirstResponseMinutes)}
                  </span>
                ) : (
                  <span className="text-orange-400 italic">Awaiting...</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span>Resolution</span>
                {ticket.timeToResolutionMinutes != null ? (
                  <span className="font-semibold text-green-700 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {formatDuration(ticket.timeToResolutionMinutes)}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">
                    {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? '—' : 'In progress...'}
                  </span>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Delete */}
          {((isOwner && ticket.status === 'OPEN') ||
            (isAdmin && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) ||
            (isTechnician && isAssigned && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'))) && (
            <button
              onClick={handleDeleteTicket}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         text-sm font-semibold text-red-600 bg-red-50 border border-red-200
                         hover:bg-red-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Ticket
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
