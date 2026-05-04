const { verifyToken } = require('../utils/jwt.utils')

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' })
  }

  const token = header.split(' ')[1]
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ message: 'Token invalide ou expiré' })
  }

  req.user = payload
  next()
}

module.exports = authMiddleware
