const { Router } = require('express')
const { getAll, getOne, create, update, updateStatus, remove, addProgress } = require('../controllers/goals.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')

const router = Router()
router.use(authMiddleware)

router.get('/', getAll)
router.get('/:id', getOne)
router.post('/', requireRole('COACH', 'ADMIN'), create)
router.put('/:id', requireRole('COACH', 'ADMIN'), update)
router.patch('/:id/status', requireRole('COACH', 'ADMIN', 'EMPLOYEE'), updateStatus)
router.delete('/:id', requireRole('COACH', 'ADMIN'), remove)
router.post('/:id/progress', addProgress)

module.exports = router
