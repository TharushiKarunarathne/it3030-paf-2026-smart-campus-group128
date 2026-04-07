import api from './axiosConfig'

export const getResources = (params) =>
  api.get('/resources', { params })

export const getResourceById = (id) =>
  api.get(`/resources/${id}`)

export const createResource = (data) =>
  api.post('/resources', data)

export const updateResource = (id, data) =>
  api.put(`/resources/${id}`, data)

export const updateResourceStatus = (id, status) =>
  api.patch(`/resources/${id}/status`, { status })

export const deleteResource = (id) =>
  api.delete(`/resources/${id}`)

