const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function notify(userId, type, title, message, link = null) {
  try {
    await prisma.notification.create({ data: { userId, type, title, message, link } })
  } catch {
    // non-bloquant : une erreur de notif ne doit pas planter la requête principale
  }
}

module.exports = { notify }
