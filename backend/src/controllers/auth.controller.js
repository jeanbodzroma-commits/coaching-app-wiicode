const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')
const { signToken } = require('../utils/jwt.utils')
const { loginSchema } = require('../validators/auth.validator')

const prisma = new PrismaClient()

async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Identifiants invalides' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ message: 'Identifiants invalides' })
    }

    const token = signToken({ id: user.id, role: user.role, email: user.email })
    const { password: _, ...userSafe } = user

    res.json({ token, user: userSafe })
  } catch (err) {
    next(err)
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, strikes: true },
    })
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

module.exports = { login, me }
