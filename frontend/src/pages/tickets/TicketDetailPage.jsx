import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getTicketById,
  updateTicketStatus,
  assignTechnician,
  addComment,
  deleteComment,
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
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED:    ['CLOSED', 'OPEN'],
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

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin, isTechnician } = useAuth()

  const [ticket, setTicket]           = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading]         = useState(true)
  const [comment, setComment]         = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [statusLoading, setStatusLoading]   = useState(false)
  const [assignLoading, setAssignLoading]   = useState(false)
  const [imageExpanded, setImageExpanded]   = useState(false)

  useEffect(() => {
    fetchTicket()
    if (isAdmin || isTechnician) fetchTechnicians()
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
        Array.isArray(data)
          ? data.filter(u => u.role === 'TECHNICIAN' || u.role === 'ADMIN')
          : []
      )
    } catch {}
  }

  const handleStatusChange = async (newStatus) => {
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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!ticket) return null

  const s = STATUS_STYLES[ticket.status]   ?? STATUS_STYLES.OPEN
  const p = PRIORITY_STYLES[ticket.priority] ?? PRIORITY_STYLES.MEDIUM
  const canManage = isAdmin || isTechnician
  const isOwner   = ticket.reportedById === user?.id

  return (
    <div className="max-w-3xl mx-auto">

      {/* Back */}
      <button
        onClick={() => navigate('/tickets')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      >
        ← Back to tickets
      </button>

      {/* Ticket header */}
      <div className="card mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`badge ${p.bg} ${p.text}`}>{p.label} Priority</span>
              <span className={`badge ${s.bg} ${s.text}`}>{s.label}</span>
              {ticket.category && (
                <span className="badge bg-gray-100 text-gray-600">{ticket.category}</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.title}</h1>
          </div>

          {/* Ticket ID */}
          <span className="text-xs text-gray-400 flex-shrink-0">
            #{ticket.id?.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* Meta info */}
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

        {/* Assigned technician */}
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

        {/* Left — description + image + comments */}
        <div className="md:col-span-2 space-y-4">

          {/* Description */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Image attachment */}
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
                <p className="text-xs text-center text-gray-400 py-1">
                  Click to enlarge
                </p>
              </div>
            </div>
          )}

          {/* Expanded image modal */}
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
              >
                ✕
              </button>
            </div>
          )}

          {/* Comments */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Comments ({ticket.comments?.length ?? 0})
            </h2>

            {/* Comment list */}
            <div className="space-y-3 mb-4">
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No comments yet. Be the first to add one.
                </p>
              ) : (
                ticket.comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex gap-3 items-start group"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100
                                    flex items-center justify-center text-primary-700
                                    text-xs font-semibold">
                      {c.authorName?.[0]?.toUpperCase() ?? '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-900">
                            {c.authorName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {timeAgo(c.createdAt)}
                          </span>
                        </div>
                        {/* Delete — own comment or admin */}
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
                      <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add comment */}
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

        {/* Right — management panel */}
        <div className="space-y-4">

          {/* Status change — admin/technician only */}
          {canManage && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Update Status
              </h2>
              <div className="space-y-2">
                {(STATUS_TRANSITIONS[ticket.status] ?? []).map((nextStatus) => {
                  const ns = STATUS_STYLES[nextStatus]
                  return (
                    <button
                      key={nextStatus}
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={statusLoading}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm
                                  font-medium border transition-colors
                                  ${ns.bg} ${ns.text} border-transparent
                                  hover:opacity-80 disabled:opacity-50`}
                    >
                      {statusLoading ? 'Updating...' : `→ Mark as ${ns.label}`}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Assign technician — admin only */}
          {isAdmin && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Assign Technician
              </h2>
              <select
                className="input text-sm"
                value={ticket.assignedToId ?? ''}
                disabled={assignLoading}
                onChange={(e) => handleAssign(e.target.value)}
              >
                <option value="">— Unassigned —</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role})
                  </option>
                ))}
              </select>
              {assignLoading && (
                <p className="text-xs text-gray-400 mt-1">Assigning...</p>
              )}
            </div>
          )}

          {/* Ticket info summary */}
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
              <span className="font-medium text-gray-700">
                {ticket.comments?.length ?? 0}
              </span>
            </div>
          </div>

          {/* Delete ticket — owner or admin */}
          {(isOwner || isAdmin) && ticket.status === 'OPEN' && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this ticket?')) {
                  toast.error('Delete endpoint not yet connected to backend.')
                }
              }}
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