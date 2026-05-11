const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────
const hash = (pwd) => bcrypt.hash(pwd, 10)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const chance = (p) => Math.random() < p

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function upsertUser({ email, firstName, lastName, role, password }) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: await hash(password), firstName, lastName, role },
  })
}

// ─── Canonical accounts ───────────────────────────────────────────────────
async function upsertCanonicalAccounts() {
  const admin = await upsertUser({ email: 'admin@wiicode.fr',   firstName: 'Admin',  lastName: 'Wiicode', role: 'ADMIN',    password: process.env.SEED_ADMIN_PASSWORD    || 'admin@1234' })
  const coach = await upsertUser({ email: 'coach@wiicode.fr',   firstName: 'Jean',   lastName: 'Coach',   role: 'COACH',    password: process.env.SEED_COACH_PASSWORD    || 'coach@1234' })
  const emp   = await upsertUser({ email: 'employe@wiicode.fr', firstName: 'Marie',  lastName: 'Dupont',  role: 'EMPLOYEE', password: process.env.SEED_EMPLOYEE_PASSWORD || 'employe@1234' })
  return { admin, coach, emp }
}

// ─── Extended dataset ─────────────────────────────────────────────────────
const FIRST_NAMES = ['Pierre', 'Sophie', 'Lucas', 'Camille', 'Hugo', 'Léa', 'Thomas', 'Manon', 'Antoine', 'Chloé', 'Maxime', 'Emma', 'Nicolas', 'Julie', 'Théo', 'Alice', 'Paul', 'Inès']
const LAST_NAMES  = ['Dubois', 'Martin', 'Lefebvre', 'Bernard', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefevre', 'Roux', 'Garcia', 'David', 'Bertrand', 'Roy']

const GOAL_TYPES = ['WEIGHT_LOSS', 'CARDIO', 'MUSCLE_GAIN', 'FLEXIBILITY', 'OTHER']
const GOAL_TITLES = {
  WEIGHT_LOSS: ['Perdre 5 kg en 3 mois', 'Stabiliser mon poids', 'Atteindre 70 kg', 'Affiner la silhouette'],
  CARDIO:      ['Courir 10 km sans m\'arrêter', 'Améliorer mon VO2 max', 'Tenir 30 min de cardio', 'Préparer un semi'],
  MUSCLE_GAIN: ['Prendre 3 kg de muscle', 'Développer le haut du corps', 'Renforcer le tronc', 'Tractions strictes ×10'],
  FLEXIBILITY: ['Toucher mes pieds debout', 'Travailler la souplesse globale', 'Améliorer la mobilité hanches', 'Splits frontaux'],
  OTHER:       ['Améliorer ma posture', 'Reprendre le sport régulièrement', 'Préparer un trail', 'Gestion du stress par le sport'],
}
const GOAL_STATUSES = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'COMPLETED', 'PAUSED']

const PROGRAM_TEMPLATES = [
  `Semaine 1
- Lundi : 3×30 min cardio modéré
- Mercredi : Renforcement bas du corps (3×12 squats, fentes, soulevés)
- Vendredi : Étirements + cardio léger

Semaine 2
- Lundi : Augmenter à 40 min cardio
- Mercredi : Ajouter HIIT (4×4 min)
- Vendredi : Récup active`,
  `Routine quotidienne (15 min)
- 5 min mobilité (épaules, hanches, chevilles)
- 3×10 squats au poids du corps
- 3×8 pompes
- 30 sec gainage planche
- 3×10 fentes alternées

À faire 5 fois par semaine.`,
  `Programme prise de masse — 4 semaines
- Lundi : Pectoraux / Triceps
- Mercredi : Dos / Biceps
- Vendredi : Jambes / Épaules
- Samedi : Repos actif (marche, étirements)

Charges progressives 4×8 répétitions.`,
  `Semaine type souplesse
- Tous les matins : 15 min étirements doux
- Lundi/Jeudi : Cours yoga (1h)
- Mardi/Vendredi : Mobilité hanches (20 min)

Objectif : ressentir une amélioration de la souplesse globale au bout de 6 semaines.`,
  `Préparation trail
- 2 sorties longues par semaine (1h+, dénivelé positif)
- 1 séance fractionné en côte (10×30 sec)
- 1 séance renforcement spécifique
- Récup active samedi (vélo, natation)

À ajuster selon ressenti.`,
]

const NOTIF_SAMPLES = [
  { type: 'RESERVATION_CONFIRMED', title: 'Réservation confirmée', message: 'Ta session SOLO est confirmée.' },
  { type: 'SESSION_REMINDER',      title: 'Rappel de session',     message: 'Ta session est prévue demain à 10h00.' },
  { type: 'DUO_PARTNER_JOINED',    title: 'Partenaire trouvé !',   message: 'Un partenaire a rejoint ta session Duo. Vous êtes confirmés.' },
  { type: 'RESERVATION_CANCELLED', title: 'Réservation annulée',   message: 'Ta réservation a bien été annulée.' },
  { type: 'DUO_PARTNER_LEFT',      title: 'Partenaire parti',      message: 'Ton partenaire a annulé. Tu es de nouveau en attente.' },
]

async function seedExtended(canonical) {
  // Additional coaches
  const coach2 = await upsertUser({ email: 'sarah.coach@wiicode.fr',   firstName: 'Sarah',   lastName: 'Martin',  role: 'COACH', password: (process.env.SEED_DEMO_PASSWORD || 'demo@1234') })
  const coach3 = await upsertUser({ email: 'antoine.coach@wiicode.fr', firstName: 'Antoine', lastName: 'Bernard', role: 'COACH', password: (process.env.SEED_DEMO_PASSWORD || 'demo@1234') })
  const coaches = [canonical.coach, coach2, coach3]

  // Additional employees (12 randomly named)
  const employees = [canonical.emp]
  const usedEmails = new Set([canonical.emp.email])
  for (let i = 0; i < 12; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length]
    const ln = LAST_NAMES[(i * 3 + 1) % LAST_NAMES.length]
    let email = `${fn.toLowerCase()}.${ln.toLowerCase().replace(/[^a-z]/g, '')}@wiicode.fr`
    if (usedEmails.has(email)) email = email.replace('@', `${i}@`)
    usedEmails.add(email)
    const u = await upsertUser({ email, firstName: fn, lastName: ln, role: 'EMPLOYEE', password: (process.env.SEED_DEMO_PASSWORD || 'demo@1234') })
    employees.push(u)
  }

  console.log(`  • ${coaches.length} coachs, ${employees.length} employés`)

  // Sessions: -60 days → +30 days, ~2-3 sessions/coach/week
  const now = new Date()
  const startDate = new Date(now); startDate.setHours(0, 0, 0, 0); startDate.setDate(startDate.getDate() - 60)
  const endDate   = new Date(now); endDate.setHours(0, 0, 0, 0);   endDate.setDate(endDate.getDate() + 30)

  const sessions = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue                       // pas de session le dimanche
    for (const coach of coaches) {
      if (!chance(0.45)) continue                        // 45% de chance/coach/jour
      const slots = shuffle([8, 10, 14, 16, 18]).slice(0, chance(0.3) ? 2 : 1)
      for (const hour of slots) {
        const sessionDate = new Date(d); sessionDate.setHours(hour, 0, 0, 0)
        const isPast = sessionDate < now
        const type = chance(0.6) ? 'SOLO' : 'DUO'
        const session = await prisma.session.create({
          data: {
            date: sessionDate,
            duration: pick([45, 60, 90]),
            type,
            capacity: type === 'SOLO' ? 1 : 2,
            isLocked: isPast,
            coachId: coach.id,
          },
        })
        sessions.push(session)
      }
    }
  }
  console.log(`  • ${sessions.length} créneaux`)

  // Reservations
  let resvCount = 0
  for (const s of sessions) {
    const isPast = new Date(s.date) < now
    const fillRate = isPast ? 0.85 : 0.65

    if (s.type === 'SOLO') {
      if (chance(fillRate)) {
        const user = pick(employees)
        try {
          await prisma.reservation.create({ data: { userId: user.id, sessionId: s.id, status: 'CONFIRMED' } })
          resvCount++
        } catch { /* unique conflict — skip */ }
      }
    } else {
      const r = Math.random()
      if (r < fillRate * 0.6) {
        const [u1, u2] = shuffle(employees).slice(0, 2)
        try {
          await prisma.reservation.create({ data: { userId: u1.id, sessionId: s.id, status: 'CONFIRMED' } })
          await prisma.reservation.create({ data: { userId: u2.id, sessionId: s.id, status: 'CONFIRMED' } })
          resvCount += 2
        } catch { /* skip */ }
      } else if (r < fillRate && !isPast) {
        const user = pick(employees)
        try {
          await prisma.reservation.create({ data: { userId: user.id, sessionId: s.id, status: 'WAITING' } })
          resvCount++
        } catch { /* skip */ }
      }
    }
  }
  console.log(`  • ${resvCount} réservations`)

  // Attendance on past reservations
  const pastReservations = await prisma.reservation.findMany({
    where: { session: { date: { lt: now } } },
  })
  const absencesPerUser = new Map()
  let attMarked = 0
  for (const r of pastReservations) {
    const roll = Math.random()
    const attendance = roll > 0.9 ? 'CANCELLED' : roll > 0.75 ? 'ABSENT' : 'PRESENT'
    await prisma.reservation.update({
      where: { id: r.id },
      data: { attendance, ...(attendance === 'CANCELLED' ? { status: 'CANCELLED' } : {}) },
    })
    if (attendance === 'ABSENT') {
      absencesPerUser.set(r.userId, (absencesPerUser.get(r.userId) || 0) + 1)
    }
    attMarked++
  }
  console.log(`  • ${attMarked} présences marquées`)

  // Strikes & blocks
  let strikesUsers = 0
  for (const [userId, absences] of absencesPerUser) {
    const strikes = Math.min(absences, 5)
    const data = { strikes }
    if (strikes >= 3) {
      const blockedUntil = new Date(now)
      if (chance(0.5)) {
        blockedUntil.setDate(blockedUntil.getDate() + randInt(1, 7))  // suspension active
      } else {
        blockedUntil.setDate(blockedUntil.getDate() - randInt(1, 5))  // suspension expirée
      }
      data.blockedUntil = blockedUntil
    }
    await prisma.user.update({ where: { id: userId }, data })
    strikesUsers++
  }
  console.log(`  • ${strikesUsers} employés avec strikes`)

  // Goals
  const goals = []
  for (const emp of employees) {
    if (!chance(0.65)) continue
    const numGoals = chance(0.3) ? 2 : 1
    for (let i = 0; i < numGoals; i++) {
      const type = pick(GOAL_TYPES)
      const targetDate = chance(0.7)
        ? (() => { const d = new Date(now); d.setDate(d.getDate() + randInt(30, 120)); return d })()
        : null
      const goal = await prisma.goal.create({
        data: {
          type,
          title: pick(GOAL_TITLES[type]),
          description: 'Objectif fixé avec le coach. À suivre avec régularité.',
          targetDate,
          status: pick(GOAL_STATUSES),
          employeeId: emp.id,
          coachId: pick(coaches).id,
        },
      })
      goals.push(goal)
    }
  }
  console.log(`  • ${goals.length} objectifs`)

  // Programs (linked + standalone)
  const programs = []
  for (const goal of goals) {
    if (!chance(0.55)) continue
    const p = await prisma.program.create({
      data: {
        title: `Programme — ${goal.title}`,
        content: pick(PROGRAM_TEMPLATES),
        goalId: goal.id,
        employeeId: goal.employeeId,
        coachId: goal.coachId,
      },
    })
    programs.push(p)
  }
  for (const emp of shuffle(employees).slice(0, 4)) {
    if (!chance(0.5)) continue
    const p = await prisma.program.create({
      data: {
        title: 'Routine hebdomadaire',
        content: pick(PROGRAM_TEMPLATES),
        employeeId: emp.id,
        coachId: pick(coaches).id,
      },
    })
    programs.push(p)
  }
  console.log(`  • ${programs.length} programmes`)

  // Progress logs
  const PROGRESS_NOTES = [
    'Bonne séance, énergie au rendez-vous', 'Difficile aujourd\'hui mais terminé',
    'Belle progression sur le cardio', 'Record battu sur les tractions', 'Pesée matinale',
    'Étirements ok, ressenti mieux', 'Progression sur le squat (+5 kg)',
    'Manque de motivation, séance courte', 'Récup active', 'Toucher de pieds réussi !',
    'Sortie longue 1h30', 'Mobilité hanches en amélioration',
  ]
  let logCount = 0
  for (const goal of goals) {
    if (goal.status === 'PAUSED') continue
    const numLogs = randInt(0, 6)
    for (let i = 0; i < numLogs; i++) {
      const createdAt = new Date(now); createdAt.setDate(createdAt.getDate() - randInt(0, 60))
      await prisma.progressLog.create({
        data: {
          goalId: goal.id,
          note: pick(PROGRESS_NOTES),
          value: chance(0.6) ? Number((Math.random() * 80 + 20).toFixed(1)) : null,
          loggedById: chance(0.6) ? goal.employeeId : goal.coachId,
          createdAt,
        },
      })
      logCount++
    }
  }
  console.log(`  • ${logCount} suivis de progression`)

  // Notifications
  let notifCount = 0
  for (const emp of employees) {
    const n = randInt(2, 8)
    for (let i = 0; i < n; i++) {
      const tpl = pick(NOTIF_SAMPLES)
      const createdAt = new Date(now); createdAt.setHours(createdAt.getHours() - randInt(0, 240))
      await prisma.notification.create({
        data: {
          userId: emp.id,
          type: tpl.type,
          title: tpl.title,
          message: tpl.message,
          read: chance(0.5),
          createdAt,
        },
      })
      notifCount++
    }
  }
  console.log(`  • ${notifCount} notifications`)
}

function printCredentials() {
  console.log('')
  console.log('✓ Comptes principaux (toujours présents) :')
  console.log('  - admin@wiicode.fr   / admin@1234   (override : SEED_ADMIN_PASSWORD)')
  console.log('  - coach@wiicode.fr   / coach@1234   (override : SEED_COACH_PASSWORD)')
  console.log('  - employe@wiicode.fr / employe@1234 (override : SEED_EMPLOYEE_PASSWORD)')
  console.log('Comptes additionnels (seed étendu) :')
  console.log('  - sarah.coach@wiicode.fr, antoine.coach@wiicode.fr  / demo@1234')
  console.log('  - <prenom>.<nom>@wiicode.fr (12 employés)           / demo@1234')
}

async function main() {
  console.log('🌱 Seed démarré')

  const canonical = await upsertCanonicalAccounts()

  // Skip the extended seed if already applied (marker = sarah.coach@wiicode.fr exists)
  const marker = await prisma.user.findUnique({ where: { email: 'sarah.coach@wiicode.fr' } })
  if (marker) {
    console.log('Seed étendu déjà appliqué — skip')
    printCredentials()
    return
  }

  await seedExtended(canonical)
  printCredentials()
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
