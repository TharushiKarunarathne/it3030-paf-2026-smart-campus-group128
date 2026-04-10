import api from './axiosConfig'

// ── Fetch resources ──────────────────────────────────────────
export const getResources = (params) =>
  api.get('/resources', { params })

export const getResourceById = (id) =>
  api.get(`/resources/${id}`)

// ── Create and update ────────────────────────────────────────
export const createResource = (data) =>
  api.post('/resources', data)

export const updateResource = (id, data) =>
  api.put(`/resources/${id}`, data)

// ── Status change ────────────────────────────────────────────
export const updateResourceStatus = (id, status) =>
  api.patch(`/resources/${id}/status`, { status })

// ── Delete resource ──────────────────────────────────────────
export const deleteResource = (id) =>
  api.delete(`/resources/${id}`)

