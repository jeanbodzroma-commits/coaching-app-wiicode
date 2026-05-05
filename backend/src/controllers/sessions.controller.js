const { PrismaClient } = require('@prisma/client')
const { createSessionSchema, updateSessionSchema } = require('../validators/sessions.validator')

const prisma = new PrismaClient()

function getCapacity(type) {
  return type === 'SOLO' ? 1 : 2
}

function formatSession(session) {
  const confirmed = session.reservations.filter(r => r.status === 'CONFIRMED').length
  const waiting = session.reservations.filter(r => r.status === 'WAITING').length
  const { reservations, ...rest } = session
  return { ...rest, confirmedCount: confirmed, waitingCount: waiting }
}

async function getAll(req, res, next) {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        coach: { select: { id: true, firstName: true, lastName: true } },
        reservations: {
          where: { status: { in: ['CONFIRMED', 'WAITING'] } },
          select: { status: true },
        },
      },
      orderBy: { date: 'asc' },
    })
    res.json(sessions.map(formatSession))
  } catch (err) {
    next(err)
  }
}

async function getOne(req, res, next) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        coach: { select: { id: true, firstName: true, lastName: true } },
        reservations: {
          where: { status: { in: ['CONFIRMED', 'WAITING'] } },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!session) return res.status(404).json({ message: 'Créneau introuvable' })
    res.json(session)
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = createSessionSchema.parse(req.body)
    const session = await prisma.session.create({
      data: {
        ...data,
        date: new Date(data.date),
        capacity: getCapacity(data.type),
        coachId: req.user.id,
      },
    })
    res.status(201).json(session)
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } })
    if (!session) return res.status(404).json({ message: 'Créneau introuvable' })
    if (session.isLocked) return res.status(400).json({ message: 'Créneau verrouillé' })

    const data = updateSessionSchema.parse(req.body)
    if (data.type) data.capacity = getCapacity(data.type)
    if (data.date) data.date = new Date(data.date)

    const updated = await prisma.session.update({ where: { id: req.params.id }, data })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        reservations: { where: { status: { in: ['CONFIRMED', 'WAITING'] } } },
      },
    })
    if (!session) return res.status(404).json({ message: 'Créneau introuvable' })
    if (session.reservations.length > 0) {
      return res.status(400).json({ message: 'Impossible de supprimer un créneau avec des réservations actives' })
    }

    await prisma.session.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, getOne, create, update, remove }
