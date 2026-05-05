const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const coach = await prisma.user.findUnique({ where: { email: 'coach@wiicode.fr' } })
  const employe = await prisma.user.findUnique({ where: { email: 'employe@wiicode.fr' } })

  if (!coach || !employe) {
    console.error('Utilisateurs manquants — lance d\'abord seed.js')
    process.exit(1)
  }

  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - 2)
  pastDate.setHours(10, 0, 0, 0)

  const session = await prisma.session.create({
    data: {
      date: pastDate,
      duration: 60,
      type: 'SOLO',
      capacity: 1,
      coachId: coach.id,
      isLocked: true,
    },
  })

  const reservation = await prisma.reservation.create({
    data: {
      userId: employe.id,
      sessionId: session.id,
      status: 'CONFIRMED',
    },
  })

  console.log('Créneau passé créé :')
  console.log('  Session ID :', session.id)
  console.log('  Date       :', session.date.toLocaleString('fr-FR'))
  console.log('  Type       :', session.type)
  console.log('  Réservation:', reservation.id, '— statut:', reservation.status)
  console.log('  Employé    :', employe.email)
  console.log('')
  console.log('Test marquage présence :')
  console.log(`  PATCH http://localhost:3000/api/reservations/${reservation.id}/attendance`)
  console.log('  Body: { "attendance": "PRESENT" }  (token coach requis)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
