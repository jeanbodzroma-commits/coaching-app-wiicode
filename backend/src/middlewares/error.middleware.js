const { ZodError } = require('zod')

function errorMiddleware(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Données invalides', errors: err.errors })
  }

  console.error(err)
  const status = err.status || 500
  res.status(status).json({ message: err.message || 'Erreur serveur' })
}

module.exports = errorMiddleware
