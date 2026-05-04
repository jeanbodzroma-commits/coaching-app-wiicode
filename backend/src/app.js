const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth.routes')
const usersRoutes = require('./routes/users.routes')
const sessionsRoutes = require('./routes/sessions.routes')
const reservationsRoutes = require('./routes/reservations.routes')
const errorMiddleware = require('./middlewares/error.middleware')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/sessions', sessionsRoutes)
app.use('/api/reservations', reservationsRoutes)

app.use(errorMiddleware)

module.exports = app
