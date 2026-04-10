import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTicket } from '../../api/ticketApi'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

// ── Category lists ─────────────────────────────────────────
const RESOURCE_CATEGORIES = [
  'Lecture Halls', 'Computer Labs', 'Vehicles', 'Sports',
  'Meeting Rooms', 'Library', 'Other',
]

const TECH_CATEGORIES = [
  'Software', 'Network & WiFi', 'Hardware', 'Printer / Copier',
  'CCTV & Security', 'Audio / Visual Equipment', 'Server & Infrastructure', 'Other',
]

// Dynamic label + placeholder for location field based on resource category
const LOCATION_CONFIG = {
  'Lecture Halls':  { label: 'Lecture Hall / Room',    placeholder: 'e.g. Block A, Room 204' },
  'Computer Labs':  { label: 'Computer Lab',           placeholder: 'e.g. Computer Lab 1, Block B' },
  'Vehicles':       { label: 'Vehicle / Parking Area', placeholder: 'e.g. Vehicle Bay, Gate 2 Parking' },
  'Sports':         { label: 'Sports Facility',        placeholder: 'e.g. Sports Complex, Basketball Court' },
  'Meeting Rooms':  { label: 'Meeting Room',           placeholder: 'e.g. Meeting Room 3, Conference Hall B' },
  'Library':        { label: 'Library / Study Room',   placeholder: 'e.g. Library 2nd Floor, Reading Room 5' },
  'Other':          { label: 'Location / Area',        placeholder: 'e.g. Building name, Room or area number' },
}

const PRIORITY_DOT = { HIGH: 'bg-red-500', MEDIUM: 'bg-orange-400', LOW: 'bg-blue-500' }

function Spinner() {
  return (
    <svg className="w-4 h-4" style={{ animation: 'spin 0.8s linear infinite' }}
      fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  )
}

export default function NewTicketPage() {
  const navigate = useNavigate()
  const { isTechnician } = useAuth()

  // 'resource' | 'technical'
  const [ticketType, setTicketType] = useState('resource')

  const [form, setForm] = useState({
    title:       '',
    description: '',
    priority:    'MEDIUM',
    category:    'Lecture Halls',
    location:    '',
  })
  const [techForm, setTechForm] = useState({
    title:       '',
    description: '',
    priority:    'MEDIUM',
    category:    'Hardware',
  })

  const [images, setImages]     = useState([])   // File[]
  const [previews, setPreviews] = useState([])   // URL[]
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})

  // Technicians cannot create tickets
  if (isTechnician) {
    return (
      <div className="max-w-md mx-auto mt-16 page-fade-in">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-50">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Not Allowed</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Technicians cannot create tickets. You can view and resolve assigned tickets.
            </p>
            <button
              onClick={() => navigate('/tickets')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
            >
              View All Tickets
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const handleTechChange = (e) => {
    setTechForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const handleImage = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 3 - images.length
    if (remaining <= 0) { toast.error('Maximum 3 images allowed'); return }
    const toAdd = files.slice(0, remaining)
    const oversized = toAdd.filter(f => f.size > 5 * 1024 * 1024)
    if (oversized.length) { toast.error('Each image must be under 5MB'); return }
    setImages(prev => [...prev, ...toAdd])
    setPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    // reset input so same file can be re-added after removal
    e.target.value = ''
  }

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const switchType = (type) => {
    setTicketType(type)
    setErrors({})
    setImages([])
    setPreviews([])
  }

  const validate = () => {
    const errs = {}
    if (ticketType === 'resource') {
      if (!form.title.trim())       errs.title       = 'Title is required'
      if (!form.description.trim()) errs.description = 'Description is required'
      if (!form.location.trim())    errs.location    = 'Location is required'
    } else {
      if (!techForm.title.trim())       errs.title       = 'Title is required'
      if (!techForm.description.trim()) errs.description = 'Description is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      setLoading(true)
      const payload = ticketType === 'resource' ? form : { ...techForm, location: '' }

      let response
      if (images.length > 0) {
        const formData = new FormData()
        Object.entries(payload).forEach(([k, v]) => formData.append(k, v))
        images.forEach(img => formData.append('images', img))
        response = await createTicket(formData)
      } else {
        response = await createTicket(payload)
      }
      toast.success('Ticket submitted successfully!')
      navigate(`/tickets/${response.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit ticket.')
    } finally {
      setLoading(false)
    }
  }

  const isResource  = ticketType === 'resource'
  const locationCfg         = LOCATION_CONFIG[form.category] ?? { label: 'Location / Room', placeholder: 'e.g. Block A, Room 204' }
  const locationLabel       = locationCfg.label
  const locationPlaceholder = locationCfg.placeholder

  return (
    <div className="max-w-2xl mx-auto page-fade-in">

      {/* ── Hero header ───────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-7 mb-6"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/3 translate-x-1/4
                        opacity-10 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }} />
        <div className="relative z-10">
          <button
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to tickets
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'rgba(255,255,255,0.15)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Report an Issue</h1>
              <p className="text-blue-200 text-sm mt-0.5">
                Describe the problem and we'll assign a technician to resolve it.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Type toggle ────────────────────────────────── */}
      <div className="flex gap-3 mb-5">
        {/* Resource Issues */}
        <button
          onClick={() => switchType('resource')}
          className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2
                      transition-all duration-200 text-left
                      ${isResource
                        ? 'border-blue-700 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
          style={isResource ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderColor: '#1e3a5f' } : {}}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                           ${isResource ? 'bg-blue-700' : 'bg-gray-100'}`}>
            <svg className={`w-5 h-5 ${isResource ? 'text-white' : 'text-gray-500'}`}
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className={`text-sm font-bold ${isResource ? 'text-blue-900' : 'text-gray-700'}`}>
              Resource Issue
            </p>
            <p className={`text-xs ${isResource ? 'text-blue-600' : 'text-gray-400'}`}>
              Rooms, labs, vehicles & facilities
            </p>
          </div>
          {isResource && (
            <div className="ml-auto w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>

        {/* Technical Issues */}
        <button
          onClick={() => switchType('technical')}
          className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2
                      transition-all duration-200 text-left
                      ${!isResource
                        ? 'border-blue-700 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
          style={!isResource ? { background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderColor: '#1e3a5f' } : {}}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                           ${!isResource ? 'bg-blue-700' : 'bg-gray-100'}`}>
            <svg className={`w-5 h-5 ${!isResource ? 'text-white' : 'text-gray-500'}`}
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className={`text-sm font-bold ${!isResource ? 'text-blue-900' : 'text-gray-700'}`}>
              Technical Issue
            </p>
            <p className={`text-xs ${!isResource ? 'text-blue-600' : 'text-gray-400'}`}>
              Software, hardware, network & IT
            </p>
          </div>
          {!isResource && (
            <div className="ml-auto w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      </div>

      {/* ── Form card ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-5">

          {/* ── RESOURCE ISSUE FORM ── */}
          {isResource && (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title" className="input"
                  placeholder="e.g. Broken AC in Room 204"
                  value={form.title} onChange={handleChange}
                />
                <FieldError msg={errors.title} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description" className="input resize-none" rows={4}
                  placeholder="Describe the issue in detail — when it started, how severe it is, etc."
                  value={form.description} onChange={handleChange}
                />
                <FieldError msg={errors.description} />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                  <select name="category" className="input" value={form.category} onChange={handleChange}>
                    {RESOURCE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                  <select name="priority" className="input" value={form.priority} onChange={handleChange}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              {/* Location — dynamic placeholder */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {locationLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  name="location" className="input"
                  placeholder={locationPlaceholder}
                  value={form.location} onChange={handleChange}
                />
                <FieldError msg={errors.location} />
              </div>

              {/* Image upload */}
              <ImageUpload images={images} previews={previews}
                onChange={handleImage} onRemove={removeImage} />

              {/* Priority guide */}
              <PriorityGuide />
            </>
          )}

          {/* ── TECHNICAL ISSUE FORM ── */}
          {!isResource && (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title" className="input"
                  placeholder="e.g. WiFi disconnecting in Lab 3, Projector not turning on"
                  value={techForm.title} onChange={handleTechChange}
                />
                <FieldError msg={errors.title} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description" className="input resize-none" rows={4}
                  placeholder="Describe the technical issue — error messages, affected devices, steps to reproduce, etc."
                  value={techForm.description} onChange={handleTechChange}
                />
                <FieldError msg={errors.description} />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                  <select name="category" className="input" value={techForm.category} onChange={handleTechChange}>
                    {TECH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                  <select name="priority" className="input" value={techForm.priority} onChange={handleTechChange}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              {/* Image upload */}
              <ImageUpload images={images} previews={previews}
                onChange={handleImage} onRemove={removeImage} />

              {/* Priority guide */}
              <PriorityGuide isTech />
            </>
          )}

          {/* ── Submit buttons ── */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5
                         rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
            >
              {loading ? <Spinner /> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
            <button onClick={() => navigate('/tickets')} className="btn-secondary">
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────
function ImageUpload({ images, previews, onChange, onRemove }) {
  const canAdd = images.length < 3
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-semibold text-gray-700">
          Attach Images <span className="text-gray-400 font-normal">(optional, up to 3 · max 5MB each)</span>
        </label>
        <span className="text-xs text-gray-400">{images.length}/3</span>
      </div>

      {/* Thumbnails row */}
      {previews.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
              <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60
                           hover:bg-black/80 text-white flex items-center justify-center
                           transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button — hidden when at limit */}
      {canAdd && (
        <label className="flex flex-col items-center justify-center w-full h-24
                          border-2 border-dashed border-gray-200 rounded-xl cursor-pointer
                          hover:border-blue-300 hover:bg-blue-50/20 transition-colors">
          <input type="file" accept="image/*" multiple className="hidden" onChange={onChange} />
          <div className="text-center">
            <div className="w-9 h-9 rounded-xl mx-auto mb-1.5 flex items-center justify-center bg-gray-100">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-500">
              {images.length === 0 ? 'Click to add images' : `Add more (${3 - images.length} left)`}
            </p>
            <p className="text-xs text-gray-400">PNG, JPG up to 5MB each</p>
          </div>
        </label>
      )}
    </div>
  )
}

function PriorityGuide({ isTech }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-xs text-gray-500 space-y-2">
      <p className="font-semibold text-gray-700 mb-2 text-sm">Priority guide</p>
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT.HIGH}`} />
        <p>
          <strong className="text-gray-700">High</strong> —{' '}
          {isTech
            ? 'System down, data loss risk, or security breach'
            : 'Safety hazard or blocking operations (e.g. power outage, flood)'}
        </p>
      </div>
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT.MEDIUM}`} />
        <p>
          <strong className="text-gray-700">Medium</strong> —{' '}
          {isTech
            ? 'Affects work but has a workaround (e.g. slow network, software crash)'
            : 'Affects work but has a workaround (e.g. broken projector)'}
        </p>
      </div>
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT.LOW}`} />
        <p>
          <strong className="text-gray-700">Low</strong> —{' '}
          {isTech
            ? 'Minor inconvenience (e.g. printer out of paper, dim screen)'
            : 'Minor inconvenience (e.g. flickering light)'}
        </p>
      </div>
    </div>
  )
}
