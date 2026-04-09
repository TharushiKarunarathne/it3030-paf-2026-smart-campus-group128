import api from './axiosConfig'

export const googleLogin = (googleCredential) =>
  api.post('/auth/google', { credential: googleCredential })

export const loginWithPassword = (email, password) =>
  api.post('/auth/login', { email, password })

export const getMe = () =>
  api.get('/users/me')

export const updateMe = (data) =>
  api.put('/users/me', data)

export const uploadProfilePhoto = (file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return api.post('/users/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getAllUsers = (params) =>
  api.get('/users', { params })

export const createUser = (data) =>
  api.post('/users', data)

export const updateUser = (userId, data) =>
  api.put(`/users/${userId}`, data)

export const updateUserRole = (userId, role) =>
  api.put(`/users/${userId}/role`, { role })

export const deleteUser = (userId) =>
  api.delete(`/users/${userId}`)

export const updateNotificationPreferences = (prefs) =>
  api.put('/users/me/preferences', prefs).then(r => r.data)