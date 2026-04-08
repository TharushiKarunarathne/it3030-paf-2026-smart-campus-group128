import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getTickets } from '../../api/ticketApi'
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

const CATEGORIES = ['All', 'Lecture Halls', 'Computer Labs', 'Vehicles', 'Sports', 'Meeting Rooms', 'Library']
const STATUSES   = ['All', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

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

export default function TicketsPage() {
  const { user, isAdmin, isTechnician } = useAuth()
  const isUser = !isAdmin && !isTechnician
  const [searchParams] = useSearchParams()

  const [tickets, setTickets]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatus]       = useState(searchParams.get('status') ?? 'All')
  const [categoryFilter, setCategory]   = useState('All')
  const [priorityFilter, setPriority]   = useState('All')

  useEffect(() => { fetchTickets() }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const { data } = await getTickets()
      const all = Array.isArray(data) ? data : []

      // Filter by role on the frontend (mirrors backend logic)
      // ADMIN   → all tickets (backend already returns all)
      // TECH    → only tickets assigned to them
      // USER    → only their own tickets
      let visible = all
      if (isUser) {
        visible = all.filter(t => t.reportedById === user?.id)
      } else if (isTechnician) {
        visible = all.filter(t => t.assignedToId === user?.id)
      }
      // admin sees all — no filter

      setTickets(visible)
    } catch {
      toast.error('Failed to load tickets.')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = tickets.filter((t) => {
    const matchSearch   = t.title?.toLowerCase().includes(search.toLowerCase()) ||
                          t.location?.toLowerCase().includes(search.toLowerCase())
    const matchStatus   = statusFilter   === 'All' || t.status   === statusFilter
    const matchCategory = categoryFilter === 'All' || t.category === categoryFilter
    const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter
    return matchSearch && matchStatus && matchCategory && matchPriority
  })

  // Role-specific heading
  const heading = isAdmin
    ? 'All Incident Tickets'
    : isTechnician
    ? 'My Assigned Tickets'
    : 'My Reported Issues'

  const subtext = isAdmin
    ? `${tickets.length} total · ${tickets.filter(t => t.status === 'OPEN').length} open`
    : isTechnician
    ? 'Tickets assigned to you'
    : 'Issues you have reported'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{subtext}</p>
        </div>

        {/* Only USER and ADMIN can create tickets */}
        {!isTechnician && (
          <Link to="/tickets/new" className="btn-primary">
            + Report Issue
          </Link>
        )}
      </div>

      {/* Admin info banner */}
      {isAdmin && (
        <div className="card border-purple-200 bg-purple-50/40 mb-4 flex items-center gap-3 p-4">
          <span className="text-2xl">👑</span>
          <div>
            <p className="text-sm font-semibold text-purple-900">Admin View</p>
            <p className="text-xs text-purple-600">
              You can see all tickets. Assign technicians to handle issues.
            </p>
          </div>
        </div>
      )}

      {/* Technician info banner */}
      {isTechnician && (
        <div className="card border-blue-200 bg-blue-50/40 mb-4 flex items-center gap-3 p-4">
          <span className="text-2xl">🔧</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">Technician View</p>
            <p className="text-xs text-blue-600">
              Showing tickets assigned to you. Update status to track your progress.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            className="input"
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s === 'All' ? 'All statuses' : STATUS_STYLES[s]?.label}
              </option>
            ))}
          </select>
          <select className="input" value={categoryFilter} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All categories' : c}</option>
            ))}
          </select>
          <select className="input" value={priorityFilter} onChange={(e) => setPriority(e.target.value)}>
            <option value="All">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">{tickets.length === 0 ? '🎉' : '🔍'}</p>
          <h2 className="text-lg font-semibold text-gray-700">
            {tickets.length === 0 ? 'No issues reported yet' : 'No tickets match your filters'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {tickets.length === 0 && !isTechnician ? 'Everything looks good!' : 'Try adjusting your filters.'}
          </p>
          {!isTechnician && tickets.length === 0 && (
            <Link to="/tickets/new" className="btn-primary mt-4 inline-block">
              Report an Issue
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const s = STATUS_STYLES[ticket.status]     ?? STATUS_STYLES.OPEN
            const p = PRIORITY_STYLES[ticket.priority] ?? PRIORITY_STYLES.MEDIUM
            return (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="card hover:shadow-md transition-shadow p-4 flex gap-4 items-start block"
              >
                {/* Priority bar */}
                <div className={`flex-shrink-0 w-1 self-stretch rounded-full
                  ${ticket.priority === 'HIGH'   ? 'bg-red-500' :
                    ticket.priority === 'MEDIUM' ? 'bg-orange-400' : 'bg-blue-400'}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {ticket.title}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`badge ${p.bg} ${p.text}`}>{p.label}</span>
                      <span className={`badge ${s.bg} ${s.text}`}>{s.label}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {ticket.description}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                    {ticket.category && <span>📁 {ticket.category}</span>}
                    {ticket.location && <span>📍 {ticket.location}</span>}

                    {/* Technician sees who reported it */}
                    {isTechnician && ticket.reportedByName && (
                      <span>👤 {ticket.reportedByName}</span>
                    )}

                    {/* Show assigned technician */}
                    {ticket.assignedToName && (
                      <span>🔧 {ticket.assignedToName}</span>
                    )}

                    <span>🕐 {timeAgo(ticket.createdAt)}</span>

                    {ticket.commentCount > 0 && (
                      <span>💬 {ticket.commentCount}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}