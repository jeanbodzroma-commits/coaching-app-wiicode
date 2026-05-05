import api from './api'

export const notificationsService = {
  getAll: () => api.get('/notifications').then(r => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
  generateReminders: () => api.post('/notifications/generate-reminders').then(r => r.data),
}
