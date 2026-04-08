import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { updateMe, uploadProfilePhoto } from '../../api/authApi'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()

  const [name, setName]             = useState(user?.name || '')
  const [email, setEmail]           = useState(user?.email || '')
  const [password, setPassword]     = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [photoPreview, setPhotoPreview] = useState(user?.picture || null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  const ROLE_BADGE = {
    ADMIN:      'bg-purple-100 text-purple-700',
    TECHNICIAN: 'bg-blue-100 text-blue-700',
    USER:       'bg-gray-100 text-gray-600',
  }

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
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result)
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) {
      toast.error('Please select a photo first.')
      return
    }

    try {
      setLoading(true)
      console.log('Uploading photo:', selectedPhoto.name, selectedPhoto.type)

      const response = await uploadProfilePhoto(selectedPhoto)
      console.log('Upload response:', response)

      await refreshUser()

      setSelectedPhoto(null)
      setPhotoPreview(null) // Reset preview to show actual from database
      toast.success('Photo uploaded successfully!')
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message)
      toast.error(err.response?.data?.error || 'Failed to upload photo.')
    } finally {
      setLoading(false)
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
    </div>
  )
}