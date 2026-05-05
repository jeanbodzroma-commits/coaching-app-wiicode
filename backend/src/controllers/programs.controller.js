const { PrismaClient } = require('@prisma/client')
const { createProgramSchema, updateProgramSchema } = require('../validators/programs.validator')

const prisma = new PrismaClient()

const employeeSelect = { id: true, firstName: true, lastName: true }
const coachSelect = { id: true, firstName: true, lastName: true }

async function getAll(req, res, next) {
  try {
    const { role, id } = req.user
    const where = role === 'EMPLOYEE' ? { employeeId: id }
      : role === 'COACH' ? { coachId: id }
      : {}

    const programs = await prisma.program.findMany({
      where,
      include: {
        employee: { select: employeeSelect },
        coach: { select: coachSelect },
        goal: { select: { id: true, title: true, type: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(programs)
  } catch (err) { next(err) }
}

async function getOne(req, res, next) {
  try {
    const program = await prisma.program.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { select: employeeSelect },
        coach: { select: coachSelect },
        goal: true,
      },
    })
    if (!program) return res.status(404).json({ message: 'Programme introuvable' })

    const { role, id } = req.user
    if (role === 'EMPLOYEE' && program.employeeId !== id) return res.status(403).json({ message: 'Accès refusé' })
    if (role === 'COACH' && program.coachId !== id) return res.status(403).json({ message: 'Accès refusé' })

    res.json(program)
  } catch (err) { next(err) }
}

async function create(req, res, next) {
  try {
    const data = createProgramSchema.parse(req.body)
    const program = await prisma.program.create({
      data: { ...data, coachId: req.user.id },
      include: { employee: { select: employeeSelect }, coach: { select: coachSelect }, goal: { select: { id: true, title: true } } },
    })
    res.status(201).json(program)
  } catch (err) { next(err) }
}

async function update(req, res, next) {
  try {
    const data = updateProgramSchema.parse(req.body)
    const program = await prisma.program.update({
      where: { id: req.params.id },
      data,
      include: { employee: { select: employeeSelect }, coach: { select: coachSelect } },
    })
    res.json(program)
  } catch (err) { next(err) }
}

async function remove(req, res, next) {
  try {
    await prisma.program.delete({ where: { id: req.params.id } })
    res.status(204).end()
  } catch (err) { next(err) }
}

module.exports = { getAll, getOne, create, update, remove }
