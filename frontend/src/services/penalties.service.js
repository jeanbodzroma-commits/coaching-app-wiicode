import api from './api'

export const penaltiesService = {
  getStrikes: () => api.get('/penalties').then(r => r.data),
  unblock: (userId) => api.post(`/penalties/${userId}/unblock`).then(r => r.data),
  addStrike: (userId, reason) => api.post(`/penalties/${userId}/strike`, { reason }).then(r => r.data),
}
