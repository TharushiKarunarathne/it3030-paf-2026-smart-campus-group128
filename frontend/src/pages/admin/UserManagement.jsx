import { useState, useEffect, useMemo } from 'react'
import { getAllUsers, updateUserRole, updateUser, deleteUser, createUser } from '../../api/authApi'
import toast from 'react-hot-toast'

const ROLES = ['USER', 'TECHNICIAN', 'ADMIN']

const ROLE_BADGE = {
  ADMIN:      'bg-purple-100 text-purple-700 border-purple-200',
  TECHNICIAN: 'bg-blue-100  text-blue-700   border-blue-200',
  USER:       'bg-gray-100  text-gray-600   border-gray-200',
}

const ROLE_DOT = {
  ADMIN:      'bg-purple-500',
  TECHNICIAN: 'bg-blue-500',
  USER:       'bg-gray-400',
}

// ── Avatar ────────────────────────────────────────────────
function UserAvatar({ user, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11'
  if (user?.picture) {
    return (
      <img src={user.picture} alt={user.name}
        className={`${dim} rounded-full object-cover ring-2 ring-white shadow-sm`} />
    )
  }
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center
                  ring-2 ring-white shadow-sm text-white font-semibold text-sm`}
      style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
    >
      {user?.name?.[0]?.toUpperCase()}
    </div>
  )
}

// ── Modal wrapper ─────────────────────────────────────────
function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors
                       flex items-center justify-center text-gray-500 text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Add User Modal ────────────────────────────────────────
function AddUserModal({ onClose, onAdded }) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState('USER')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})

  const validate = () => {
    const e = {}
    if (!name.trim())              e.name     = 'Name is required'
    if (!email.trim())             e.email    = 'Email is required'
    if (!password)                 e.password = 'Password is required'
    else if (password.length < 6)  e.password = 'Minimum 6 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      setLoading(true)
      const { data } = await createUser({ name, email, password, role })
      toast.success('User created successfully.')
      onAdded(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell title="Add new user" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
          <input
            className={`input ${errors.name ? 'border-red-300' : ''}`}
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })) }}
            placeholder="John Doe"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
          <input
            type="email"
            className={`input ${errors.email ? 'border-red-300' : ''}`}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })) }}
            placeholder="john@university.lk"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              className={`input pr-16 ${errors.password ? 'border-red-300' : ''}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })) }}
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400
                         hover:text-gray-600 font-medium">
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white
                       transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
          >
            {loading ? 'Creating...' : 'Create user'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Edit User Modal ───────────────────────────────────────
function EditUserModal({ user, onClose, onUpdated }) {
  const [name, setName]           = useState(user.name || '')
  const [email, setEmail]         = useState(user.email || '')
  const [role, setRole]           = useState(user.role || 'USER')
  const [password, setPassword]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password && password !== confirmPw) { toast.error('Passwords do not match.'); return }
    if (password && password.length < 6)    { toast.error('Minimum 6 characters.'); return }
    try {
      setLoading(true)
      const body = { name, email }
      if (password) body.password = password
      await updateUser(user.id, body)
      if (role !== user.role) await updateUserRole(user.id, role)
      toast.success('User updated successfully.')
      onUpdated({ ...user, name, email, role })
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell title="Edit user" subtitle={user.email} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Reset password
            <span className="text-gray-400 font-normal ml-1">(leave blank to keep current)</span>
          </h3>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} className="input pr-16"
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium">
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPw ? 'text' : 'password'} className="input"
              value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm password"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white
                       transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function UserManagement() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [showAdd, setShowAdd]       = useState(false)
  const [editUser, setEditUser]     = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data } = await getAllUsers()
      setUsers(data)
    } catch {
      toast.error('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return
    setDeletingId(userId)
    try {
      await deleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      toast.success('User deleted.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAdded   = (u)   => setUsers((prev) => [...prev, u])
  const handleUpdated = (upd) => setUsers((prev) => prev.map((u) => u.id === upd.id ? upd : u))

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase()
    return (
      (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) &&
      (roleFilter === 'ALL' || u.role === roleFilter)
    )
  }), [users, search, roleFilter])

  const stats = useMemo(() => ({
    total:       users.length,
    admins:      users.filter((u) => u.role === 'ADMIN').length,
    technicians: users.filter((u) => u.role === 'TECHNICIAN').length,
    regular:     users.filter((u) => u.role === 'USER').length,
  }), [users])

  return (
    <div className="page-fade-in">
      {showAdd  && <AddUserModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onUpdated={handleUpdated} />}

      {/* ── Hero ─────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden mb-6 px-8 py-7"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 60%, #1a4a7a 100%)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
            <p className="text-blue-200 text-sm">
              Manage accounts, roles, and access for all campus users
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25
                       border border-white/30 text-white text-sm font-medium
                       px-4 py-2.5 rounded-xl transition-colors"
          >
            + Add user
          </button>
        </div>

        {/* Stats in hero */}
        <div className="flex gap-8 flex-wrap">
          {[
            { label: 'Total',        count: stats.total,       color: 'text-white' },
            { label: 'Admins',       count: stats.admins,      color: 'text-purple-300' },
            { label: 'Technicians',  count: stats.technicians, color: 'text-blue-300' },
            { label: 'Regular users',count: stats.regular,     color: 'text-green-300' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-blue-300 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search + filter ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-40"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* ── Table ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
            <p className="text-sm text-gray-400">Loading users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-700 font-semibold">No users found</p>
              <p className="text-gray-400 text-sm mt-1">
                {search || roleFilter !== 'ALL' ? 'Try adjusting your search or filter.' : 'Add the first user to get started.'}
              </p>
            </div>
            {(search || roleFilter !== 'ALL') && (
              <button onClick={() => { setSearch(''); setRoleFilter('ALL') }} className="btn-secondary text-sm">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)' }}>
                {['User', 'Email', 'Role', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-blue-200 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} size="sm" />
                      <div>
                        <p className="font-semibold text-gray-900 leading-tight">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.id?.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-sm">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                      text-xs font-semibold border ${ROLE_BADGE[u.role] ?? ROLE_BADGE.USER}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[u.role] ?? ROLE_DOT.USER}`} />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditUser(u)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700
                                   border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={deletingId === u.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600
                                   border border-red-100 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        {deletingId === u.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          Showing {filtered.length} of {users.length} users
        </p>
      )}
    </div>
  )
}
