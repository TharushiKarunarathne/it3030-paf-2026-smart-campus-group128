import api from './axiosConfig'

export const getTickets = (params) =>
  api.get('/tickets', { params })

export const getTicketById = (id) =>
  api.get(`/tickets/${id}`)

export const createTicket = (data) =>
  data instanceof FormData
    ? api.post('/tickets', data, { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.post('/tickets', data)

export const updateTicketStatus = (id, status) =>
  api.patch(`/tickets/${id}/status`, { status })

export const assignTechnician = (id, technicianId) =>
  api.put(`/tickets/${id}/assign`, { technicianId })

export const addComment = (id, content) =>
  api.post(`/tickets/${id}/comments`, { content })

export const deleteComment = (ticketId, commentId) =>
  api.delete(`/tickets/${ticketId}/comments/${commentId}`)

export const uploadAttachment = (id, formData) =>
  api.post(`/tickets/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  export const resolveTicket = (id, resolutionNote) =>
  api.patch(`/tickets/${id}/resolve`, { resolutionNote })

  export const deleteTicket = (id) =>
  api.delete(`/tickets/${id}`)