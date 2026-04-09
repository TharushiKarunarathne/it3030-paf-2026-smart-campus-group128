import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { updateMe, uploadProfilePhoto, updateNotificationPreferences } from '../../api/authApi'
import toast from 'react-hot-toast'

const ROLE_BADGE = {
  ADMIN:      'bg-purple-100 text-purple-700 border-purple-200',
  TECHNICIAN: 'bg-blue-100  text-blue-700   border-blue-200',
  USER:       'bg-gray-100  text-gray-600   border-gray-200',
}

// ── Toggle ────────────────────────────────────────────────
function Toggle({ checked, onChange, label, description, category }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        {category && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
            {category}
          </p>
        )}
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    ${checked ? 'bg-blue-700' : 'bg-gray-300'}`}
        style={checked ? { background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' } : {}}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
                      transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

// ── Section card ──────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #1e3a5f, #2d5a8e)' }} />
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="w-4 h-4" style={{ animation: 'spin 0.8s linear infinite' }}
      fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const fileRef = useRef(null)

  const [name, setName]           = useState(user?.name || '')
  const [email, setEmail]         = useState(user?.email || '')
  const [password, setPassword]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [photoPreview, setPhotoPreview]   = useState(user?.picture || null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoLoading, setPhotoLoading]   = useState(false)

  const [bookingUpdates, setBookingUpdates] = useState(user?.notificationPreferences?.bookingUpdates ?? true)
  const [ticketUpdates,  setTicketUpdates]  = useState(user?.notificationPreferences?.ticketUpdates  ?? true)
  const [commentUpdates, setCommentUpdates] = useState(user?.notificationPreferences?.commentUpdates ?? true)
  const [prefsLoading, setPrefsLoading]     = useState(false)

  useEffect(() => {
    const prefs = user?.notificationPreferences
    if (!prefs) return
    setBookingUpdates(prefs.bookingUpdates ?? true)
    setTicketUpdates(prefs.ticketUpdates   ?? true)
    setCommentUpdates(prefs.commentUpdates ?? true)
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password && password !== confirmPw) { toast.error('Passwords do not match.'); return }
    if (password && password.length < 6)    { toast.error('Password must be at least 6 characters.'); return }
    try {
      setLoading(true)
      const body = { name, email }
      if (password) body.password = password
      await updateMe(body)
      await refreshUser()
      setPassword('')
      setConfirmPw('')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file.'); return }
    setSelectedPhoto(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result)
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) { toast.error('Please select a photo first.'); return }
    try {
      setPhotoLoading(true)
      await uploadProfilePhoto(selectedPhoto)
      await refreshUser()
      setSelectedPhoto(null)
      toast.success('Photo uploaded successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload photo.')
    } finally {
      setPhotoLoading(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setPrefsLoading(true)
      await updateNotificationPreferences({ bookingUpdates, ticketUpdates, commentUpdates })
      await refreshUser()
      toast.success('Notification preferences saved!')
    } catch {
      toast.error('Failed to save preferences.')
    } finally {
      setPrefsLoading(false)
    }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-4xl mx-auto page-fade-in">

      {/* ── Profile hero header ───────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 mb-6"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}
      >
        <div className="absolute top-0 right-0 w-52 h-52 rounded-full -translate-y-1/3 translate-x-1/4 opacity-10 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar with camera overlay */}
          <div
            className="relative group cursor-pointer flex-shrink-0"
            onClick={() => fileRef.current?.click()}
          >
            {photoPreview ? (
              <img src={photoPreview} alt={user?.name}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg" />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl ring-4 ring-white/30 flex items-center
                            justify-center shadow-lg text-white text-3xl font-extrabold"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100
                            transition-opacity flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold text-white">{user?.name}</h2>
            <p className="text-blue-200 text-sm">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className={`badge border text-xs ${ROLE_BADGE[user?.role] ?? ROLE_BADGE.USER}`}>
                {user?.role}
              </span>
              {memberSince && (
                <span className="text-blue-300 text-xs">Member since {memberSince}</span>
              )}
            </div>
          </div>

          {/* Upload button */}
          {selectedPhoto && (
            <button
              onClick={handlePhotoUpload}
              disabled={photoLoading}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm
                         font-semibold bg-white text-gray-900 hover:bg-gray-50 transition-colors shadow-md"
            >
              {photoLoading ? <Spinner /> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              )}
              {photoLoading ? 'Uploading...' : 'Upload photo'}
            </button>
          )}
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Edit profile */}
        <Section title="Edit Profile">
          {saveSuccess && (
            <div
              className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4"
              style={{ animation: 'fadeIn 0.2s ease-out' }}
            >
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-700 font-medium">Profile saved successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your full name" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Change password
                <span className="text-gray-400 font-normal ml-1">(leave blank to keep current)</span>
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-16"
                    value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium
                               text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input type={showPw ? 'text' : 'password'} className="input"
                  value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm new password" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                           text-white transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
              >
                {loading ? <Spinner /> : null}
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </Section>

        {/* Notification preferences */}
        <Section title="Notification Preferences">
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Choose which notifications you receive. Options are tailored to your role.
          </p>

          <div className="divide-y divide-gray-100">
            {user?.role === 'ADMIN' && (
              <Toggle
                checked={bookingUpdates} onChange={setBookingUpdates}
                label="New booking requests"
                description="When a user submits a booking that needs your review"
                category="Bookings"
              />
            )}
            {user?.role === 'USER' && (
              <Toggle
                checked={bookingUpdates} onChange={setBookingUpdates}
                label="Booking results"
                description="When your booking is approved, rejected, or cancelled"
                category="Bookings"
              />
            )}
            {user?.role === 'ADMIN' && (
              <Toggle
                checked={ticketUpdates} onChange={setTicketUpdates}
                label="New ticket reports"
                description="When a user submits a new maintenance ticket"
                category="Tickets"
              />
            )}
            {user?.role === 'TECHNICIAN' && (
              <Toggle
                checked={ticketUpdates} onChange={setTicketUpdates}
                label="Ticket assignments & updates"
                description="When a ticket is assigned to you or its status changes"
                category="Tickets"
              />
            )}
            {user?.role === 'USER' && (
              <Toggle
                checked={ticketUpdates} onChange={setTicketUpdates}
                label="Ticket status changes"
                description="When the status of a ticket you reported is updated"
                category="Tickets"
              />
            )}
            <Toggle
              checked={commentUpdates} onChange={setCommentUpdates}
              label="New comments"
              description={
                user?.role === 'TECHNICIAN'
                  ? 'When someone comments on a ticket assigned to you'
                  : 'When someone adds a comment to your ticket'
              }
              category="Comments"
            />
          </div>

          <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={prefsLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                         text-white transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
            >
              {prefsLoading ? <Spinner /> : null}
              {prefsLoading ? 'Saving...' : 'Save preferences'}
            </button>
          </div>
        </Section>
      </div>
    </div>
  )
}
