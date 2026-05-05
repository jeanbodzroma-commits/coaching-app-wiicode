const { Router } = require('express')
const { getHistory } = require('../controllers/history.controller')
const authMiddleware = require('../middlewares/auth.middleware')

const router = Router()

router.get('/', authMiddleware, getHistory)

module.exports = router
