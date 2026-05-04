const { Router } = require('express')
const { getAll, getOne, create, update, remove } = require('../controllers/users.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')

const router = Router()

router.use(authMiddleware)

router.get('/', requireRole('ADMIN'), getAll)
router.get('/:id', requireRole('ADMIN'), getOne)
router.post('/', requireRole('ADMIN'), create)
router.put('/:id', requireRole('ADMIN'), update)
router.delete('/:id', requireRole('ADMIN'), remove)

module.exports = router
