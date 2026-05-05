import api from './api'

export const historyService = {
  get: (params = {}) => api.get('/history', { params }).then(r => r.data),
}
