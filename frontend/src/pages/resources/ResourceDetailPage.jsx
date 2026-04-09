import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getResourceById, deleteResource, updateResourceStatus } from '../../api/resourceApi'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  AVAILABLE:   'bg-green-100 text-green-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  UNAVAILABLE: 'bg-red-100 text-red-700',
}

const TYPE_ICON = {
  ROOM:      '🏛️',
  EQUIPMENT: '🎥',
  VEHICLE:   '🚌',
  LAB:       '🖥️',
}

function ConfirmDialog({ message, subMessage, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
         style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
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
          <button onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                       text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold
                       text-white bg-red-600 hover:bg-red-700 transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResourceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [resource, setResource] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getResourceById(id)
        setResource(data)
      } catch {
        toast.error('Resource not found.')
        navigate('/resources')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id, navigate])

  const handleDelete = () => setShowDeleteConfirm(true)

  const confirmDelete = async () => {
    setShowDeleteConfirm(false)
    try {
      await deleteResource(id)
      toast.success('Resource deleted.')
      navigate('/resources')
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const handleStatusChange = async (status) => {
    try {
      await updateResourceStatus(id, status)
      setResource(prev => ({ ...prev, status }))
      toast.success('Status updated.')
    } catch {
      toast.error('Failed to update status.')
    }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )

  if (!resource) return null

  return (
    <div className="max-w-2xl mx-auto">

      {showDeleteConfirm && (
        <ConfirmDialog
          message="Delete this resource permanently?"
          subMessage="This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Back link */}
      <Link to="/resources"
        className="text-sm text-primary-600 hover:underline flex items-center gap-1 mb-6">
        ← Back to Resources
      </Link>

      {/* Main card */}
      <div className="card mb-4">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{TYPE_ICON[resource.type] ?? '📦'}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{resource.name}</h1>
              <p className="text-gray-500 text-sm">{resource.type}</p>
            </div>
          </div>
          <span className={`badge text-sm ${STATUS_STYLE[resource.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {resource.status}
          </span>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {resource.location && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Location</p>
              <p className="text-sm font-medium text-gray-800">
                📍 {resource.location}
              </p>
            </div>
          )}
          {resource.capacity && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Capacity</p>
              <p className="text-sm font-medium text-gray-800">
                👥 {resource.capacity} people
              </p>
            </div>
          )}
          {resource.building && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Building</p>
              <p className="text-sm font-medium text-gray-800">
                🏢 {resource.building}
              </p>
            </div>
          )}
        </div>
        {/* Type-specific details */}
{resource.details && Object.keys(resource.details).length > 0 && (
  <div className="mb-6">
    <h2 className="text-sm font-semibold text-gray-700 mb-3">Facilities & Details</h2>
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(resource.details).map(([key, value]) => {
        if (value === '' || value === null) return null
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, s => s.toUpperCase())
        return (
          <div key={key} className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
            {typeof value === 'boolean' ? (
              <>
                <span>{value ? '✅' : '❌'}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </>
            ) : (
              <>
                <span className="text-xs text-gray-400">{label}:</span>
                <span className="text-xs font-medium text-gray-800">{value}</span>
              </>
            )}
          </div>
        )
      })}
    </div>
  </div>
)}

        {/* Description */}
        {resource.description && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {resource.description}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {resource.status === 'AVAILABLE' && (
            <Link
              to={`/bookings/new?resourceId=${resource.id}&resourceName=${resource.name}`}
              className="btn-primary flex-1 text-center"
            >
              📅 Book this resource
            </Link>
          )}
          {resource.status !== 'AVAILABLE' && (
            <div className="flex-1 bg-gray-100 text-gray-500 text-sm rounded-lg
                            px-4 py-2 text-center">
              Not available for booking
            </div>
          )}
          <Link to="/tickets/new" className="btn-secondary text-sm">
            🔧 Report issue
          </Link>
        </div>
      </div>

      {/* Admin panel */}
      {isAdmin && (
        <div className="card border-orange-200 bg-orange-50/30">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            ⚙️ Admin Controls
          </h2>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Change status:</label>
              <select
                value={resource.status}
                onChange={e => handleStatusChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
            <Link
              to={`/resources/${resource.id}/edit`}
              className="btn-secondary text-sm"
            >
              ✏️ Edit resource
            </Link>
            <button
              onClick={handleDelete}
              className="btn-danger text-sm"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}