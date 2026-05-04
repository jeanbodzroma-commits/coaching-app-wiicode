import api from './api'

export const sessionsService = {
  getAll: () => api.get('/sessions').then(r => r.data),
  getOne: (id) => api.get(`/sessions/${id}`).then(r => r.data),
  create: (data) => api.post('/sessions', data).then(r => r.data),
  update: (id, data) => api.put(`/sessions/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/sessions/${id}`),
}
