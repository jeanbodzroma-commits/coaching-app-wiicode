const { Router } = require('express')
const { getStrikes, unblock, addStrike } = require('../controllers/penalties.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')

const router = Router()

router.use(authMiddleware, requireRole('ADMIN'))

router.get('/', getStrikes)
router.post('/:userId/unblock', unblock)
router.post('/:userId/strike', addStrike)

module.exports = router
