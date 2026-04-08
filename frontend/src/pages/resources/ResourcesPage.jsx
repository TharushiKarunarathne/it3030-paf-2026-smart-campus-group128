import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getResources, deleteResource, updateResourceStatus } from '../../api/resourceApi'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const TYPE_CONFIG = {
  LECTURE_HALL:       { label: 'Lecture Hall',       icon: '🏛️', color: 'bg-blue-50 text-blue-600',    accent: 'bg-blue-500' },
  COMPUTER_LAB:       { label: 'Computer Lab',       icon: '🖥️', color: 'bg-purple-50 text-purple-600', accent: 'bg-purple-500' },
  SPORTS_FACILITY:    { label: 'Sports / Gym',       icon: '🏋️', color: 'bg-green-50 text-green-600',  accent: 'bg-green-500' },
  MEETING_ROOM:       { label: 'Meeting Room',       icon: '🪑', color: 'bg-sky-50 text-sky-600',      accent: 'bg-sky-500' },
  VEHICLE:            { label: 'Vehicle',            icon: '🚌', color: 'bg-amber-50 text-amber-600',  accent: 'bg-amber-500' },
  LIBRARY_STUDY_ROOM: { label: 'Library Study Room', icon: '📚', color: 'bg-teal-50 text-teal-600',    accent: 'bg-teal-500' },
}

const STATUS_CONFIG = {
  AVAILABLE:   { label: 'Available',   dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700' },
  MAINTENANCE: { label: 'Maintenance', dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700' },
  UNAVAILABLE: { label: 'Unavailable', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700' },
}

const TYPE_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'LECTURE_HALL',       label: 'Lecture Halls' },
  { key: 'COMPUTER_LAB',       label: 'Computer Labs' },
  { key: 'VEHICLE',            label: 'Vehicles' },
  { key: 'SPORTS_FACILITY',    label: 'Sports' },
  { key: 'MEETING_ROOM',       label: 'Meeting Rooms' },
  { key: 'LIBRARY_STUDY_ROOM', label: 'Library' },
]

function ResourceCard({ resource, isAdmin, onDelete, onStatusChange }) {
  const type   = TYPE_CONFIG[resource.type]   ?? { label: resource.type,   icon: '📦', color: 'bg-gray-50 text-gray-600',   accent: 'bg-gray-400' }
  const status = STATUS_CONFIG[resource.status] ?? { label: resource.status, dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-600' }

  // Build quick-info chips from details
  const chips = []
  if (resource.capacity)          chips.push(`👥 ${resource.capacity}`)
  if (resource.details?.hasAC)    chips.push('❄️ AC')
  if (resource.details?.hasProjector) chips.push('📽️ Projector')
  if (resource.details?.numberOfComputers) chips.push(`💻 ${resource.details.numberOfComputers} PCs`)
  if (resource.details?.brand)    chips.push(`🚗 ${resource.details.brand} ${resource.details.model ?? ''}`.trim())
  if (resource.details?.seatingCapacity) chips.push(`👥 ${resource.details.seatingCapacity} seats`)
  if (resource.details?.sportType)    chips.push(resource.details.sportType)
  if (resource.details?.isIndoor)     chips.push('🏠 Indoor')
  if (resource.details?.hasVideoConference) chips.push('📹 Video')
  if (resource.details?.isQuietZone) chips.push('🔕 Quiet')
  if (resource.details?.numberOfSeats) chips.push(`👥 ${resource.details.numberOfSeats} seats`)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden
                    hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex flex-col">
      {/* Accent bar */}
      <div className={`h-1 ${type.accent}`} />

      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${type.color}`}>
            {type.icon}
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </div>
        </div>

        {/* Name + type */}
        <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{resource.name}</h3>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{type.label}</p>

        {/* Location */}
        {resource.location && (
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <span>📍</span>{resource.location}
          </p>
        )}

        {/* Chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {chips.slice(0, 3).map((chip, i) => (
              <span key={i}
                className="text-xs bg-gray-50 text-gray-600 border border-gray-100
                           px-2 py-0.5 rounded-full">
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2 mt-2">
          <Link to={`/resources/${resource.id}`}
            className="flex-1 text-center text-xs font-medium py-2 rounded-lg
                       bg-gray-50 text-gray-700 border border-gray-100
                       hover:bg-gray-100 transition-colors">
            View details
          </Link>
          {resource.status === 'AVAILABLE' && (
            <Link
              to={`/bookings/new?resourceId=${resource.id}&resourceName=${encodeURIComponent(resource.name)}`}
              className="flex-1 text-center text-xs font-medium py-2 rounded-lg
                         bg-indigo-700 text-white hover:bg-indigo-800 transition-colors">
              Book
            </Link>
          )}
        </div>
      </div>

      {/* Admin strip */}
      {isAdmin && (
        <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 flex gap-2 items-center">
          <select
            value={resource.status}
            onChange={e => onStatusChange(resource.id, e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5
                       bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="AVAILABLE">Available</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
          <Link
            to={`/resources/${resource.id}/edit`}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-gray-200
                       text-gray-600 hover:bg-gray-100 transition-colors">
            Edit
          </Link>
          <button
            onClick={() => onDelete(resource.id)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600
                       hover:bg-red-100 transition-colors border border-red-100">
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function ResourcesPage() {
  const { isAdmin }  = useAuth()
  const [resources, setResources]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [typeFilter, setTypeFilter]     = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => { fetchResources() }, [])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const { data } = await getResources()
      setResources(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load resources.')
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource permanently?')) return
    try {
      await deleteResource(id)
      setResources(prev => prev.filter(r => r.id !== id))
      toast.success('Resource deleted.')
    } catch { toast.error('Failed to delete.') }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await updateResourceStatus(id, status)
      setResources(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success('Status updated.')
    } catch { toast.error('Failed to update status.') }
  }

  const filtered = resources.filter(r => {
    const matchSearch = !search ||
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter   === 'ALL' || r.type   === typeFilter
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  // Stats for hero
  const total     = resources.length
  const available = resources.filter(r => r.status === 'AVAILABLE').length
  const maintenance = resources.filter(r => r.status === 'MAINTENANCE').length

  return (
    <div>
      {/* ── Hero header ─────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden mb-6"
           style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}>
        <div className="px-8 py-7 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Campus Resources</h1>
            <p className="text-blue-200 text-sm">
              Book rooms, labs, vehicles and facilities
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-blue-300 text-xs mt-0.5">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-300">{available}</p>
                <p className="text-blue-300 text-xs mt-0.5">Available</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-300">{maintenance}</p>
                <p className="text-blue-300 text-xs mt-0.5">Maintenance</p>
              </div>
            </div>
            {isAdmin && (
              <Link
                to="/resources/new"
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25
                           border border-white/30 text-white text-sm font-medium
                           px-4 py-2.5 rounded-xl transition-colors">
                + Add Resource
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          className="input flex-1 min-w-[200px]"
          placeholder="Search by name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="UNAVAILABLE">Unavailable</option>
        </select>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors
              ${typeFilter === f.key
                ? 'bg-indigo-700 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">
        Showing {filtered.length} of {resources.length} resources
      </p>

      {/* ── Grid ─────────────────────────────────────── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-52
                                    animate-pulse">
              <div className="h-3 bg-gray-100 rounded mb-3 w-1/3" />
              <div className="h-4 bg-gray-100 rounded mb-2 w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-20">
          <p className="text-5xl mb-4">🏛️</p>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No resources found</h3>
          <p className="text-sm text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}