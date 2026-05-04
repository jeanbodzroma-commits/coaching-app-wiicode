const { PrismaClient } = require('@prisma/client')
const { createReservationSchema, updateAttendanceSchema } = require('../validators/reservations.validator')

const prisma = new PrismaClient()

async function getMyReservations(req, res, next) {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      include: { session: { include: { coach: { select: { firstName: true, lastName: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(reservations)
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const { sessionId } = createReservationSchema.parse(req.body)

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { _count: { select: { reservations: { where: { status: 'CONFIRMED' } } } } },
    })

    if (!session) return res.status(404).json({ message: 'Créneau introuvable' })
    if (session.isLocked || new Date(session.date) < new Date()) {
      return res.status(400).json({ message: 'Ce créneau n\'est plus disponible' })
    }

    const confirmed = session._count.reservations
    let status = 'CONFIRMED'

    if (confirmed >= session.capacity) {
      if (session.type === 'DUO' && confirmed === 1) {
        status = 'WAITING'
      } else {
        return res.status(400).json({ message: 'Créneau complet' })
      }
    }

    const existing = await prisma.reservation.findUnique({
      where: { userId_sessionId: { userId: req.user.id, sessionId } },
    })
    if (existing) return res.status(409).json({ message: 'Vous avez déjà réservé ce créneau' })

    const reservation = await prisma.reservation.create({
      data: { userId: req.user.id, sessionId, status },
      include: { session: true },
    })
    res.status(201).json(reservation)
  } catch (err) {
    next(err)
  }
}

async function cancel(req, res, next) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { session: true },
    })
    if (!reservation) return res.status(404).json({ message: 'Réservation introuvable' })
    if (reservation.userId !== req.user.id && req.user.role === 'EMPLOYEE') {
      return res.status(403).json({ message: 'Accès refusé' })
    }
    if (new Date(reservation.session.date) < new Date()) {
      return res.status(400).json({ message: 'Impossible d\'annuler un créneau passé' })
    }

    await prisma.reservation.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

async function updateAttendance(req, res, next) {
  try {
    const { attendance } = updateAttendanceSchema.parse(req.body)
    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { attendance },
    })
    res.json(reservation)
  } catch (err) {
    next(err)
  }
}

module.exports = { getMyReservations, create, cancel, updateAttendance }
