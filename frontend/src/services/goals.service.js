import api from './api'

export const goalsService = {
  getAll: () => api.get('/goals').then(r => r.data),
  getOne: (id) => api.get(`/goals/${id}`).then(r => r.data),
  create: (data) => api.post('/goals', data).then(r => r.data),
  update: (id, data) => api.put(`/goals/${id}`, data).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/goals/${id}/status`, { status }).then(r => r.data),
  remove: (id) => api.delete(`/goals/${id}`),
  addProgress: (id, data) => api.post(`/goals/${id}/progress`, data).then(r => r.data),
}

export const programsService = {
  getAll: () => api.get('/programs').then(r => r.data),
  getOne: (id) => api.get(`/programs/${id}`).then(r => r.data),
  create: (data) => api.post('/programs', data).then(r => r.data),
  update: (id, data) => api.put(`/programs/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/programs/${id}`),
}
