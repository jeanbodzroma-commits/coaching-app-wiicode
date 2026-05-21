const { z } = require('zod')

const createGoalSchema = z.object({
  type: z.enum(['WEIGHT_LOSS', 'CARDIO', 'MUSCLE_GAIN', 'FLEXIBILITY', 'OTHER']),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  targetDate: z.coerce.date().optional(),
  employeeId: z.string().cuid(),
})

const updateGoalSchema = createGoalSchema.partial().omit({ employeeId: true })

const goalStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED']),
})

module.exports = { createGoalSchema, updateGoalSchema, goalStatusSchema }
