const { z } = require('zod')

const createReservationSchema = z.object({
  sessionId: z.string().cuid(),
})

const updateAttendanceSchema = z.object({
  attendance: z.enum(['PRESENT', 'ABSENT', 'CANCELLED']),
})

module.exports = { createReservationSchema, updateAttendanceSchema }
