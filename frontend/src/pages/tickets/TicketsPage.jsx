import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getTickets } from '../../api/ticketApi'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',       bar: 'bg-red-400' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-400' },
  RESOLVED:    { label: 'Resolved',    dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200', bar: 'bg-green-400' },
  CLOSED:      { label: 'Closed',      dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600 border-gray-200',   bar: 'bg-gray-300' },
}

const PRIORITY_CONFIG = {
  LOW:    { label: 'Low',    dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200',     bar: 'bg-blue-400' },
  MEDIUM: { label: 'Medium', dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  bar: 'bg-amber-500' },
  HIGH:   { label: 'High',   dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',        bar: 'bg-red-500' },
}

const STATUSES   = ['All', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const CATEGORIES = ['All', 'Lecture Halls', 'Computer Labs', 'Vehicles', 'Sports', 'Meeting Rooms', 'Library']

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

function formatDuration(minutes) {
  if (minutes == null) return null
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function TicketsPage() {
  const { user, isAdmin, isTechnician } = useAuth()
  const isUser = !isAdmin && !isTechnician
  const [searchParams] = useSearchParams()

  const [tickets, setTickets]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatus]     = useState(searchParams.get('status') ?? 'All')
  const [categoryFilter, setCategory] = useState('All')
  const [priorityFilter, setPriority] = useState('All')

  useEffect(() => { fetchTickets() }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const { data } = await getTickets()
      const all = Array.isArray(data) ? data : []
      let visible = all
      if (isUser)        visible = all.filter(t => t.reportedById === user?.id)
      else if (isTechnician) visible = all.filter(t => t.assignedToId === user?.id)
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

  const counts = {
    OPEN:        tickets.filter(t => t.status === 'OPEN').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    RESOLVED:    tickets.filter(t => t.status === 'RESOLVED').length,
    CLOSED:      tickets.filter(t => t.status === 'CLOSED').length,
  }

  const heading = isAdmin      ? 'All Incident Tickets'
    : isTechnician ? 'My Assigned Tickets'
    : 'My Reported Issues'

  return (
    <div className="page-fade-in">

      {/* ── Hero ─────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden mb-6 px-8 py-7"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{heading}</h1>
            <p className="text-blue-200 text-sm">
              {isAdmin
                ? 'Review and manage all campus maintenance tickets'
                : isTechnician
                ? 'Tickets assigned to you — update status as you work'
                : 'Issues you have reported to the campus team'}
            </p>
          </div>
          {!isTechnician && (
            <Link
              to="/tickets/new"
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25
                         border border-white/30 text-white text-sm font-medium
                         px-4 py-2.5 rounded-xl transition-colors"
            >
              + Report Issue
            </Link>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-6 flex-wrap">
          {[
            { label: 'Open',        count: counts.OPEN,        color: 'text-red-300' },
            { label: 'In Progress', count: counts.IN_PROGRESS, color: 'text-amber-300' },
            { label: 'Resolved',    count: counts.RESOLVED,    color: 'text-green-300' },
            { label: 'Closed',      count: counts.CLOSED,      color: 'text-blue-200' },
            { label: 'Total',       count: tickets.length,     color: 'text-white' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-blue-300 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Role banners ──────────────────────────────── */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 mb-5 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Admin View</p>
            <p className="text-xs text-gray-500">You can see all tickets. Assign technicians to handle issues.</p>
          </div>
        </div>
      )}
      {isTechnician && (
        <div className="bg-white rounded-2xl border border-blue-100 px-5 py-4 mb-5 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Technician View</p>
            <p className="text-xs text-gray-500">Showing tickets assigned to you. Update status to track progress.</p>
          </div>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="input pl-9"
              placeholder="Search title or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s === 'All' ? 'All statuses' : STATUS_CONFIG[s]?.label}
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

      {/* ── Tab pills ─────────────────────────────────── */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${statusFilter === s
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {s === 'All' ? 'All' : STATUS_CONFIG[s].label}
            {s !== 'All' && counts[s] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${STATUS_CONFIG[s].badge}`}>
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">
        Showing {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* ── Ticket list ───────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-24 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-20">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-2">
            {tickets.length === 0 ? 'No tickets yet' : 'No tickets match your filters'}
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            {tickets.length === 0 && !isTechnician
              ? 'Everything looks good — report an issue when something needs attention.'
              : 'Try adjusting your search or filters.'}
          </p>
          {!isTechnician && tickets.length === 0 && (
            <Link to="/tickets/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm
                         font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}>
              Report an Issue
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const s = STATUS_CONFIG[ticket.status]   ?? STATUS_CONFIG.OPEN
            const p = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.MEDIUM
            return (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="block bg-white rounded-2xl border border-gray-100
                           hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Top status bar */}
                <div className={`h-0.5 ${s.bar}`} />

                <div className="p-4 flex gap-4 items-start">
                  {/* Priority side bar */}
                  <div className={`flex-shrink-0 w-1 self-stretch rounded-full ${p.bar}`} />

                  <div className="flex-1 min-w-0">
                    {/* Title + badges */}
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                        {ticket.title}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                          text-xs font-semibold border ${p.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                          {p.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                          text-xs font-semibold border ${s.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </div>
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                      {ticket.description}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400">
                      {ticket.category && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {ticket.category}
                        </span>
                      )}
                      {ticket.location && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {ticket.location}
                        </span>
                      )}
                      {isTechnician && ticket.reportedByName && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {ticket.reportedByName}
                        </span>
                      )}
                      {ticket.assignedToName && (
                        <span className="flex items-center gap-1 text-blue-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                          {ticket.assignedToName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {timeAgo(ticket.createdAt)}
                      </span>
                      {ticket.commentCount > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          {ticket.commentCount}
                        </span>
                      )}
                      {ticket.timeToFirstResponseMinutes == null && ticket.status === 'OPEN' && (
                        <span className="text-amber-500 font-medium">Awaiting response</span>
                      )}
                      {ticket.timeToResolutionMinutes != null && (
                        <span className="text-green-600 font-medium">
                          Resolved in {formatDuration(ticket.timeToResolutionMinutes)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
