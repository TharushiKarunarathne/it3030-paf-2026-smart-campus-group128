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

const STATUS_STYLES = {
  OPEN:        { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Open' },
  IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Progress' },
  RESOLVED:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Resolved' },
  CLOSED:      { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Closed' },
}

const PRIORITY_STYLES = {
  LOW:    { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Low' },
  MEDIUM: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Medium' },
  HIGH:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'High' },
}

const STATUS_TRANSITIONS = {
  OPEN:        ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['CLOSED'],
  RESOLVED:    ['CLOSED'],
  CLOSED:      ['OPEN'],
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
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

// ─── Resolution Modal ────────────────────────────────────────────────────────
function ResolutionModal({ onConfirm, onCancel, loading }) {
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!note.trim()) {
      setError('Please describe how the issue was resolved.')
      return
    }
    onConfirm(note.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">✅</span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Resolve Ticket</h2>
            <p className="text-xs text-gray-500">
              Describe what was done to fix this issue.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="btn-primary flex-1"
          >
            {loading ? 'Resolving...' : 'Mark as Resolved'}
          </button>
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin, isTechnician } = useAuth()
  const isUser = !isAdmin && !isTechnician

  const [ticket, setTicket]               = useState(null)
  const [technicians, setTechnicians]     = useState([])
  const [loading, setLoading]             = useState(true)
  const [comment, setComment]             = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  const [resolveLoading, setResolveLoading] = useState(false)
  const [imageExpanded, setImageExpanded] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)

  useEffect(() => {
    fetchTicket()
    if (isAdmin) fetchTechnicians()
  }, [id])

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
      setTechnicians(
        Array.isArray(data) ? data.filter(u => u.role === 'TECHNICIAN') : []
      )
    } catch {}
  }

  const handleStatusChange = async (newStatus) => {
    // Intercept RESOLVED — show modal instead
    if (newStatus === 'RESOLVED') {
      setShowResolveModal(true)
      return
    }
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

  const handleDeleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!ticket) return null

  const s = STATUS_STYLES[ticket.status]     ?? STATUS_STYLES.OPEN
  const p = PRIORITY_STYLES[ticket.priority] ?? PRIORITY_STYLES.MEDIUM
  const isOwner    = ticket.reportedById === user?.id
  const isAssigned = ticket.assignedToId === user?.id

  return (
    <div className="max-w-3xl mx-auto">

      {/* Resolution modal */}
      {showResolveModal && (
        <ResolutionModal
          onConfirm={handleResolve}
          onCancel={() => setShowResolveModal(false)}
          loading={resolveLoading}
        />
      )}

      <button
        onClick={() => navigate('/tickets')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      >
        ← Back to tickets
      </button>

      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`badge ${p.bg} ${p.text}`}>{p.label} Priority</span>
              <span className={`badge ${s.bg} ${s.text}`}>{s.label}</span>
              {ticket.category && (
                <span className="badge bg-gray-100 text-gray-600">{ticket.category}</span>
              )}
              {isTechnician && isAssigned && (
                <span className="badge bg-blue-100 text-blue-700">📌 Assigned to you</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">
            #{ticket.id?.slice(-6).toUpperCase()}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500">
          <div>
            <p className="font-medium text-gray-700 mb-0.5">Reported by</p>
            <p>{ticket.reportedByName ?? 'Unknown'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-0.5">Location</p>
            <p>{ticket.location ?? '—'}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-0.5">Created</p>
            <p>{formatDate(ticket.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-0.5">Last updated</p>
            <p>{formatDate(ticket.updatedAt)}</p>
          </div>
        </div>

        {ticket.assignedToName && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-gray-500">Assigned to:</span>
            <span className="font-medium text-blue-700 badge bg-blue-50">
              🔧 {ticket.assignedToName}
            </span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">

        {/* Left column */}
        <div className="md:col-span-2 space-y-4">

          {/* Description */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Resolution note — shown when resolved */}
          {ticket.resolutionNote && (
            <div className="card border-green-200 bg-green-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✅</span>
                <h2 className="text-sm font-semibold text-green-800">Resolution Note</h2>
              </div>
              <p className="text-sm text-green-900 leading-relaxed whitespace-pre-wrap">
                {ticket.resolutionNote}
              </p>
              {ticket.assignedToName && (
                <p className="text-xs text-green-600 mt-2">
                  Resolved by {ticket.assignedToName}
                </p>
              )}
            </div>
          )}

          {/* Image */}
          {ticket.imageUrl && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Attachment</h2>
              <div
                className="cursor-pointer rounded-lg overflow-hidden border border-gray-200"
                onClick={() => setImageExpanded(true)}
              >
                <img
                  src={ticket.imageUrl}
                  alt="Ticket attachment"
                  className="w-full max-h-64 object-cover hover:opacity-90 transition-opacity"
                />
                <p className="text-xs text-center text-gray-400 py-1">Click to enlarge</p>
              </div>
            </div>
          )}

          {imageExpanded && (
            <div
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              onClick={() => setImageExpanded(false)}
            >
              <img
                src={ticket.imageUrl}
                alt="Ticket attachment"
                className="max-w-full max-h-full rounded-xl object-contain"
              />
              <button
                className="absolute top-4 right-4 text-white text-2xl font-bold hover:opacity-70"
                onClick={() => setImageExpanded(false)}
              >✕</button>
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Comments ({ticket.comments?.length ?? 0})
            </h2>

            <div className="space-y-3 mb-4">
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
              ) : (
                ticket.comments.map((c) => (
                  <div key={c.id} className="flex gap-3 items-start group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100
                                    flex items-center justify-center text-primary-700
                                    text-xs font-semibold">
                      {c.authorName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-gray-900">{c.authorName}</span>
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
                  className="btn-primary text-sm"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — role-based panel */}
        <div className="space-y-4">

          {/* USER — read only */}
          {isUser && (
            <div className="card text-center py-6">
              <p className="text-3xl mb-2">
                {ticket.status === 'RESOLVED' ? '✅' :
                 ticket.status === 'CLOSED'   ? '🔒' : '📋'}
              </p>
              <p className="text-sm font-medium text-gray-700">
                {ticket.status === 'RESOLVED' ? 'Issue Resolved' :
                 ticket.status === 'CLOSED'   ? 'Ticket Closed' : 'Your Ticket'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {ticket.status === 'OPEN'
                  ? 'A technician will be assigned to resolve this issue.'
                  : ticket.status === 'IN_PROGRESS'
                  ? 'A technician is working on this.'
                  : ticket.status === 'RESOLVED'
                  ? 'Check the resolution note below.'
                  : 'This ticket has been closed.'}
              </p>
            </div>
          )}

          {/* TECHNICIAN — status updates + resolve */}
          {isTechnician && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Update Status</h2>
              <p className="text-xs text-gray-400 mb-3">
                Move this ticket along as you work on it.
              </p>
              <div className="space-y-2">
                {/* Resolve button — special, opens modal */}
                {ticket.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    disabled={resolveLoading}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                               bg-green-100 text-green-700 hover:opacity-80
                               transition-colors disabled:opacity-50"
                  >
                    ✅ Mark as Resolved
                  </button>
                )}
                {/* Other transitions */}
                {(STATUS_TRANSITIONS[ticket.status] ?? []).map((nextStatus) => {
                  if (nextStatus === 'RESOLVED') return null  // handled above
                  const ns = STATUS_STYLES[nextStatus]
                  return (
                    <button
                      key={nextStatus}
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={statusLoading}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                                  border transition-colors ${ns.bg} ${ns.text}
                                  border-transparent hover:opacity-80 disabled:opacity-50`}
                    >
                      {statusLoading ? 'Updating...' : `→ Mark as ${ns.label}`}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ADMIN — status + resolve + assign */}
          {isAdmin && (
            <>
              <div className="card">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Update Status</h2>
                <p className="text-xs text-gray-400 mb-3">Change the ticket status.</p>
                <div className="space-y-2">
                  {/* Resolve button */}
                  {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      disabled={resolveLoading}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                                 bg-green-100 text-green-700 hover:opacity-80
                                 transition-colors disabled:opacity-50"
                    >
                      ✅ Mark as Resolved
                    </button>
                  )}
                  {/* Other transitions */}
                  {(STATUS_TRANSITIONS[ticket.status] ?? []).map((nextStatus) => {
                    if (nextStatus === 'RESOLVED') return null
                    const ns = STATUS_STYLES[nextStatus]
                    return (
                      <button
                        key={nextStatus}
                        onClick={() => handleStatusChange(nextStatus)}
                        disabled={statusLoading}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                                    border transition-colors ${ns.bg} ${ns.text}
                                    border-transparent hover:opacity-80 disabled:opacity-50`}
                      >
                        {statusLoading ? 'Updating...' : `→ Mark as ${ns.label}`}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="card">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">
                  Assign Technician
                </h2>
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
                  <p className="text-xs text-gray-400 mt-1">Assigning...</p>
                )}
              </div>
            </>
          )}

          {/* Ticket info — all roles */}
          <div className="card text-xs text-gray-500 space-y-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Ticket Info</h2>
            <div className="flex justify-between">
              <span>Status</span>
              <span className={`font-medium ${s.text}`}>{s.label}</span>
            </div>
            <div className="flex justify-between">
              <span>Priority</span>
              <span className={`font-medium ${p.text}`}>{p.label}</span>
            </div>
            <div className="flex justify-between">
              <span>Category</span>
              <span className="font-medium text-gray-700">{ticket.category ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Location</span>
              <span className="font-medium text-gray-700">{ticket.location ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Comments</span>
              <span className="font-medium text-gray-700">{ticket.comments?.length ?? 0}</span>
            </div>
          </div>

          {/* Delete — owner when OPEN, or admin/technician when RESOLVED */}
          {((isOwner && ticket.status === 'OPEN') ||
            (isAdmin && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) ||
            (isTechnician && isAssigned && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'))) && (
            <button
              onClick={handleDeleteTicket}
              className="btn-danger w-full text-sm"
            >
              Delete Ticket
            </button>
          )}

        </div>
      </div>
    </div>
  )
}