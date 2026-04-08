import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTicket } from '../../api/ticketApi'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'Lecture Halls', 'Computer Labs', 'Vehicles', 'Sports', 'Meeting Rooms', 'Library']

export default function NewTicketPage() {
  const navigate = useNavigate()
  const { isTechnician } = useAuth()

  const [form, setForm] = useState({
    title:       '',
    description: '',
    priority:    'MEDIUM',
    category:    'Other',
    location:    '',
  })
  const [image, setImage]     = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  // Technicians cannot create tickets
  if (isTechnician) {
    return (
      <div className="max-w-md mx-auto mt-16 card text-center py-12">
        <p className="text-5xl mb-4">🚫</p>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Not Allowed</h2>
        <p className="text-sm text-gray-500 mb-6">
          Technicians cannot create tickets. You can view and resolve assigned tickets.
        </p>
        <button onClick={() => navigate('/tickets')} className="btn-primary">
          View All Tickets
        </button>
      </div>
    )
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim())       errs.title       = 'Title is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.location.trim())    errs.location    = 'Location is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      setLoading(true)
      let response
      if (image) {
        const formData = new FormData()
        Object.entries(form).forEach(([k, v]) => formData.append(k, v))
        formData.append('image', image)
        response = await createTicket(formData)
      } else {
        response = await createTicket(form)
      }
      toast.success('Ticket submitted successfully!')
      navigate(`/tickets/${response.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit ticket.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/tickets')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1"
        >
          ← Back to tickets
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Describe the problem and we'll assign a technician to resolve it.
        </p>
      </div>

      <div className="card space-y-5">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            className="input"
            placeholder="e.g. Broken AC in Room 204"
            value={form.title}
            onChange={handleChange}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            className="input resize-none"
            rows={4}
            placeholder="Describe the issue in detail — when it started, how severe it is, etc."
            value={form.description}
            onChange={handleChange}
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
        </div>

        {/* Category + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" className="input" value={form.category} onChange={handleChange}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select name="priority" className="input" value={form.priority} onChange={handleChange}>
              <option value="LOW">🔵 Low</option>
              <option value="MEDIUM">🟠 Medium</option>
              <option value="HIGH">🔴 High</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location / Room <span className="text-red-500">*</span>
          </label>
          <input
            name="location"
            className="input"
            placeholder="e.g. Block A, Room 204 or Main Lab"
            value={form.location}
            onChange={handleChange}
          />
          {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attach Image <span className="text-gray-400 font-normal">(optional, max 5MB)</span>
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32
                            border-2 border-dashed border-gray-300 rounded-lg cursor-pointer
                            hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            {preview ? (
              <img src={preview} alt="Preview"
                className="h-full w-full object-contain rounded-lg p-1" />
            ) : (
              <div className="text-center">
                <p className="text-2xl mb-1">📷</p>
                <p className="text-xs text-gray-500">Click to upload image</p>
                <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
              </div>
            )}
          </label>
          {image && (
            <button
              onClick={() => { setImage(null); setPreview(null) }}
              className="text-xs text-red-500 hover:underline mt-1"
            >
              Remove image
            </button>
          )}
        </div>

        {/* Priority guide */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600 mb-1">Priority guide:</p>
          <p>🔴 <strong>High</strong> — Safety hazard or blocking operations (e.g. power outage, flood)</p>
          <p>🟠 <strong>Medium</strong> — Affects work but has a workaround (e.g. broken projector)</p>
          <p>🔵 <strong>Low</strong> — Minor inconvenience (e.g. flickering light)</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
          <button onClick={() => navigate('/tickets')} className="btn-secondary">
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}