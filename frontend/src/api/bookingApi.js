import api from './axiosConfig'

export const getMyBookings = (params) =>
  api.get('/bookings', { params })

export const getAllBookings = (params) =>
  api.get('/bookings/all', { params })

export const getBookingById = (id) =>
  api.get(`/bookings/${id}`)

export const getBookingsByResource = (resourceId) =>
  api.get(`/bookings/resource/${resourceId}`)

export const createBooking = (data) =>
  api.post('/bookings', data)

export const updateBookingStatus = (id, status, adminNote) =>
  api.patch(`/bookings/${id}/status`, { status, adminNote })

export const deleteBooking = (id) =>
  api.delete(`/bookings/${id}`)