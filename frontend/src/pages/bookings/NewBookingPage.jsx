import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { createBooking } from '../../api/bookingApi'
import { getResourceById } from '../../api/resourceApi'
import toast from 'react-hot-toast'

const TYPE_ICON = {
  LECTURE_HALL: '🏛️', COMPUTER_LAB: '🖥️', SPORTS_FACILITY: '🏋️',
  MEETING_ROOM: '🪑', VEHICLE: '🚌', LIBRARY_STUDY_ROOM: '📚',
}

export default function NewBookingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resourceId   = searchParams.get('resourceId')
  const resourceName = searchParams.get('resourceName')

  const [resource, setResource] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [form, setForm] = useState({
    date:      '',
    startTime: '',
    endTime:   '',
    purpose:   '',
  })
  const [error, setError] = useState('')

  // Load resource details for display
  useEffect(() => {
    if (!resourceId) return
    getResourceById(resourceId)
      .then(({ data }) => setResource(data))
      .catch(() => {})
  }, [resourceId])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  // Auto-calculate end time when start changes (default +1 hour)
  const handleStartChange = (e) => {
    const start = e.target.value
    setForm(prev => {
      let end = prev.endTime
      if (start && (!prev.endTime || prev.endTime <= start)) {
        const [h, m] = start.split(':').map(Number)
        const endH = (h + 1) % 24
        end = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      }
      return { ...prev, startTime: start, endTime: end }
    })
    setError('')
  }

  const validate = () => {
    if (!resourceId)          return 'No resource selected.'
    if (!form.date)           return 'Please select a date.'
    if (!form.startTime)      return 'Please select a start time.'
    if (!form.endTime)        return 'Please select an end time.'
    if (form.endTime <= form.startTime) return 'End time must be after start time.'
    if (!form.purpose.trim()) return 'Please enter the purpose of this booking.'

    // Cannot book in the past
    const now = new Date()
    const start = new Date(`${form.date}T${form.startTime}`)
    if (start < now) return 'Cannot book a time slot in the past.'

    // Min 30 min
    const end = new Date(`${form.date}T${form.endTime}`)
    const mins = (end - start) / 60000
    if (mins < 30) return 'Minimum booking duration is 30 minutes.'
    if (mins > 480) return 'Maximum booking duration is 8 hours.'

    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }

    try {
      setLoading(true)
      const startTime = new Date(`${form.date}T${form.startTime}`).toISOString()
      const endTime   = new Date(`${form.date}T${form.endTime}`).toISOString()

      const { data } = await createBooking({
        resourceId,
        resourceName: resource?.name ?? resourceName,
        resourceType: resource?.type,
        startTime,
        endTime,
        purpose: form.purpose.trim(),
      })
      toast.success('Booking submitted! Waiting for approval.')
      navigate(`/bookings/${data.id}`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit booking.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Calculate duration for display
  let durationLabel = ''
  if (form.startTime && form.endTime && form.endTime > form.startTime) {
    const [sh, sm] = form.startTime.split(':').map(Number)
    const [eh, em] = form.endTime.split(':').map(Number)
    const mins = (eh * 60 + em) - (sh * 60 + sm)
    if (mins > 0) {
      const h = Math.floor(mins / 60), m = mins % 60
      durationLabel = m ? `${h}h ${m}m` : `${h}h`
    }
  }

  // Today's date for min attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-xl mx-auto">
      <Link to={resourceId ? `/resources/${resourceId}` : '/resources'}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500
                   hover:text-gray-800 transition-colors mb-6">
        ← Back
      </Link>

      {/* Hero */}
      <div className="rounded-t-2xl overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}>
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-white mb-0.5">New Booking</h1>
          <p className="text-blue-200 text-sm">
            Select your time slot and submit for approval
          </p>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 px-6 py-6">
        <div className="space-y-5">

          {/* Resource display */}
          {(resource || resourceName) && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase
                                tracking-wider mb-2">
                Resource
              </label>
              <div className="flex items-center gap-3 bg-indigo-50/60 border
                              border-indigo-100 rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center
                                justify-center text-xl flex-shrink-0">
                  {TYPE_ICON[resource?.type] ?? '📦'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {resource?.name ?? resourceName}
                  </p>
                  <p className="text-xs text-blue-600">
                    {resource?.type?.replace(/_/g, ' ')}
                    {resource?.location ? ` · ${resource.location}` : ''}
                  </p>
                </div>
                <Link to="/resources"
                  className="ml-auto text-xs text-gray-400 hover:text-gray-600
                             underline underline-offset-2">
                  Change
                </Link>
              </div>
            </div>
          )}

          {!resourceId && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-700 mb-3">
                No resource selected. Please choose one first.
              </p>
              <Link to="/resources" className="btn-primary text-sm inline-block">
                Browse resources
              </Link>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="date"
              min={today}
              className="input"
              value={form.date}
              onChange={handleChange}
            />
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Start time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                name="startTime"
                className="input"
                value={form.startTime}
                onChange={handleStartChange}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                End time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                name="endTime"
                className="input"
                value={form.endTime}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Duration chip */}
          {durationLabel && (
            <div className="flex items-center gap-2 -mt-2">
              <span className="text-xs bg-green-50 text-green-700 border border-green-100
                               px-3 py-1 rounded-full font-medium">
                ⏱ {durationLabel}
              </span>
            </div>
          )}

          {/* Purpose */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Purpose <span className="text-red-400">*</span>
            </label>
            <textarea
              name="purpose"
              className="input resize-none"
              rows={3}
              placeholder="e.g. CS3001 Lab Session — Group 4, Faculty meeting, Field trip..."
              value={form.purpose}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-400 mt-1">
              Be specific — this helps admin approve faster.
            </p>
          </div>

          {/* Validation error */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              ℹ️ Bookings require admin approval. You'll be notified once your
              request is reviewed. Approved bookings cannot be edited.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSubmit}
              disabled={loading || !resourceId}
              className="btn-primary flex-1 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : '📅 Submit booking request'}
            </button>
            <Link
              to={resourceId ? `/resources/${resourceId}` : '/resources'}
              className="btn-secondary flex-1 text-center py-2.5"
            >
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}