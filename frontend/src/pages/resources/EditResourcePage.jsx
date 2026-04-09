import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getResourceById, updateResource } from '../../api/resourceApi'
import toast from 'react-hot-toast'

// Same RESOURCE_TYPES and DetailsField component as NewResourcePage — copy them here

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

function DetailsField({ field, value, onChange }) {
  if (field.type === 'checkbox') return (
    <label className="flex items-center gap-3 py-2 cursor-pointer group">
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center
                       transition-colors
                       ${value
                         ? 'bg-indigo-600 border-indigo-600'
                         : 'border-gray-300 group-hover:border-indigo-400'
                       }`}>
        {value && <span className="text-white text-xs">✓</span>}
      </div>
      <input type="checkbox" name={field.name} checked={!!value}
        onChange={onChange} className="sr-only" />
      <span className="text-sm text-gray-700">{field.label}</span>
    </label>
  )
  if (field.type === 'select') return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
      <select name={field.name} className="input" value={value ?? ''} onChange={onChange}>
        <option value="">Select...</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{field.label}</label>
      <input type={field.type} name={field.name} className="input"
        placeholder={field.placeholder} value={value ?? ''} onChange={onChange} />
    </div>
  )
}

export default function EditResourcePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({
    name: '', type: 'LECTURE_HALL',
    location: '', capacity: '', description: '', status: 'AVAILABLE',
  })
  const [details, setDetails] = useState({})

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
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )

  const currentType = RESOURCE_TYPES[form.type]

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/resources/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500
                   hover:text-gray-800 transition-colors mb-6">
        ← Back to Resource
      </Link>

      <div className="rounded-t-2xl overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}>
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-white mb-0.5">Edit Resource</h1>
          <p className="text-blue-200 text-sm">Update the details below</p>
        </div>
      </div>

      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 px-6 py-6">
        <div className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Resource Name <span className="text-red-400">*</span>
              </label>
              <input name="name" className="input" value={form.name} onChange={handleFormChange} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
              <select name="type" className="input" value={form.type} onChange={handleFormChange}>
                {Object.entries(RESOURCE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Location</label>
              <input name="location" className="input" value={form.location} onChange={handleFormChange} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select name="status" className="input" value={form.status} onChange={handleFormChange}>
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
          </div>

          {form.type !== 'VEHICLE' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Capacity</label>
              <input name="capacity" type="number" min="1" className="input"
                value={form.capacity} onChange={handleFormChange} />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
            <textarea name="description" className="input resize-none" rows={3}
              value={form.description} onChange={handleFormChange} />
          </div>

          {currentType && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <h3 className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>{currentType.icon}</span> {currentType.label} Details
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
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
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 py-2.5">
              {loading ? 'Saving...' : '✓ Save Changes'}
            </button>
            <Link to={`/resources/${id}`} className="btn-secondary flex-1 text-center py-2.5">
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}