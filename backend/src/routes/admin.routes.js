const { Router } = require('express')
const { resetDatabase, runSeed } = require('../controllers/admin.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const requireRole = require('../middlewares/role.middleware')

const router = Router()

router.use(authMiddleware, requireRole('ADMIN'))

router.post('/reset', resetDatabase)
router.post('/seed', runSeed)

module.exports = router
