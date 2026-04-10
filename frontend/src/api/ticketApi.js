import api from './axiosConfig'

// ── Fetch tickets ────────────────────────────────────────────
export const getTickets = (params) =>
  api.get('/tickets', { params })

export const getTicketById = (id) =>
  api.get(`/tickets/${id}`)

// ── Create ticket (JSON or multipart with images) ────────────
export const createTicket = (data) =>
  data instanceof FormData
    ? api.post('/tickets', data, { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.post('/tickets', data)

// ── Status and resolution ────────────────────────────────────
export const updateTicketStatus = (id, status) =>
  api.patch(`/tickets/${id}/status`, { status })

export const resolveTicket = (id, resolutionNote) =>
  api.patch(`/tickets/${id}/resolve`, { resolutionNote })

// ── Technician assignment ────────────────────────────────────
export const assignTechnician = (id, technicianId) =>
  api.put(`/tickets/${id}/assign`, { technicianId })

// ── Comments ─────────────────────────────────────────────────
export const addComment = (id, content) =>
  api.post(`/tickets/${id}/comments`, { content })

export const deleteComment = (ticketId, commentId) =>
  api.delete(`/tickets/${ticketId}/comments/${commentId}`)

// ── Attachments ──────────────────────────────────────────────
export const uploadAttachment = (id, formData) =>
  api.post(`/tickets/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ── Delete ticket ────────────────────────────────────────────
export const deleteTicket = (id) =>
  api.delete(`/tickets/${id}`)