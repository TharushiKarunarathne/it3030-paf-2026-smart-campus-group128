import api from './axiosConfig'

export const getDashboardAnalytics = () =>
  api.get('/analytics/dashboard').then(r => r.data)
