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

function Spinner() {
  return (
    <svg
      className="w-5 h-5"
      style={{ animation: 'spin 0.8s linear infinite' }}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function ConfirmDialog({ message, subMessage, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{message}</h3>
          {subMessage && <p className="text-sm text-gray-500">{subMessage}</p>}
        </div>

        <div className="flex gap-3 p-5">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
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
  const [loading, setLoading] = useState(true)
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
    <div className="max-w-2xl mx-auto page-fade-in">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-14 flex flex-col items-center justify-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
          >
            <Spinner />
          </div>
          <p className="text-sm font-medium text-gray-600">Loading resource details...</p>
        </div>
      </div>
    </div>
  )

  if (!resource) return null

  return (
    <div className="max-w-2xl mx-auto page-fade-in">
      {showDeleteConfirm && (
        <ConfirmDialog
          message="Delete this resource permanently?"
          subMessage="This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Hero header */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-7 mb-6"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}
      >
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/3 translate-x-1/4 opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }}
        />

        <div className="relative z-10">
          <Link
            to="/resources"
            className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Resources
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <span className="text-white">{TYPE_ICON[resource.type] ?? '📦'}</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold text-white truncate">{resource.name}</h1>
                <p className="text-blue-200 text-sm mt-0.5">{resource.type}</p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLE[resource.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {resource.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main details card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
        <div className="p-6">
          {/* Info grid */}
          {(resource.location || resource.capacity || resource.building) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {resource.location && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-xs text-gray-400 mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-800">📍 {resource.location}</p>
                </div>
              )}

              {resource.capacity && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-xs text-gray-400 mb-1">Capacity</p>
                  <p className="text-sm font-medium text-gray-800">👥 {resource.capacity} people</p>
                </div>
              )}

              {resource.building && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="text-xs text-gray-400 mb-1">Building</p>
                  <p className="text-sm font-medium text-gray-800">🏢 {resource.building}</p>
                </div>
              )}
            </div>
          )}

          {/* Type-specific details */}
          {resource.details && Object.keys(resource.details).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
                  {TYPE_ICON[resource.type] ?? '📦'}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800">Facilities & Details</h2>
                  <p className="text-xs text-gray-500">Resource-specific information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(resource.details).map(([key, value]) => {
                  if (value === '' || value === null) return null

                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, s => s.toUpperCase())

                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3 flex items-center gap-2"
                    >
                      {typeof value === 'boolean' ? (
                        <>
                          <span className="text-sm">{value ? '✅' : '❌'}</span>
                          <span className="text-sm font-medium text-gray-700">{label}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-gray-400">{label}:</span>
                          <span className="text-sm font-medium text-gray-800">{value}</span>
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
              <h2 className="text-sm font-bold text-gray-800 mb-2">Description</h2>
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
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
              >
                <span>📅</span>
                Book this resource
              </Link>
            )}

            {resource.status !== 'AVAILABLE' && (
              <div className="flex-1 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium px-4 py-2.5 text-center">
                Not available for booking
              </div>
            )}

            <Link
              to="/tickets/new"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors text-center"
            >
              🔧 Report issue
            </Link>
          </div>
        </div>
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <span className="text-lg">⚙️</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Admin Controls</h2>
                <p className="text-xs text-gray-500">Manage this resource</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <label className="text-xs font-medium text-gray-600">Change status:</label>
                <select
                  value={resource.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              </div>

              <Link
                to={`/resources/${resource.id}/edit`}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                ✏️ Edit resource
              </Link>

              <button
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}