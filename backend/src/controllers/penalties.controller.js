const { PrismaClient } = require('@prisma/client')
const { isCurrentlyBlocked, STRIKE_THRESHOLD, BLOCK_DAYS } = require('../utils/penalties.utils')

const prisma = new PrismaClient()

const safeSelect = {
  id: true, email: true, firstName: true, lastName: true,
  strikes: true, blockedUntil: true, isActive: true,
}

async function getStrikes(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', strikes: { gt: 0 } },
      select: safeSelect,
      orderBy: { strikes: 'desc' },
    })

    const result = users.map(u => ({
      ...u,
      isBlocked: isCurrentlyBlocked(u),
      blockExpired: u.blockedUntil && !isCurrentlyBlocked(u),
    }))

    res.json({ users: result, config: { strikeThreshold: STRIKE_THRESHOLD, blockDays: BLOCK_DAYS } })
  } catch (err) {
    next(err)
  }
}

async function unblock(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } })
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: { strikes: 0, blockedUntil: null },
      select: safeSelect,
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
}

async function addStrike(req, res, next) {
  try {
    const { reason } = req.body
    if (!reason) return res.status(400).json({ message: 'Raison requise' })

    const user = await prisma.user.findUnique({ where: { id: req.params.userId } })
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

    const { STRIKE_THRESHOLD: threshold, getBlockedUntil } = require('../utils/penalties.utils')
    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        strikes: { increment: 1 },
        ...(user.strikes + 1 >= threshold && !user.blockedUntil ? { blockedUntil: getBlockedUntil() } : {}),
      },
      select: safeSelect,
    })

    res.json({ ...updated, isBlocked: isCurrentlyBlocked(updated) })
  } catch (err) {
    next(err)
  }
}

module.exports = { getStrikes, unblock, addStrike }
