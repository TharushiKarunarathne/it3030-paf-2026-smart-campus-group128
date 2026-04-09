import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import NotificationBell from '../notifications/NotificationBell'

const ROLE_BADGE = {
  ADMIN:      'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-blue-100  text-blue-700',
  USER:       'bg-gray-100  text-gray-600',
}

const ROLE_DOT = {
  ADMIN:      'bg-purple-500',
  TECHNICIAN: 'bg-blue-500',
  USER:       'bg-gray-400',
}

const NAV_LINKS = [
  { to: '/dashboard',   label: 'Dashboard', roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
  { to: '/resources',   label: 'Resources', roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
  { to: '/bookings',    label: 'Bookings',  roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
  { to: '/tickets',     label: 'Tickets',   roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
  { to: '/admin/users', label: 'Users',     roles: ['ADMIN'] },
]

function UserAvatar({ user, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt={user.name}
        className={`${dim} rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    )
  }
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center
                  ring-2 ring-white shadow-sm`}
      style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
    >
      <span className="text-white font-semibold text-xs">
        {user?.name?.[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  )
}

export default function Navbar() {
  const { user, logout }    = useAuth()
  const navigate            = useNavigate()
  const location            = useLocation()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  const isActive = (path) => location.pathname.startsWith(path)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleLinks = NAV_LINKS.filter((l) => l.roles.includes(user?.role))

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
            >
              <span className="text-white text-sm font-bold">SC</span>
            </div>
            <span className="font-bold text-gray-900 hidden sm:block tracking-tight">
              Smart Campus
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {visibleLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive(link.to)
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                style={isActive(link.to)
                  ? { background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }
                  : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <NotificationBell />

            {/* Avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 p-1 rounded-full
                           hover:bg-gray-100 transition-colors focus:outline-none"
                aria-label="User menu"
              >
                <UserAvatar user={user} size="sm" />
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 hidden sm:block transition-transform duration-200
                              ${menuOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl
                              border border-gray-100 z-50 overflow-hidden"
                  style={{ animation: 'slideDown 0.15s ease-out' }}
                >
                  {/* User info header */}
                  <div className="px-4 py-3.5 border-b border-gray-100"
                       style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)' }}>
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-blue-200 truncate">{user?.email}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[user?.role] ?? ROLE_DOT.USER}`} />
                          <span className={`badge text-[10px] ${ROLE_BADGE[user?.role] ?? ROLE_BADGE.USER}`}>
                            {user?.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                                 hover:bg-gray-50 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
                        P
                      </span>
                      My Profile
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                                 hover:bg-gray-50 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">
                        N
                      </span>
                      Notifications
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600
                                 hover:bg-red-50 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center text-xs text-red-400 font-bold">
                        ↩
                      </span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1"
          style={{ animation: 'slideDown 0.18s ease-out' }}
        >
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive(link.to)
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                }`}
              style={isActive(link.to)
                ? { background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }
                : {}}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
