const { PrismaClient } = require('@prisma/client')
const { createReservationSchema, updateAttendanceSchema } = require('../validators/reservations.validator')
const { STRIKE_THRESHOLD, getBlockedUntil, isCurrentlyBlocked } = require('../utils/penalties.utils')
const { notify } = require('../utils/notify')

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

    // Vérifier si l'utilisateur est suspendu
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (isCurrentlyBlocked(currentUser)) {
      return res.status(403).json({
        message: `Votre compte est suspendu jusqu'au ${currentUser.blockedUntil.toLocaleDateString('fr-FR')} (${currentUser.strikes} strikes).`,
        blockedUntil: currentUser.blockedUntil,
      })
    }
    // Déblocage automatique si la suspension est expirée
    if (currentUser.blockedUntil && !isCurrentlyBlocked(currentUser)) {
      await prisma.user.update({ where: { id: req.user.id }, data: { blockedUntil: null } })
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { reservations: { where: { status: { in: ['CONFIRMED', 'WAITING'] } } } },
    })

    if (!session) return res.status(404).json({ message: 'Créneau introuvable' })
    if (session.isLocked || new Date(session.date) < new Date()) {
      return res.status(400).json({ message: 'Ce créneau n\'est plus disponible' })
    }

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
      if (confirmedCount >= 1) return res.status(400).json({ message: 'Créneau Solo complet' })
    } else {
      if (confirmedCount >= 2) return res.status(400).json({ message: 'Créneau Duo complet' })
      if (!waitingReservation && confirmedCount === 0) {
        status = 'WAITING'
      } else if (waitingReservation) {
        await prisma.reservation.update({ where: { id: waitingReservation.id }, data: { status: 'CONFIRMED' } })
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

    const dateStr = reservation.session.date.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    const link = `/planning/${reservation.session.id}`

    if (status === 'WAITING') {
      notify(req.user.id, 'RESERVATION_CONFIRMED', 'Réservation en attente', `Vous êtes en attente d'un partenaire pour la session Duo du ${dateStr}`, link)
    } else {
      notify(req.user.id, 'RESERVATION_CONFIRMED', 'Réservation confirmée', `Votre session ${reservation.session.type} du ${dateStr} est confirmée.`, link)
      // Si Duo : prévenir le partenaire en attente qui vient d'être promu
      if (reservation.session.type === 'DUO' && waitingReservation) {
        notify(waitingReservation.userId, 'DUO_PARTNER_JOINED', 'Partenaire trouvé !', `Un partenaire a rejoint votre session Duo du ${dateStr}. Vous êtes maintenant confirmé.`, link)
      }
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

    await prisma.reservation.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } })

    const dateStr = reservation.session.date.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    const link = `/planning/${reservation.session.id}`
    notify(reservation.userId, 'RESERVATION_CANCELLED', 'Réservation annulée', `Votre réservation pour la session du ${dateStr} a été annulée.`, link)

    if (reservation.session.type === 'DUO' && reservation.status === 'CONFIRMED') {
      const partner = await prisma.reservation.findFirst({
        where: { sessionId: reservation.sessionId, status: 'CONFIRMED', id: { not: reservation.id } },
      })
      if (partner) {
        await prisma.reservation.update({ where: { id: partner.id }, data: { status: 'WAITING' } })
        notify(partner.userId, 'DUO_PARTNER_LEFT', 'Partenaire parti', `Votre partenaire a annulé la session Duo du ${dateStr}. Vous êtes de nouveau en attente.`, link)
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

    const current = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    })
    if (!current) return res.status(404).json({ message: 'Réservation introuvable' })

    const wasAbsent = current.attendance === 'ABSENT'
    const isNowAbsent = attendance === 'ABSENT'

    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { attendance },
    })

    // Logique strikes : absent non justifié → +1 strike, correction → -1 strike
    if (!wasAbsent && isNowAbsent) {
      const updatedUser = await prisma.user.update({
        where: { id: current.userId },
        data: { strikes: { increment: 1 } },
      })
      if (updatedUser.strikes >= STRIKE_THRESHOLD && !updatedUser.blockedUntil) {
        await prisma.user.update({
          where: { id: updatedUser.id },
          data: { blockedUntil: getBlockedUntil() },
        })
      }
    } else if (wasAbsent && !isNowAbsent) {
      await prisma.user.update({
        where: { id: current.userId },
        data: { strikes: { decrement: 1 } },
      })
    }

    res.json(reservation)
  } catch (err) {
    next(err)
  }
}

module.exports = { getMyReservations, create, cancel, updateAttendance }
