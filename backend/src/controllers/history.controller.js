const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const DEFAULT_LIMIT = 15

async function getHistory(req, res, next) {
  try {
    const { role, id } = req.user
    const { page = 1, limit = DEFAULT_LIMIT, attendance, type, from, to } = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const now = new Date()

    const dateFilter = { lt: now }
    if (from) dateFilter.gte = new Date(from)
    if (to) { const d = new Date(to); d.setHours(23, 59, 59, 999); dateFilter.lte = d }

    if (role === 'EMPLOYEE') return res.json(await employeeHistory({ userId: id, skip, limit: Number(limit), page: Number(page), attendance, type, dateFilter }))
    if (role === 'COACH') return res.json(await coachHistory({ coachId: id, skip, limit: Number(limit), page: Number(page), attendance, type, dateFilter }))
    if (role === 'ADMIN') return res.json(await adminHistory({ skip, limit: Number(limit), page: Number(page), attendance, type, dateFilter, coachId: req.query.coachId }))

    res.status(400).json({ message: 'Rôle inconnu' })
  } catch (err) {
    next(err)
  }
}

async function employeeHistory({ userId, skip, limit, page, attendance, type, dateFilter }) {
  const sessionFilter = { date: dateFilter, ...(type ? { type } : {}) }
  const where = {
    userId,
    session: sessionFilter,
    ...(attendance === 'UNMARKED' ? { attendance: null } : attendance ? { attendance } : {}),
  }

  const [total, reservations, allStats] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      include: {
        session: { include: { coach: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { session: { date: 'desc' } },
      skip,
      take: limit,
    }),
    prisma.reservation.findMany({
      where: { userId, session: { date: { lt: new Date() } } },
      select: { attendance: true, status: true },
    }),
  ])

  return {
    role: 'EMPLOYEE',
    data: reservations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: {
      total: allStats.length,
      present: allStats.filter(r => r.attendance === 'PRESENT').length,
      absent: allStats.filter(r => r.attendance === 'ABSENT').length,
      cancelled: allStats.filter(r => r.attendance === 'CANCELLED').length,
      unmarked: allStats.filter(r => r.attendance === null).length,
      attendanceRate: allStats.length
        ? Math.round((allStats.filter(r => r.attendance === 'PRESENT').length / allStats.filter(r => r.attendance !== null).length || 0) * 100)
        : 0,
    },
  }
}

async function coachHistory({ coachId, skip, limit, page, attendance, type, dateFilter }) {
  const sessionWhere = { coachId, date: dateFilter, ...(type ? { type } : {}) }

  const reservationWhere = {
    status: { not: 'CANCELLED' },
    ...(attendance === 'UNMARKED' ? { attendance: null } : attendance ? { attendance } : {}),
  }

  const [total, sessions] = await Promise.all([
    prisma.session.count({ where: sessionWhere }),
    prisma.session.findMany({
      where: sessionWhere,
      include: {
        reservations: {
          where: reservationWhere,
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
  ])

  return {
    role: 'COACH',
    data: sessions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

async function adminHistory({ skip, limit, page, attendance, type, dateFilter, coachId }) {
  const sessionWhere = {
    date: dateFilter,
    ...(type ? { type } : {}),
    ...(coachId ? { coachId } : {}),
  }

  const reservationWhere = {
    status: { not: 'CANCELLED' },
    ...(attendance === 'UNMARKED' ? { attendance: null } : attendance ? { attendance } : {}),
  }

  const [total, sessions, coaches] = await Promise.all([
    prisma.session.count({ where: sessionWhere }),
    prisma.session.findMany({
      where: sessionWhere,
      include: {
        coach: { select: { id: true, firstName: true, lastName: true } },
        reservations: {
          where: reservationWhere,
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.findMany({ where: { role: 'COACH', isActive: true }, select: { id: true, firstName: true, lastName: true } }),
  ])

  return {
    role: 'ADMIN',
    data: sessions,
    coaches,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

module.exports = { getHistory }
