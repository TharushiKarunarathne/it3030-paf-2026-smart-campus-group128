import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { getDashboardAnalytics } from '../../api/analyticsApi'

const ROLE_BADGE = {
  ADMIN:      'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-blue-100  text-blue-700',
  USER:       'bg-gray-100  text-gray-600',
}

const TYPE_STYLES = {
  BOOKING_PENDING:   { dot: 'bg-amber-400',  label: 'bg-amber-50 text-amber-700',   icon: '·' },
  BOOKING_APPROVED:  { dot: 'bg-green-500',  label: 'bg-green-50 text-green-700',   icon: '·' },
  BOOKING_REJECTED:  { dot: 'bg-red-500',    label: 'bg-red-50 text-red-700',       icon: '·' },
  BOOKING_CANCELLED: { dot: 'bg-gray-400',   label: 'bg-gray-50 text-gray-600',     icon: '·' },
  TICKET_UPDATED:    { dot: 'bg-blue-500',   label: 'bg-blue-50 text-blue-700',     icon: '·' },
  NEW_COMMENT:       { dot: 'bg-yellow-500', label: 'bg-yellow-50 text-yellow-700', icon: '·' },
}

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Skeleton ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-8 w-12 rounded" />
          <div className="skeleton h-2.5 w-16 rounded" />
        </div>
        <div className="skeleton w-12 h-12 rounded-xl" />
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────
const STAT_ACCENT = {
  blue:   { bar: 'bg-blue-500',   icon: 'bg-blue-50 text-blue-600',   text: 'text-blue-600' },
  green:  { bar: 'bg-green-500',  icon: 'bg-green-50 text-green-600', text: 'text-green-600' },
  amber:  { bar: 'bg-amber-500',  icon: 'bg-amber-50 text-amber-600', text: 'text-amber-600' },
  indigo: { bar: 'bg-indigo-500', icon: 'bg-indigo-50 text-indigo-600', text: 'text-indigo-600' },
}

function StatCard({ label, value, to, color = 'blue', loading, svgPath }) {
  if (loading) return <SkeletonCard />
  const ac = STAT_ACCENT[color]
  return (
    <Link
      to={to}
      className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100
                 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${ac.bar}`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900">{value ?? '—'}</p>
          <p className={`text-xs mt-1 font-medium ${ac.text} group-hover:underline`}>View all →</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ac.icon}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={svgPath} />
          </svg>
        </div>
      </div>
    </Link>
  )
}

// ── Quick link ────────────────────────────────────────────
function QuickLink({ to, label, desc }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100
                 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-150 group"
    >
      <div>
        <p className="text-sm font-medium text-gray-800 group-hover:text-blue-900">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0"
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

// ── Analytics ─────────────────────────────────────────────

function AnalyticsStatBox({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className={`text-xs font-semibold uppercase tracking-wider ${color} mb-1`}>{label}</p>
      <p className="text-2xl font-extrabold text-gray-900">{value ?? '—'}</p>
    </div>
  )
}

function PeakHoursChart({ peakHours }) {
  if (!peakHours?.length) {
    return <p className="text-sm text-gray-400 text-center py-4">No booking data yet</p>
  }
  const maxCount = Math.max(...peakHours.map(h => h.count), 1)
  return (
    <div className="flex items-end gap-1 h-20 w-full overflow-x-auto pb-1">
      {peakHours.map(({ hour, count }) => (
        <div key={hour} className="flex flex-col items-center gap-0.5 flex-1 min-w-[28px]">
          <span className="text-[10px] text-gray-400 leading-none">{count}</span>
          <div
            className="w-full rounded-t transition-colors hover:opacity-80 cursor-default"
            style={{
              height: `${Math.max((count / maxCount) * 52, 4)}px`,
              background: 'linear-gradient(to top, #1e3a5f, #2d5a8e)',
            }}
            title={`${hour}:00 — ${count} booking${count !== 1 ? 's' : ''}`}
          />
          <span className="text-[10px] text-gray-400 leading-none">{hour}</span>
        </div>
      ))}
    </div>
  )
}

function AdminAnalytics({ analytics, loading }) {
  if (loading) {
    return (
      <div className="card border-gray-100 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }
  if (!analytics) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #1e3a5f, #2d5a8e)' }} />
        <h2 className="text-base font-bold text-gray-900">Analytics</h2>
        <span className="text-xs text-gray-400">— last 7 days</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <AnalyticsStatBox label="Total Users"      value={analytics.totalUsers}       color="text-purple-600" />
        <AnalyticsStatBox label="New Bookings"     value={analytics.totalBookings}    color="text-blue-600" />
        <AnalyticsStatBox label="Approved"         value={analytics.approvedBookings} color="text-green-600" />
        <AnalyticsStatBox label="Open Tickets"     value={analytics.openTickets}      color="text-amber-600" />
        <AnalyticsStatBox label="Resolved"         value={analytics.resolvedTickets}  color="text-teal-600" />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top booked resources</h3>
          {!analytics.topResources?.length ? (
            <p className="text-sm text-gray-400">No bookings in the last 7 days</p>
          ) : (
            <div className="space-y-2">
              {analytics.topResources.map((r, i) => (
                <div key={r.resourceId}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                                     bg-gray-200 text-gray-600">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-800 font-medium">{r.resourceName}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">{r.count} bookings</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Peak booking hours</h3>
          <PeakHoursChart peakHours={analytics.peakHours} />
          <p className="text-[10px] text-gray-400 mt-1 text-center">hour of day (24h)</p>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isAdmin, isTechnician } = useAuth()
  const { notifications, unreadCount }  = useNotifications()

  const [stats, setStats]           = useState({ bookings: null, tickets: null, resources: null })
  const [statsLoading, setStatsLoading] = useState(true)
  const [analytics, setAnalytics]       = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(isAdmin)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    Promise.allSettled([
      axios.get('http://localhost:8080/api/bookings',  { headers }),
      axios.get('http://localhost:8080/api/tickets',   { headers }),
      axios.get('http://localhost:8080/api/resources', { headers }),
    ]).then(([br, tr, rr]) => {
      const count = (res) => {
        if (res.status !== 'fulfilled') return '—'
        const d = res.value.data
        return Array.isArray(d) ? d.length : d?.content?.length ?? '—'
      }
      setStats({ bookings: count(br), tickets: count(tr), resources: count(rr) })
      setStatsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    getDashboardAnalytics()
      .then((data) => { setAnalytics(data); setAnalyticsLoading(false) })
      .catch(() => setAnalyticsLoading(false))
  }, [isAdmin])

  return (
    <div className="page-fade-in">

      {/* ── Hero banner ───────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl mb-6 px-6 py-7"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}
      >
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full -translate-y-1/2 translate-x-1/3 opacity-10"
             style={{ background: 'radial-gradient(circle, #60a5fa, transparent 70%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{getGreeting()}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-blue-300 text-sm mt-1">
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <span className={`self-start sm:self-auto badge text-sm px-3 py-1 ${ROLE_BADGE[user?.role] ?? ROLE_BADGE.USER}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* ── Admin panel ───────────────────────────────── */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #1e3a5f, #2d5a8e)' }} />
            <h2 className="text-sm font-bold text-gray-900">Admin Control Panel</h2>
            <span className="text-xs text-gray-400">· Full platform access</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: '/admin/users', label: 'Manage users',  sub: 'Roles & accounts' },
              { to: '/bookings',    label: 'All bookings',  sub: 'Review requests'  },
              { to: '/tickets',     label: 'All tickets',   sub: 'Manage issues'    },
            ].map((item) => (
              <Link key={item.to} to={item.to}
                className="group text-center p-3 rounded-xl border border-gray-100
                           hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-150">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-900">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Admin analytics */}
      {isAdmin && <AdminAnalytics analytics={analytics} loading={analyticsLoading} />}

      {/* ── Technician panel ──────────────────────────── */}
      {isTechnician && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-blue-500" />
            <h2 className="text-sm font-bold text-gray-900">Technician Dashboard</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/tickets?status=OPEN',        label: 'Open tickets',  sub: 'Needs attention' },
              { to: '/tickets?status=IN_PROGRESS', label: 'In progress',   sub: 'Currently active' },
            ].map((item) => (
              <Link key={item.to} to={item.to}
                className="group text-center p-3 rounded-xl border border-gray-100
                           hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-150">
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-900">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Notifications"
          value={unreadCount || 0}
          to="/notifications"
          color="blue"
          loading={false}
          svgPath="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
        <StatCard
          label={isAdmin ? 'All Bookings' : 'My Bookings'}
          value={stats.bookings}
          to="/bookings"
          color="green"
          loading={statsLoading}
          svgPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
        <StatCard
          label={isAdmin ? 'All Tickets' : 'My Tickets'}
          value={stats.tickets}
          to="/tickets"
          color="amber"
          loading={statsLoading}
          svgPath="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
        <StatCard
          label="Resources"
          value={stats.resources}
          to="/resources"
          color="indigo"
          loading={statsLoading}
          svgPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </div>

      {/* ── Quick actions + activity ───────────────────── */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #1e3a5f, #2d5a8e)' }} />
            <h2 className="text-sm font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-1.5">
            {!isAdmin && (
              <>
                <QuickLink to="/bookings/new" label="New booking"      desc="Reserve a room or equipment" />
                <QuickLink to="/tickets/new"  label="Report issue"     desc="Submit a maintenance ticket" />
              </>
            )}
            <QuickLink to="/resources"     label="Browse resources" desc="View all campus facilities" />
            <QuickLink to="/notifications" label="Notifications"    desc="Check your updates" />
            {(isAdmin || isTechnician) && (
              <QuickLink to="/tickets?status=OPEN" label="Open tickets" desc="View tickets needing attention" />
            )}
            {isAdmin && (
              <>
                <QuickLink to="/admin/users" label="Manage users"    desc="Edit roles and accounts" />
                <QuickLink to="/bookings"    label="Review bookings" desc="Approve or reject requests" />
              </>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #1e3a5f, #2d5a8e)' }} />
              <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
            </div>
            <Link to="/notifications" className="text-xs text-blue-600 hover:underline font-medium">
              View all →
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {notifications.slice(0, 5).map((n) => {
                const styles = TYPE_STYLES[n.type] ?? TYPE_STYLES.TICKET_UPDATED
                const href   = n.type?.startsWith('BOOKING')
                  ? `/bookings/${n.entityId}`
                  : `/tickets/${n.entityId}`
                return (
                  <Link
                    key={n.id}
                    to={href}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors
                               ${!n.read ? 'bg-blue-50/40 border border-blue-100' : 'border border-transparent hover:bg-gray-50'}`}
                  >
                    <span className={`flex-shrink-0 mt-1 w-2 h-2 rounded-full ${styles.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
