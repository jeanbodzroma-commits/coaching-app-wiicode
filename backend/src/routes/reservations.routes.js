const { Router } = require('express')
const { getMyReservations, create, cancel, updateAttendance } = require('../controllers/reservations.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')

const router = Router()

router.use(authMiddleware)

router.get('/me', getMyReservations)
router.post('/', requireRole('EMPLOYEE', 'ADMIN'), create)
router.delete('/:id', cancel)
router.patch('/:id/attendance', requireRole('COACH', 'ADMIN'), updateAttendance)

module.exports = router
