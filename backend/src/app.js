const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth.routes')
const usersRoutes = require('./routes/users.routes')
const sessionsRoutes = require('./routes/sessions.routes')
const reservationsRoutes = require('./routes/reservations.routes')
const dashboardRoutes = require('./routes/dashboard.routes')
const historyRoutes = require('./routes/history.routes')
const penaltiesRoutes = require('./routes/penalties.routes')
const goalsRoutes = require('./routes/goals.routes')
const programsRoutes = require('./routes/programs.routes')
const notificationsRoutes = require('./routes/notifications.routes')
const adminRoutes = require('./routes/admin.routes')
const errorMiddleware = require('./middlewares/error.middleware')

const app = express()

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://coaching-app-wiicode.vercel.app',
  'http://localhost:5173',
].filter(Boolean)

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

app.get('/health', (req, res) => {
  const url = process.env.DATABASE_URL || ''
  res.json({ status: 'ok', db_set: !!url, db_prefix: url.slice(0, 15) })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/sessions', sessionsRoutes)
app.use('/api/reservations', reservationsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/history', historyRoutes)
app.use('/api/penalties', penaltiesRoutes)
app.use('/api/goals', goalsRoutes)
app.use('/api/programs', programsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/admin', adminRoutes)

app.use(errorMiddleware)

module.exports = app
