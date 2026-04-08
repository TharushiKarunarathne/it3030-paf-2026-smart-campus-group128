import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { createBooking, getBookingsByResource } from '../../api/bookingApi'
import { getResourceById, getResources } from '../../api/resourceApi'
import toast from 'react-hot-toast'

const TYPE_ICON = {
  LECTURE_HALL: '🏛️', COMPUTER_LAB: '🖥️', SPORTS_FACILITY: '🏋️',
  MEETING_ROOM: '🪑', VEHICLE: '🚌', LIBRARY_STUDY_ROOM: '📚',
}

const TYPE_CONFIG = {
  LECTURE_HALL:       { label: 'Lecture Hall',       color: 'bg-blue-50 text-blue-600',    accent: 'bg-blue-500' },
  COMPUTER_LAB:       { label: 'Computer Lab',       color: 'bg-purple-50 text-purple-600', accent: 'bg-purple-500' },
  SPORTS_FACILITY:    { label: 'Sports / Gym',       color: 'bg-green-50 text-green-600',  accent: 'bg-green-500' },
  MEETING_ROOM:       { label: 'Meeting Room',       color: 'bg-sky-50 text-sky-600',      accent: 'bg-sky-500' },
  VEHICLE:            { label: 'Vehicle',            color: 'bg-amber-50 text-amber-600',  accent: 'bg-amber-500' },
  LIBRARY_STUDY_ROOM: { label: 'Library Study Room', color: 'bg-teal-50 text-teal-600',    accent: 'bg-teal-500' },
}

const TYPE_FILTERS = [
  { key: 'ALL',                label: 'All' },
  { key: 'LECTURE_HALL',       label: 'Lecture Halls' },
  { key: 'COMPUTER_LAB',       label: 'Computer Labs' },
  { key: 'VEHICLE',            label: 'Vehicles' },
  { key: 'SPORTS_FACILITY',    label: 'Sports' },
  { key: 'MEETING_ROOM',       label: 'Meeting Rooms' },
  { key: 'LIBRARY_STUDY_ROOM', label: 'Library' },
]

function formatTime(dt) {
  return new Date(dt).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Availability Panel ─────────────────────────────────
function AvailabilityPanel({ resourceId, selectedDate }) {
  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    if (!resourceId || !selectedDate) {
      setBookedSlots([])
      return
    }

    const fetchSlots = async () => {
      try {
        setLoading(true)
        const { data } = await getBookingsByResource(resourceId)
        const bookings = Array.isArray(data) ? data : []

        // Filter only APPROVED bookings for the selected date
        const daySlots = bookings.filter(b => {
          if (b.status !== 'APPROVED') return false
          const bookingDate = b.startTime.substring(0, 10)
          return bookingDate === selectedDate
        })

        // Sort by start time
        daySlots.sort((a, b) =>
          new Date(a.startTime) - new Date(b.startTime)
        )

        setBookedSlots(daySlots)
      } catch {
        setBookedSlots([])
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [resourceId, selectedDate])

  if (!selectedDate) return null

  // Format time from local datetime string e.g. "2026-04-20T09:00:00"
  const fmtTime = (dtStr) => {
    const [, timePart] = dtStr.split('T')
    const [h, m] = timePart.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayH = hour % 12 === 0 ? 12 : hour % 12
    return `${String(displayH).padStart(2, '0')}:${m} ${ampm}`
  }

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          📅 Availability for{' '}
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : bookedSlots.length === 0 ? (
          <div className="flex items-center gap-3 bg-green-50 border
                          border-green-100 rounded-xl px-4 py-3">
            <span className="text-green-500 text-lg">✓</span>
            <div>
              <p className="text-sm font-semibold text-green-700">
                Fully available
              </p>
              <p className="text-xs text-green-600">
                No approved bookings on this day
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">

            {/* Booked slots */}
            <p className="text-xs font-medium text-gray-500 mb-2">
              Booked slots — avoid these times:
            </p>
            {bookedSlots.map((slot, i) => (
              <div key={i}
                className="flex items-center gap-3 bg-red-50 border
                           border-red-100 rounded-xl px-4 py-2.5">
                <span className="text-red-400 text-sm">🔴</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">
                    {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                  </p>
                  {slot.purpose && (
                    <p className="text-xs text-red-500 truncate">
                      {slot.purpose}
                    </p>
                  )}
                </div>
                <span className="text-xs bg-red-100 text-red-600
                                 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                  Booked
                </span>
              </div>
            ))}

            {/* Available gaps */}
            <p className="text-xs font-medium text-gray-500 mt-3 mb-2">
              Available gaps:
            </p>

            {/* Before first booking */}
            {(() => {
              const firstStart = bookedSlots[0].startTime.split('T')[1].substring(0, 5)
              if (firstStart > '08:00') {
                return (
                  <div className="flex items-center gap-3 bg-green-50 border
                                  border-green-100 rounded-xl px-4 py-2.5">
                    <span className="text-green-500 text-sm">✅</span>
                    <p className="text-sm font-medium text-green-700">
                      08:00 AM – {fmtTime(bookedSlots[0].startTime)}
                    </p>
                  </div>
                )
              }
              return null
            })()}

            {/* Gaps between bookings */}
            {bookedSlots.slice(0, -1).map((slot, i) => {
              const gapStartStr = slot.endTime.split('T')[1].substring(0, 5)
              const gapEndStr   = bookedSlots[i + 1].startTime.split('T')[1].substring(0, 5)
              const [sh, sm]    = gapStartStr.split(':').map(Number)
              const [eh, em]    = gapEndStr.split(':').map(Number)
              const gapMins     = (eh * 60 + em) - (sh * 60 + sm)
              if (gapMins < 30) return null
              return (
                <div key={i}
                  className="flex items-center gap-3 bg-green-50 border
                             border-green-100 rounded-xl px-4 py-2.5">
                  <span className="text-green-500 text-sm">✅</span>
                  <p className="text-sm font-medium text-green-700">
                    {fmtTime(slot.endTime)} – {fmtTime(bookedSlots[i + 1].startTime)}
                  </p>
                </div>
              )
            })}

            {/* After last booking */}
            {(() => {
              const lastEnd = bookedSlots[bookedSlots.length - 1].endTime
                .split('T')[1].substring(0, 5)
              if (lastEnd < '22:00') {
                return (
                  <div className="flex items-center gap-3 bg-green-50 border
                                  border-green-100 rounded-xl px-4 py-2.5">
                    <span className="text-green-500 text-sm">✅</span>
                    <p className="text-sm font-medium text-green-700">
                      {fmtTime(bookedSlots[bookedSlots.length - 1].endTime)} – 10:00 PM
                    </p>
                  </div>
                )
              }
              return null
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

export default function NewBookingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resourceIdFromUrl   = searchParams.get('resourceId')
  const resourceNameFromUrl = searchParams.get('resourceName')

  // Step state
  const [step, setStep] = useState(resourceIdFromUrl ? 2 : 1)

  // Resource browser state
  const [allResources, setAllResources]         = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [typeFilter, setTypeFilter]             = useState('ALL')
  const [search, setSearch]                     = useState('')

  // Form state
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    date: '', startTime: '', endTime: '', purpose: '',
  })
  const [error, setError] = useState('')

  // Load resource from URL params
  useEffect(() => {
    if (resourceIdFromUrl) {
      getResourceById(resourceIdFromUrl)
        .then(({ data }) => setSelectedResource(data))
        .catch(() => {
          toast.error('Resource not found.')
          setStep(1)
        })
    }
  }, [resourceIdFromUrl])

  // Load all resources for browser
  useEffect(() => {
    if (step === 1) {
      setResourcesLoading(true)
      getResources()
        .then(({ data }) => setAllResources(Array.isArray(data) ? data : []))
        .catch(() => toast.error('Failed to load resources.'))
        .finally(() => setResourcesLoading(false))
    }
  }, [step])

  const filteredResources = allResources
    .filter(r => r.status === 'AVAILABLE')
    .filter(r => typeFilter === 'ALL' || r.type === typeFilter)
    .filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        r.name?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q)
      )
    })

  const handleSelectResource = (resource) => {
    setSelectedResource(resource)
    setStep(2)
  }

  const handleChangeResource = () => {
    setSelectedResource(null)
    setStep(1)
    setForm({ date: '', startTime: '', endTime: '', purpose: '' })
    setError('')
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

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
    if (!selectedResource)              return 'Please select a resource.'
    if (!form.date)                     return 'Please select a date.'
    if (!form.startTime)                return 'Please select a start time.'
    if (!form.endTime)                  return 'Please select an end time.'
    if (form.endTime <= form.startTime) return 'End time must be after start time.'
    if (!form.purpose.trim())           return 'Please enter the purpose of this booking.'

    // Past time check using local time correctly
    const now        = new Date()
    const localNow   = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
    const start      = new Date(`${form.date}T${form.startTime}:00`)
    if (start < localNow) return 'Cannot book a time slot in the past.'

    const end  = new Date(`${form.date}T${form.endTime}:00`)
    const mins = (end - start) / 60000
    if (mins < 30)  return 'Minimum booking duration is 30 minutes.'
    if (mins > 480) return 'Maximum booking duration is 8 hours.'

    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }

    try {
      setLoading(true)

      // Send local time directly — no UTC conversion
      // Backend parses as LocalDateTime so no timezone shift
      const startTime = `${form.date}T${form.startTime}:00`
      const endTime   = `${form.date}T${form.endTime}:00`

      const { data } = await createBooking({
        resourceId:   selectedResource.id,
        resourceName: selectedResource.name,
        resourceType: selectedResource.type,
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

  // Duration display
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

  const today = new Date().toISOString().split('T')[0]

  // ── Step 1: Resource Browser ───────────────────────
  if (step === 1) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link to="/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500
                     hover:text-gray-800 transition-colors mb-6">
          ← Back to My Bookings
        </Link>

        <div className="rounded-t-2xl overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}>
          <div className="px-6 py-5">
            <h1 className="text-xl font-bold text-white mb-0.5">New Booking</h1>
            <p className="text-blue-200 text-sm">
              Step 1 of 2 — Choose a resource to book
            </p>
          </div>
        </div>

        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 px-6 py-5">

          <div className="flex gap-3 mb-4">
            <input
              className="input flex-1"
              placeholder="Search by name or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                  ${typeFilter === f.key
                    ? 'bg-indigo-700 text-white'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {resourcesLoading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🏛️</p>
              <p className="text-gray-500 text-sm">No available resources found</p>
              <p className="text-gray-400 text-xs mt-1">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredResources.map(resource => {
                const typeConf = TYPE_CONFIG[resource.type] ??
                  { label: resource.type, color: 'bg-gray-50 text-gray-600', accent: 'bg-gray-400' }
                const icon = TYPE_ICON[resource.type] ?? '📦'

                return (
                  <button
                    key={resource.id}
                    onClick={() => handleSelectResource(resource)}
                    className="text-left border border-gray-100 rounded-xl p-4
                               hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5
                               transition-all duration-200 bg-white group"
                  >
                    <div className={`h-0.5 ${typeConf.accent} rounded-full mb-3
                                     opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center
                                       justify-center text-xl flex-shrink-0 ${typeConf.color}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {resource.name}
                        </p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                          {typeConf.label}
                        </p>
                        {resource.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {resource.location}
                          </p>
                        )}
                        {resource.capacity && (
                          <p className="text-xs text-gray-500">
                            👥 Capacity: {resource.capacity}
                          </p>
                        )}
                      </div>
                      <span className="text-indigo-400 text-lg group-hover:translate-x-1
                                       transition-transform flex-shrink-0">
                        →
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            Only available resources are shown
          </p>
        </div>
      </div>
    )
  }

  // ── Step 2: Booking Form ───────────────────────────
  return (
    <div className="max-w-xl mx-auto">
      <Link to="/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500
                   hover:text-gray-800 transition-colors mb-6">
        ← Back to My Bookings
      </Link>

      <div className="rounded-t-2xl overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}>
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-white mb-0.5">New Booking</h1>
          <p className="text-blue-200 text-sm">
            Step 2 of 2 — Fill in your booking details
          </p>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 px-6 py-6">
        <div className="space-y-5">

          {/* Selected resource display */}
          {selectedResource && (
            <div>
              <label className="block text-xs font-semibold text-gray-400
                                uppercase tracking-wider mb-2">
                Resource
              </label>
              <div className="flex items-center gap-3 bg-indigo-50/60 border
                              border-indigo-100 rounded-xl p-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                 text-xl flex-shrink-0
                                 ${TYPE_CONFIG[selectedResource.type]?.color ?? 'bg-gray-50'}`}>
                  {TYPE_ICON[selectedResource.type] ?? '📦'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {selectedResource.name}
                  </p>
                  <p className="text-xs text-blue-600">
                    {TYPE_CONFIG[selectedResource.type]?.label ?? selectedResource.type}
                    {selectedResource.location ? ` · ${selectedResource.location}` : ''}
                  </p>
                </div>
                {!resourceIdFromUrl ? (
                  <button
                    onClick={handleChangeResource}
                    className="text-xs text-indigo-600 hover:text-indigo-800
                               font-medium underline underline-offset-2 flex-shrink-0">
                    Change
                  </button>
                ) : (
                  <Link
                    to="/resources"
                    className="text-xs text-gray-400 hover:text-gray-600
                               underline underline-offset-2 flex-shrink-0">
                    Change
                  </Link>
                )}
              </div>
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

          {/* Availability Panel — shows after date is picked */}
          {selectedResource && (
            <AvailabilityPanel
              resourceId={selectedResource.id}
              selectedDate={form.date}
            />
          )}

          {/* Start + End time */}
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
              <span className="text-xs bg-green-50 text-green-700 border
                               border-green-100 px-3 py-1 rounded-full font-medium">
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
              placeholder="e.g. CS3001 Lab Session — Group 4, Faculty meeting..."
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
              ℹ️ Bookings require admin approval. You'll be notified once
              your request is reviewed.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1 py-2.5 disabled:opacity-50
                         disabled:cursor-not-allowed">
              {loading ? 'Submitting...' : '📅 Submit booking request'}
            </button>
            <button
              onClick={handleChangeResource}
              className="btn-secondary px-4 py-2.5">
              ← Back
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}