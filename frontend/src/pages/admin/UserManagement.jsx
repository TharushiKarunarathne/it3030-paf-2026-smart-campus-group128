
import { useState, useEffect } from 'react'
import { getAllUsers, updateUserRole, updateUser, deleteUser, createUser } from '../../api/authApi'
import toast from 'react-hot-toast'

const ROLES = ['USER', 'TECHNICIAN', 'ADMIN']

const ROLE_BADGE = {
  ADMIN:      'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-blue-100 text-blue-700',
  USER:       'bg-gray-100 text-gray-600',
}

// Add User Modal
function AddUserModal({ onClose, onAdded }) {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState('USER')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error('All fields are required.')
      return
    }
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Add new user</h2>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input className="input" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input type="email" className="input" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@university.lk" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input type="password" className="input" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select className="input" value={role}
              onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit User Modal
function EditUserModal({ user, onClose, onUpdated }) {
  const [name, setName]         = useState(user.name || '')
  const [email, setEmail]       = useState(user.email || '')
  const [role, setRole]         = useState(user.role || 'USER')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading]   = useState(false)

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

      // Build update body
      const body = { name, email }
      if (password) body.password = password

      // Update profile details
      await updateUser(user.id, body)

      // Update role if changed
      if (role !== user.role) {
        await updateUserRole(user.id, role)
      }

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit user</h2>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input className="input" value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input type="email" className="input" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select className="input" value={role}
              onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Password section */}
          <div className="pt-3 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Reset password
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
                  Confirm password
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

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
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

  const handleAdded = (newUser) => {
    setUsers((prev) => [...prev, newUser])
  }

  const handleUpdated = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    )
  }

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Modals */}
      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} registered users
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          + Add user
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8
                            border-b-2 border-primary-600" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  User
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Role
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.picture ? (
                          <img src={u.picture} alt={u.name}
                            className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-100
                                          flex items-center justify-center">
                            <span className="text-primary-700 text-xs font-medium">
                              {u.name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-gray-900">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ROLE_BADGE[u.role] ?? ROLE_BADGE.USER}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditUser(u)}
                          className="text-xs px-3 py-1.5 rounded-lg border
                                     border-gray-300 hover:bg-gray-50 transition-colors
                                     font-medium text-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          disabled={deletingId === u.id}
                          className="text-xs px-3 py-1.5 rounded-lg border
                                     border-red-200 hover:bg-red-50 transition-colors
                                     font-medium text-red-600 disabled:opacity-50"
                        >
                          {deletingId === u.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}