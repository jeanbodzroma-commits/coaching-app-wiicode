const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')
const { createUserSchema, updateUserSchema } = require('../validators/users.validator')

const prisma = new PrismaClient()

const safeSelect = {
  id: true, email: true, firstName: true, lastName: true,
  role: true, isActive: true, strikes: true, createdAt: true,
}

async function getAll(req, res, next) {
  try {
    const users = await prisma.user.findMany({ select: safeSelect, orderBy: { createdAt: 'desc' } })
    res.json(users)
  } catch (err) {
    next(err)
  }
}

async function getOne(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: safeSelect })
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const data = createUserSchema.parse(req.body)
    const hashed = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
      select: safeSelect,
    })
    res.status(201).json(user)
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Email déjà utilisé' })
    }
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const data = updateUserSchema.parse(req.body)
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: safeSelect,
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, getOne, create, update, remove }
