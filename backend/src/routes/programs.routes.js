const { Router } = require('express')
const { getAll, getOne, create, update, remove } = require('../controllers/programs.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')

const router = Router()
router.use(authMiddleware)

router.get('/', getAll)
router.get('/:id', getOne)
router.post('/', requireRole('COACH', 'ADMIN'), create)
router.put('/:id', requireRole('COACH', 'ADMIN'), update)
router.delete('/:id', requireRole('COACH', 'ADMIN'), remove)

module.exports = router
