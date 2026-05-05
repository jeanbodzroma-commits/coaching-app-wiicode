const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getAll(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const unreadCount = notifications.filter(n => !n.read).length
    res.json({ notifications, unreadCount })
  } catch (err) { next(err) }
}

async function markRead(req, res, next) {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    })
    res.status(204).end()
  } catch (err) { next(err) }
}

async function markAllRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    })
    res.status(204).end()
  } catch (err) { next(err) }
}

async function generateReminders(req, res, next) {
  try {
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const sessions = await prisma.session.findMany({
      where: { date: { gte: now, lte: in24h } },
      include: {
        reservations: {
          where: { status: 'CONFIRMED' },
          select: { userId: true, sessionId: true },
        },
      },
    })

    let count = 0
    for (const session of sessions) {
      for (const res of session.reservations) {
        const alreadySent = await prisma.notification.findFirst({
          where: {
            userId: res.userId,
            type: 'SESSION_REMINDER',
            link: `/planning/${session.id}`,
            createdAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
          },
        })
        if (!alreadySent) {
          const dateStr = session.date.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
          await prisma.notification.create({
            data: {
              userId: res.userId,
              type: 'SESSION_REMINDER',
              title: 'Rappel de session',
              message: `Votre session ${session.type} est prévue ${dateStr}`,
              link: `/planning/${session.id}`,
            },
          })
          count++
        }
      }
    }

    res.json({ generated: count })
  } catch (err) { next(err) }
}

module.exports = { getAll, markRead, markAllRead, generateReminders }
