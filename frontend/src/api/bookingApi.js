import api from './axiosConfig'

export const getMyBookings = () =>
  api.get('/bookings')

export const getAllBookings = () =>
  api.get('/bookings/all')

export const getBookingById = (id) =>
  api.get(`/bookings/${id}`)

export const getBookingsByResource = (resourceId) =>
  api.get(`/bookings/resource/${resourceId}`)

export const verifyBooking = (id) =>
  api.get(`/bookings/verify/${id}`)

export const checkInBooking = (id) =>
  api.patch(`/bookings/${id}/checkin`)

export const createBooking = (data) =>
  api.post('/bookings', data)

export const updateBookingStatus = (id, status, adminNote) =>
  api.patch(`/bookings/${id}/status`, { status, adminNote })

export const deleteBooking = (id) =>
  api.delete(`/bookings/${id}`)