const { z } = require('zod')

const createProgramSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1),
  employeeId: z.string().cuid(),
  goalId: z.string().cuid().optional(),
})

const updateProgramSchema = createProgramSchema.partial().omit({ employeeId: true })

const progressLogSchema = z.object({
  note: z.string().min(1).max(500),
  value: z.number().optional(),
})

module.exports = { createProgramSchema, updateProgramSchema, progressLogSchema }
