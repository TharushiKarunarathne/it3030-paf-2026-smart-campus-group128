import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../hooks/useAuth'

const FEATURES = [
  'Book campus facilities instantly',
  'Report and track maintenance issues',
  'Manage reservations in real-time',
  'Get notified on every update',
]

export default function LoginPage() {
  const { user, loginWithGoogle, loginWithPassword } = useAuth()
  console.log('loginWithPassword:', loginWithPassword)
  const navigate = useNavigate()
  const location = useLocation()
  const from     = location.state?.from?.pathname ?? '/dashboard'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

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
    console.log('Login submitted', email, password)
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
    <div className="min-h-screen flex">

      {/* ── Left branding panel (lg+) ─────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1f35 0%, #1e3a5f 40%, #2d5a8e 100%)' }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Glow blob */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)', animation: 'floatSlow 14s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #93c5fd, transparent 70%)', animation: 'float 18s ease-in-out infinite' }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <span className="text-white font-bold">SC</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Smart Campus</span>
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            One platform for
            <br />
            <span className="text-blue-300">smarter campus ops</span>
          </h2>
          <p className="text-blue-200 text-base mb-8 leading-relaxed">
            Facilities, bookings, and maintenance — unified for SLIIT.
          </p>

          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-white/15 border border-white/20 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-blue-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-400 text-xs">
          Smart Campus © 2026 · SLIIT Faculty of Computing
        </p>
      </div>

      {/* ── Right login panel ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div
          className="w-full max-w-md"
          style={{ animation: 'fadeIn 0.4s ease-out' }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

            {/* Logo (shown on mobile) */}
            <div className="text-center mb-8">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
              >
                <span className="text-white text-xl font-extrabold">SC</span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">Welcome back</h1>
              <p className="text-gray-400 mt-1 text-sm">Sign in to Smart Campus</p>
            </div>

            {/* Google */}
            <div className="flex justify-center mb-5">
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
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                     style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input pr-16"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium
                               text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                           font-semibold text-sm text-white transition-all duration-200
                           hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 text-white"
                      style={{ animation: 'spin 0.8s linear infinite' }}
                      fill="none" viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-6">
              Access is restricted to authorised university personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
