const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getDashboard(req, res, next) {
  try {
    const { id, role } = req.user
    const now = new Date()

    if (role === 'EMPLOYEE') return res.json(await employeeDashboard(id, now))
    if (role === 'COACH') return res.json(await coachDashboard(id, now))
    if (role === 'ADMIN') return res.json(await adminDashboard(now))

    res.status(400).json({ message: 'Rôle inconnu' })
  } catch (err) {
    next(err)
  }
}

async function employeeDashboard(userId, now) {
  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: {
      session: {
        include: { coach: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const upcoming = reservations
    .filter(r => ['CONFIRMED', 'WAITING'].includes(r.status) && new Date(r.session.date) > now)
    .sort((a, b) => new Date(a.session.date) - new Date(b.session.date))

  const past = reservations.filter(r => new Date(r.session.date) <= now)

  return {
    role: 'EMPLOYEE',
    nextSession: upcoming[0] || null,
    upcoming: upcoming.slice(0, 5),
    stats: {
      upcomingCount: upcoming.length,
      attended: past.filter(r => r.attendance === 'PRESENT').length,
      missed: past.filter(r => r.attendance === 'ABSENT').length,
      totalPast: past.length,
    },
    recentHistory: past.slice(0, 5),
  }
}

async function coachDashboard(coachId, now) {
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const [todaySessions, upcomingSessions, needsAttention, totalSessions, upcomingCount] =
    await Promise.all([
      prisma.session.findMany({
        where: { coachId, date: { gte: todayStart, lte: todayEnd } },
        include: {
          reservations: {
            where: { status: { in: ['CONFIRMED', 'WAITING'] } },
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
        orderBy: { date: 'asc' },
      }),

      prisma.session.findMany({
        where: { coachId, date: { gt: now } },
        include: {
          reservations: {
            where: { status: { in: ['CONFIRMED', 'WAITING'] } },
            select: { status: true },
          },
        },
        orderBy: { date: 'asc' },
        take: 7,
      }),

      prisma.session.findMany({
        where: {
          coachId,
          date: { lt: now },
          reservations: { some: { status: 'CONFIRMED', attendance: null } },
        },
        include: {
          reservations: {
            where: { status: 'CONFIRMED', attendance: null },
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
        orderBy: { date: 'desc' },
        take: 5,
      }),

      prisma.session.count({ where: { coachId } }),
      prisma.session.count({ where: { coachId, date: { gt: now } } }),
    ])

  return {
    role: 'COACH',
    todaySessions,
    upcomingSessions: upcomingSessions.map(s => ({
      ...s,
      confirmedCount: s.reservations.filter(r => r.status === 'CONFIRMED').length,
      waitingCount: s.reservations.filter(r => r.status === 'WAITING').length,
      fillRate: Math.round((s.reservations.filter(r => r.status === 'CONFIRMED').length / s.capacity) * 100),
      reservations: undefined,
    })),
    needsAttention,
    stats: { totalSessions, upcomingCount },
  }
}

async function adminDashboard(now) {
  const [usersByRole, activeUsers, totalSessions, upcomingSessions, reservationsByStatus] =
    await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.session.count(),
      prisma.session.count({ where: { date: { gt: now } } }),
      prisma.reservation.groupBy({ by: ['status'], _count: { status: true } }),
    ])

  const roleMap = Object.fromEntries(usersByRole.map(r => [r.role, r._count.role]))
  const statusMap = Object.fromEntries(reservationsByStatus.map(r => [r.status, r._count.status]))
  const totalUsers = Object.values(roleMap).reduce((a, b) => a + b, 0)

  const recentSessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      coach: { select: { firstName: true, lastName: true } },
      reservations: {
        where: { status: { in: ['CONFIRMED', 'WAITING'] } },
        select: { status: true },
      },
    },
  })

  return {
    role: 'ADMIN',
    stats: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      byRole: { ADMIN: roleMap.ADMIN || 0, COACH: roleMap.COACH || 0, EMPLOYEE: roleMap.EMPLOYEE || 0 },
      totalSessions,
      upcomingSessions,
      pastSessions: totalSessions - upcomingSessions,
      reservations: {
        CONFIRMED: statusMap.CONFIRMED || 0,
        WAITING: statusMap.WAITING || 0,
        CANCELLED: statusMap.CANCELLED || 0,
      },
    },
    recentSessions: recentSessions.map(s => ({
      ...s,
      confirmedCount: s.reservations.filter(r => r.status === 'CONFIRMED').length,
      waitingCount: s.reservations.filter(r => r.status === 'WAITING').length,
      reservations: undefined,
    })),
  }
}

module.exports = { getDashboard }
