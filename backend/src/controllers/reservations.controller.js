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
      include: {
        reservations: { where: { status: { in: ['CONFIRMED', 'WAITING'] } } },
      },
    })

    if (!session) return res.status(404).json({ message: 'Créneau introuvable' })
    if (session.isLocked || new Date(session.date) < new Date()) {
      return res.status(400).json({ message: 'Ce créneau n\'est plus disponible' })
    }

    // Bloquer si déjà réservé (actif)
    const existing = await prisma.reservation.findUnique({
      where: { userId_sessionId: { userId: req.user.id, sessionId } },
    })
    if (existing && existing.status !== 'CANCELLED') {
      return res.status(409).json({ message: 'Vous avez déjà réservé ce créneau' })
    }

    const active = session.reservations
    const confirmedCount = active.filter(r => r.status === 'CONFIRMED').length
    const waitingReservation = active.find(r => r.status === 'WAITING')

    let status = 'CONFIRMED'

    if (session.type === 'SOLO') {
      if (confirmedCount >= 1) {
        return res.status(400).json({ message: 'Créneau Solo complet' })
      }
      status = 'CONFIRMED'
    } else {
      // DUO
      if (confirmedCount >= 2) {
        return res.status(400).json({ message: 'Créneau Duo complet' })
      }

      if (!waitingReservation && confirmedCount === 0) {
        // 1ère personne : en attente d'un partenaire
        status = 'WAITING'
      } else if (waitingReservation) {
        // 2ème personne : complète le duo → les deux passent CONFIRMED
        status = 'CONFIRMED'
        await prisma.reservation.update({
          where: { id: waitingReservation.id },
          data: { status: 'CONFIRMED' },
        })
      } else {
        return res.status(400).json({ message: 'Créneau Duo complet' })
      }
    }

    let reservation
    if (existing?.status === 'CANCELLED') {
      reservation = await prisma.reservation.update({
        where: { id: existing.id },
        data: { status },
        include: { session: true },
      })
    } else {
      reservation = await prisma.reservation.create({
        data: { userId: req.user.id, sessionId, status },
        include: { session: true },
      })
    }

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

    // Pour un Duo : si l'annulé était CONFIRMED, rétrograder le partenaire CONFIRMED → WAITING
    if (reservation.session.type === 'DUO' && reservation.status === 'CONFIRMED') {
      const partner = await prisma.reservation.findFirst({
        where: {
          sessionId: reservation.sessionId,
          status: 'CONFIRMED',
          id: { not: reservation.id },
        },
      })
      if (partner) {
        await prisma.reservation.update({
          where: { id: partner.id },
          data: { status: 'WAITING' },
        })
      }
    }

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
