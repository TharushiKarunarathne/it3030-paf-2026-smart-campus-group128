import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const { user, loginWithGoogle, loginWithPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from     = location.state?.from?.pathname ?? '/dashboard'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Already logged in — redirect
  if (user) {
    navigate(from, { replace: true })
    return null
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const loggedInUser = await loginWithGoogle(credentialResponse.credential)
      navigate(loggedInUser.role === 'ADMIN' ? '/admin/users' : from, { replace: true })
    } catch {
      // error toast handled in AuthContext
    }
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    try {
      setLoading(true)
      const loggedInUser = await loginWithPassword(email, password)
      navigate(loggedInUser.role === 'ADMIN' ? '/admin/users' : from, { replace: true })
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center
                          justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">SC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Campus</h1>
          <p className="text-gray-500 mt-1">Operations Hub</p>
        </div>

        {/* Google login */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {}}
            shape="rectangular"
            size="large"
            theme="outline"
            text="signin_with"
            width="320"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email & Password form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="you@university.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer note */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Access is restricted to authorised university personnel only.
        </p>

      </div>
    </div>
  )
}