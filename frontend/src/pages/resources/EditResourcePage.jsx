import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getResourceById, updateResource } from '../../api/resourceApi'
import toast from 'react-hot-toast'

// ── Resource type definitions with per-type field config ─────
const RESOURCE_TYPES = {
  LECTURE_HALL: {
    label: 'Lecture Hall', icon: '🏛️',
    fields: [
      { name: 'block',         label: 'Block',            type: 'text',     placeholder: 'e.g. Block A, Block B' },
      { name: 'floor',         label: 'Floor',            type: 'text',     placeholder: 'e.g. Ground Floor, 1st Floor' },
      { name: 'hasProjector',  label: 'Projector',        type: 'checkbox' },
      { name: 'hasAC',         label: 'Air Conditioning', type: 'checkbox' },
      { name: 'hasWhiteboard', label: 'Whiteboard',       type: 'checkbox' },
    ]
  },
  COMPUTER_LAB: {
    label: 'Computer Lab', icon: '🖥️',
    fields: [
      { name: 'numberOfComputers', label: 'Number of Computers', type: 'number',   placeholder: 'e.g. 30, 40, 60' },
      { name: 'software',          label: 'Installed Software',  type: 'text',     placeholder: 'e.g. MS Office, Visual Studio, AutoCAD' },
      { name: 'operatingSystem',   label: 'Operating System',    type: 'text',     placeholder: 'e.g. Windows 11, Ubuntu 22' },
      { name: 'hasProjector',      label: 'Projector',           type: 'checkbox' },
      { name: 'hasAC',             label: 'Air Conditioning',    type: 'checkbox' },
      { name: 'hasInternetAccess', label: 'Internet Access',     type: 'checkbox' },
    ]
  },
  SPORTS_FACILITY: {
    label: 'Sports / Gym', icon: '🏋️',
    fields: [
      { name: 'sportType',      label: 'Sport / Facility Type', type: 'text',     placeholder: 'e.g. Basketball Court, Swimming Pool, Gym' },
      { name: 'surfaceType',    label: 'Surface Type',          type: 'text',     placeholder: 'e.g. Wooden, Concrete, Artificial Grass' },
      { name: 'dimensions',     label: 'Dimensions',            type: 'text',     placeholder: 'e.g. 28m x 15m' },
      { name: 'isIndoor',       label: 'Indoor Facility',       type: 'checkbox' },
      { name: 'hasEquipment',   label: 'Equipment Provided',    type: 'checkbox' },
      { name: 'hasChangeRooms', label: 'Change Rooms',          type: 'checkbox' },
      { name: 'hasLighting',    label: 'Flood Lighting',        type: 'checkbox' },
    ]
  },
  MEETING_ROOM: {
    label: 'Meeting Room', icon: '🪑',
    fields: [
      { name: 'floor',              label: 'Floor',              type: 'text',     placeholder: 'e.g. 3rd Floor, Ground Floor' },
      { name: 'roomNumber',         label: 'Room Number',        type: 'text',     placeholder: 'e.g. MR-01, Conference Room B' },
      { name: 'hasProjector',       label: 'Projector',          type: 'checkbox' },
      { name: 'hasVideoConference', label: 'Video Conferencing', type: 'checkbox' },
      { name: 'hasWhiteboard',      label: 'Whiteboard',         type: 'checkbox' },
      { name: 'hasTV',              label: 'Smart TV / Display', type: 'checkbox' },
    ]
  },
  VEHICLE: {
    label: 'Vehicle', icon: '🚌',
    fields: [
      { name: 'vehicleNumber',   label: 'Vehicle Number',    type: 'text',   placeholder: 'e.g. WP CAB-1234, NB-5678' },
      { name: 'brand',           label: 'Brand',             type: 'text',   placeholder: 'e.g. Toyota, Isuzu, Tata' },
      { name: 'model',           label: 'Model',             type: 'text',   placeholder: 'e.g. HiAce, Coaster, Defender' },
      { name: 'year',            label: 'Year of Manufacture', type: 'number', placeholder: 'e.g. 2019' },
      { name: 'colour',          label: 'Colour',            type: 'text',   placeholder: 'e.g. White, Blue' },
      { name: 'fuelType',        label: 'Fuel Type',         type: 'select', options: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'] },
      { name: 'seatingCapacity', label: 'Seating Capacity',  type: 'number', placeholder: 'e.g. 14, 28, 50' },
      { name: 'driverRequired',  label: 'Requires University Driver', type: 'checkbox' },
      { name: 'hasAC',           label: 'Air Conditioning',  type: 'checkbox' },
    ]
  },
  LIBRARY_STUDY_ROOM: {
    label: 'Library Study Room', icon: '📚',
    fields: [
      { name: 'floor',          label: 'Floor',              type: 'text',   placeholder: 'e.g. 2nd Floor, 3rd Floor' },
      { name: 'roomNumber',     label: 'Room Number',        type: 'text',   placeholder: 'e.g. SR-01, Study Pod A' },
      { name: 'numberOfSeats',  label: 'Number of Seats',    type: 'number', placeholder: 'e.g. 4, 6, 8, 10' },
      { name: 'isQuietZone',    label: 'Quiet Zone',         type: 'checkbox' },
      { name: 'hasWhiteboard',  label: 'Whiteboard',         type: 'checkbox' },
      { name: 'hasPowerPoints', label: 'Power Outlets',      type: 'checkbox' },
      { name: 'hasTV',          label: 'Smart TV / Display', type: 'checkbox' },
    ]
  },
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4"
      style={{ animation: 'spin 0.8s linear infinite' }}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ── Details field sub-component ──────────────────────────────
function DetailsField({ field, value, onChange }) {
  if (field.type === 'checkbox') return (
    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-colors cursor-pointer">
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          value ? 'bg-blue-700 border-blue-700' : 'border-gray-300'
        }`}
      >
        {value && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <input
        type="checkbox"
        name={field.name}
        checked={!!value}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-sm font-medium text-gray-700">{field.label}</span>
    </label>
  )

  if (field.type === 'select') return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {field.label}
      </label>
      <select
        name={field.name}
        className="input"
        value={value ?? ''}
        onChange={onChange}
      >
        <option value="">Select...</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {field.label}
      </label>
      <input
        type={field.type}
        name={field.name}
        className="input"
        placeholder={field.placeholder}
        value={value ?? ''}
        onChange={onChange}
      />
    </div>
  )
}

export default function EditResourcePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────────
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({
    name: '', type: 'LECTURE_HALL',
    location: '', capacity: '', description: '', status: 'AVAILABLE',
  })
  const [details, setDetails] = useState({})

  // ── Data fetching ───────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getResourceById(id)
        setForm({
          name:        data.name        ?? '',
          type:        data.type        ?? 'LECTURE_HALL',
          location:    data.location    ?? '',
          capacity:    data.capacity    ?? '',
          description: data.description ?? '',
          status:      data.status      ?? 'AVAILABLE',
        })
        setDetails(data.details ?? {})
      } catch {
        toast.error('Resource not found.')
        navigate('/resources')
      } finally {
        setFetching(false)
      }
    }
    fetch()
  }, [id, navigate])

  // ── Event handlers and submit ───────────────────────────────
  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleDetailChange = (e) => {
    const { name, type, value, checked } = e.target
    setDetails(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.type) {
      toast.error('Name and type are required.')
      return
    }
    try {
      setLoading(true)
      await updateResource(id, {
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        details,
      })
      toast.success('Resource updated!')
      navigate(`/resources/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return (
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

  const currentType = RESOURCE_TYPES[form.type]

  return (
    <div className="max-w-2xl mx-auto page-fade-in">
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
            to={`/resources/${id}`}
            className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Resource
          </Link>

          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-2xl"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {currentType?.icon || '📦'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Edit Resource</h1>
              <p className="text-blue-200 text-sm mt-0.5">
                Update the details below
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Resource Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                className="input"
                value={form.name}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Type
              </label>
              <select
                name="type"
                className="input"
                value={form.type}
                onChange={handleFormChange}
              >
                {Object.entries(RESOURCE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Location
              </label>
              <input
                name="location"
                className="input"
                value={form.location}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Status
              </label>
              <select
                name="status"
                className="input"
                value={form.status}
                onChange={handleFormChange}
              >
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
          </div>

          {form.type !== 'VEHICLE' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Capacity
              </label>
              <input
                name="capacity"
                type="number"
                min="1"
                className="input"
                value={form.capacity}
                onChange={handleFormChange}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={handleFormChange}
            />
          </div>

          {currentType && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
                  {currentType.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    {currentType.label} Details
                  </h3>
                  <p className="text-xs text-gray-500">
                    Update the resource-specific information
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentType.fields.map(field => (
                  <DetailsField
                    key={field.name}
                    field={field}
                    value={details[field.name]}
                    onChange={handleDetailChange}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
            >
              {loading ? (
                <Spinner />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>

            <Link
              to={`/resources/${id}`}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors text-center"
            >
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}