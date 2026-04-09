import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { updateMe, uploadProfilePhoto, updateNotificationPreferences } from '../../api/authApi'
import toast from 'react-hot-toast'

const ROLE_BADGE = {
  ADMIN:      'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-blue-100 text-blue-700',
  USER:       'bg-gray-100 text-gray-600',
}

function Toggle({ checked, onChange, label, description, category }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        {category && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5 block">
            {category}
          </span>
        )}
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                    ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow
                      transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()

  const [name, setName]           = useState(user?.name || '')
  const [email, setEmail]         = useState(user?.email || '')
  const [password, setPassword]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading]     = useState(false)
  const [, setPhotoPreview]   = useState(user?.picture || null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  // Notification preferences — synced from user object whenever it changes
  const [bookingUpdates, setBookingUpdates] = useState(user?.notificationPreferences?.bookingUpdates ?? true)
  const [ticketUpdates,  setTicketUpdates]  = useState(user?.notificationPreferences?.ticketUpdates  ?? true)
  const [commentUpdates, setCommentUpdates] = useState(user?.notificationPreferences?.commentUpdates ?? true)
  const [prefsLoading, setPrefsLoading]     = useState(false)

  // Re-sync toggles when user object is refreshed (e.g. after login or refreshUser())
  useEffect(() => {
    const prefs = user?.notificationPreferences
    if (!prefs) return
    setBookingUpdates(prefs.bookingUpdates ?? true)
    setTicketUpdates(prefs.ticketUpdates   ?? true)
    setCommentUpdates(prefs.commentUpdates ?? true)
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password && password !== confirmPw) {
      toast.error('Passwords do not match.')
      return
    }
    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }

    try {
      setLoading(true)
      const body = { name, email }
      if (password) body.password = password

      await updateMe(body)
      await refreshUser()
      setPassword('')
      setConfirmPw('')
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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.')
      return
    }

    setSelectedPhoto(file)
    const reader = new FileReader()
    reader.onload = (event) => setPhotoPreview(event.target?.result)
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) {
      toast.error('Please select a photo first.')
      return
    }

    try {
      setLoading(true)
      await uploadProfilePhoto(selectedPhoto)
      await refreshUser()
      setSelectedPhoto(null)
      setPhotoPreview(null)
      toast.success('Photo uploaded successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload photo.')
    } finally {
      setLoading(false)
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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="card mb-6">
        {/* Avatar + role */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          {user?.picture ? (
            <img src={user.picture} alt={user?.name}
              className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100
                            flex items-center justify-center">
              <span className="text-primary-700 text-2xl font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`mt-1 badge ${ROLE_BADGE[user?.role] ?? ROLE_BADGE.USER}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Photo upload section */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Update profile photo
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="flex-1 text-sm text-gray-600"
            />
            <button
              type="button"
              onClick={handlePhotoUpload}
              disabled={!selectedPhoto || loading}
              className="btn-primary text-sm"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Change password
              <span className="text-gray-400 font-normal ml-1">
                (leave blank to keep current)
              </span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  className="input"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Notification Preferences — role-aware */}
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🔔</span>
          <h2 className="text-base font-semibold text-gray-900">
            Notification Preferences
          </h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[user?.role] ?? ROLE_BADGE.USER}`}>
            {user?.role}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Choose which notifications you want to receive. Options shown are relevant to your role.
        </p>

        <div className="divide-y divide-gray-100">
          {/* ── BOOKING category — ADMIN sees "New requests", USER sees "Booking results" ── */}
          {user?.role === 'ADMIN' && (
            <Toggle
              checked={bookingUpdates}
              onChange={setBookingUpdates}
              label="New booking requests"
              description="When a user submits a new booking that needs your review"
              category="Bookings"
            />
          )}
          {user?.role === 'USER' && (
            <Toggle
              checked={bookingUpdates}
              onChange={setBookingUpdates}
              label="Booking results"
              description="When your booking is approved, rejected, or cancelled by an admin"
              category="Bookings"
            />
          )}
          {/* TECHNICIAN doesn't receive booking notifications — toggle hidden */}

          {/* ── TICKET category — all roles but different labels ── */}
          {user?.role === 'ADMIN' && (
            <Toggle
              checked={ticketUpdates}
              onChange={setTicketUpdates}
              label="New ticket reports"
              description="When a user submits a new maintenance or issue ticket"
              category="Tickets"
            />
          )}
          {user?.role === 'TECHNICIAN' && (
            <Toggle
              checked={ticketUpdates}
              onChange={setTicketUpdates}
              label="Ticket assignments & updates"
              description="When a ticket is assigned to you or its status changes"
              category="Tickets"
            />
          )}
          {user?.role === 'USER' && (
            <Toggle
              checked={ticketUpdates}
              onChange={setTicketUpdates}
              label="Ticket status changes"
              description="When the status of a ticket you reported is updated or resolved"
              category="Tickets"
            />
          )}

          {/* ── COMMENT category — all roles ── */}
          <Toggle
            checked={commentUpdates}
            onChange={setCommentUpdates}
            label="New comments"
            description={
              user?.role === 'TECHNICIAN'
                ? 'When someone comments on a ticket assigned to you'
                : 'When someone adds a comment to a ticket you reported'
            }
            category="Comments"
          />
        </div>

        <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={prefsLoading}
            className="btn-primary"
          >
            {prefsLoading ? 'Saving...' : 'Save preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}
