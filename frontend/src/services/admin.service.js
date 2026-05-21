import api from './api'

export const adminService = {
  reset: () => api.post('/admin/reset').then(r => r.data),
  seed:  () => api.post('/admin/seed').then(r => r.data),
}
