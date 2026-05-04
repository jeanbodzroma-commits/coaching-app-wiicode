const { z } = require('zod')

const createSessionSchema = z.object({
  date: z.string().datetime(),
  duration: z.number().int().min(15).max(180),
  type: z.enum(['SOLO', 'DUO']),
})

const updateSessionSchema = createSessionSchema.partial()

module.exports = { createSessionSchema, updateSessionSchema }
