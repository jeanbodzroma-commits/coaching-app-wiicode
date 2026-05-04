const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const hashed = (pwd) => bcrypt.hash(pwd, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@wiicode.fr' },
    update: {},
    create: {
      email: 'admin@wiicode.fr',
      password: await hashed('admin1234'),
      firstName: 'Admin',
      lastName: 'Wiicode',
      role: 'ADMIN',
    },
  })

  const coach = await prisma.user.upsert({
    where: { email: 'coach@wiicode.fr' },
    update: {},
    create: {
      email: 'coach@wiicode.fr',
      password: await hashed('coach1234'),
      firstName: 'Jean',
      lastName: 'Coach',
      role: 'COACH',
    },
  })

  await prisma.user.upsert({
    where: { email: 'employe@wiicode.fr' },
    update: {},
    create: {
      email: 'employe@wiicode.fr',
      password: await hashed('employe1234'),
      firstName: 'Marie',
      lastName: 'Dupont',
      role: 'EMPLOYEE',
    },
  })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  await prisma.session.create({
    data: {
      date: tomorrow,
      duration: 60,
      type: 'SOLO',
      capacity: 1,
      coachId: coach.id,
    },
  })

  console.log('Seed terminé :', { admin: admin.email, coach: coach.email })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
