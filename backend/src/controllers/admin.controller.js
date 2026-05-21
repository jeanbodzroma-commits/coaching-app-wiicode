const { PrismaClient } = require('@prisma/client')
const path = require('path')

const prisma = new PrismaClient()

async function resetDatabase(req, res, next) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const counts = {}
      counts.progressLogs = (await tx.progressLog.deleteMany({})).count
      counts.notifications = (await tx.notification.deleteMany({})).count
      counts.programs = (await tx.program.deleteMany({})).count
      counts.reservations = (await tx.reservation.deleteMany({})).count
      counts.goals = (await tx.goal.deleteMany({})).count
      counts.sessions = (await tx.session.deleteMany({})).count
      counts.users = (await tx.user.deleteMany({ where: { role: { not: 'ADMIN' } } })).count
      return counts
    })

    res.json({ message: 'Base de données réinitialisée', deleted: result })
  } catch (err) {
    next(err)
  }
}

async function runSeed(req, res, next) {
  try {
    const seedModule = require(path.resolve(__dirname, '../../prisma/seed.js'))
    if (typeof seedModule.run !== 'function') {
      return res.status(500).json({ message: 'Module seed non exportable' })
    }
    const summary = await seedModule.run({ force: true })
    res.json({ message: 'Seed exécuté', summary })
  } catch (err) {
    next(err)
  }
}

module.exports = { resetDatabase, runSeed }
