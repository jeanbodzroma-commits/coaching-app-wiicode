const { Router } = require('express')
const { getAll, markRead, markAllRead, generateReminders } = require('../controllers/notifications.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')

const router = Router()
router.use(authMiddleware)

router.get('/', getAll)
router.patch('/:id/read', markRead)
router.post('/mark-all-read', markAllRead)
router.post('/generate-reminders', requireRole('ADMIN'), generateReminders)

module.exports = router
