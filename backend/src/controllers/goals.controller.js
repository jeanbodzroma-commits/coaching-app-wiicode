const { PrismaClient } = require('@prisma/client')
const { createGoalSchema, updateGoalSchema, goalStatusSchema } = require('../validators/goals.validator')
const { progressLogSchema } = require('../validators/programs.validator')

const prisma = new PrismaClient()

const employeeSelect = { id: true, firstName: true, lastName: true, email: true }
const coachSelect = { id: true, firstName: true, lastName: true }

async function getAll(req, res, next) {
  try {
    const { role, id } = req.user
    const where = role === 'EMPLOYEE' ? { employeeId: id }
      : role === 'COACH' ? { coachId: id }
      : {}

    const goals = await prisma.goal.findMany({
      where,
      include: {
        employee: { select: employeeSelect },
        coach: { select: coachSelect },
        program: { select: { id: true, title: true } },
        _count: { select: { progressLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(goals)
  } catch (err) { next(err) }
}

async function getOne(req, res, next) {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { select: employeeSelect },
        coach: { select: coachSelect },
        program: true,
        progressLogs: {
          include: { loggedBy: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!goal) return res.status(404).json({ message: 'Objectif introuvable' })

    const { role, id } = req.user
    if (role === 'EMPLOYEE' && goal.employeeId !== id) return res.status(403).json({ message: 'Accès refusé' })
    if (role === 'COACH' && goal.coachId !== id) return res.status(403).json({ message: 'Accès refusé' })

    res.json(goal)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const data = createGoalSchema.parse(req.body)
    const goal = await prisma.goal.create({
      data: { ...data, coachId: req.user.id },
      include: { employee: { select: employeeSelect }, coach: { select: coachSelect } },
    })
    res.status(201).json(goal)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const data = updateGoalSchema.parse(req.body)
    const goal = await prisma.goal.update({
      where: { id: req.params.id },
      data,
      include: { employee: { select: employeeSelect }, coach: { select: coachSelect } },
    })
    res.json(goal)
  } catch (err) { next(err) }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = goalStatusSchema.parse(req.body)
    const goal = await prisma.goal.update({ where: { id: req.params.id }, data: { status } })
    res.json(goal)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    await prisma.goal.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
}

async function addProgress(req, res, next) {
  try {
    const { note, value } = progressLogSchema.parse(req.body)
    const log = await prisma.progressLog.create({
      data: { goalId: req.params.id, note, value, loggedById: req.user.id },
      include: { loggedBy: { select: { firstName: true, lastName: true, role: true } } },
    })
    res.status(201).json(log)
  } catch (err) { next(err) }
}

module.exports = { getAll, getOne, create, update, updateStatus, remove, addProgress }
