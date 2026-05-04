import api from './api'

export const reservationsService = {
  getMine: () => api.get('/reservations/me').then(r => r.data),
  create: (sessionId) => api.post('/reservations', { sessionId }).then(r => r.data),
  cancel: (id) => api.delete(`/reservations/${id}`),
  updateAttendance: (id, attendance) => api.patch(`/reservations/${id}/attendance`, { attendance }).then(r => r.data),
}
