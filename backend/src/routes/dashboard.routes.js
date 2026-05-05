const { Router } = require('express')
const { getDashboard } = require('../controllers/dashboard.controller')
const authMiddleware = require('../middlewares/auth.middleware')

const router = Router()

router.get('/', authMiddleware, getDashboard)

module.exports = router
