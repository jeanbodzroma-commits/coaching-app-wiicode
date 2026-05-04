const { z } = require('zod')

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'COACH', 'EMPLOYEE']).optional(),
})

const updateUserSchema = createUserSchema.partial().omit({ password: true })

module.exports = { createUserSchema, updateUserSchema }
