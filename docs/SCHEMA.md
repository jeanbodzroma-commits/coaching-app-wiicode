# SCHEMA.md — Modèle de données

> Référence : `backend/prisma/schema.prisma`.
> Source unique de vérité. Les migrations ne sont pas versionnées (`.gitignore`).

---

## Enums

| Enum | Valeurs |
|------|---------|
| `Role` | `ADMIN`, `COACH`, `EMPLOYEE` |
| `SessionType` | `SOLO`, `DUO` |
| `ReservationStatus` | `CONFIRMED`, `WAITING`, `CANCELLED` |
| `AttendanceStatus` | `PRESENT`, `ABSENT`, `CANCELLED` |
| `NotificationType` | `RESERVATION_CONFIRMED`, `RESERVATION_CANCELLED`, `SESSION_REMINDER`, `DUO_PARTNER_JOINED`, `DUO_PARTNER_LEFT`, `STRIKE_ADDED`, `ACCOUNT_UNBLOCKED` |
| `GoalType` | `WEIGHT_LOSS`, `CARDIO`, `MUSCLE_GAIN`, `FLEXIBILITY`, `OTHER` |
| `GoalStatus` | `ACTIVE`, `COMPLETED`, `PAUSED` |

---

## Modèles

### `User`

| Champ | Type | Notes |
|-------|------|-------|
| `id` | `String` cuid PK | |
| `email` | `String` unique | |
| `password` | `String` | bcrypt hash, jamais renvoyé |
| `firstName`, `lastName` | `String` | |
| `role` | `Role` | défaut `EMPLOYEE` |
| `isActive` | `Boolean` | défaut `true`. La "suppression" pose `false`. |
| `strikes` | `Int` | défaut 0. Géré par les contrôleurs réservation/penalties |
| `blockedUntil` | `DateTime?` | Si futur ⇒ utilisateur suspendu, ne peut plus réserver |
| `createdAt`, `updatedAt` | auto | |

Relations : `reservations[]`, `coachSessions[]` (créneaux animés), `employeeGoals[]`, `coachGoals[]`, `employeePrograms[]`, `coachPrograms[]`, `progressLogs[]`, `notifications[]`.

### `Session`

| Champ | Type | Notes |
|-------|------|-------|
| `id` | `String` cuid PK | |
| `date` | `DateTime` | Date + heure de début |
| `duration` | `Int` | minutes, 15..180 (Zod) |
| `type` | `SessionType` | `SOLO` ou `DUO` |
| `capacity` | `Int` | dérivée (`1` ou `2`), définie côté serveur |
| `isLocked` | `Boolean` | défaut `false`. Verrouille l'édition |
| `coachId` | FK `User.id` | |

Relations : `coach` (User), `reservations[]`.

### `Reservation`

| Champ | Type | Notes |
|-------|------|-------|
| `id` | `String` cuid PK | |
| `status` | `ReservationStatus` | défaut `CONFIRMED` |
| `attendance` | `AttendanceStatus?` | nullable tant que non marqué |
| `userId` | FK `User.id` | |
| `sessionId` | FK `Session.id` | |

Contrainte : `@@unique([userId, sessionId])` — un utilisateur ne peut pas avoir deux lignes pour la même session. En cas de re-réservation après `CANCELLED`, on **met à jour** la ligne existante.

### `Notification`

| Champ | Type | Notes |
|-------|------|-------|
| `id` | `String` cuid PK | |
| `type` | `NotificationType` | |
| `title` | `String` | |
| `message` | `String` | |
| `read` | `Boolean` | défaut `false` |
| `link` | `String?` | route SPA cliquable, ex. `/planning/<id>` |
| `userId` | FK `User.id` | destinataire |
| `createdAt` | auto | |

Liste limitée à 50 par récupération (`GET /api/notifications`).

### `Goal`

| Champ | Type | Notes |
|-------|------|-------|
| `id` | `String` cuid PK | |
| `type` | `GoalType` | |
| `title` | `String` | max 120 |
| `description` | `String?` | max 500 |
| `targetDate` | `DateTime?` | |
| `status` | `GoalStatus` | défaut `ACTIVE` |
| `employeeId` | FK `User.id` | bénéficiaire |
| `coachId` | FK `User.id` | créateur |

Relations : `program?` (optionnel, 1–1), `progressLogs[]`.

### `Program`

| Champ | Type | Notes |
|-------|------|-------|
| `id` | `String` cuid PK | |
| `title` | `String` | max 120 |
| `content` | `String` | texte libre |
| `goalId` | FK `Goal.id?` unique | rattachement optionnel à un objectif |
| `employeeId` | FK `User.id` | |
| `coachId` | FK `User.id` | |

Contrainte : `goalId` est `@unique` → un objectif a au plus un programme.

### `ProgressLog`

| Champ | Type | Notes |
|-------|------|-------|
| `id` | `String` cuid PK | |
| `goalId` | FK `Goal.id` | |
| `note` | `String` | max 500 |
| `value` | `Float?` | mesure libre (poids, temps…) |
| `loggedById` | FK `User.id` | coach ou employé |
| `createdAt` | auto | |

---

## Relations (vue d'ensemble)

```
User 1──n Session       (coach)
User 1──n Reservation
Session 1──n Reservation
User 1──n Goal          (employee, coach)
Goal 1──1? Program
User 1──n Program       (employee, coach)
Goal 1──n ProgressLog
User 1──n ProgressLog   (loggedBy)
User 1──n Notification
```

---

## Indices & contraintes notables

- `User.email` : unique.
- `Reservation` : `@@unique([userId, sessionId])` — protection contre la double réservation au niveau DB.
- `Program.goalId` : unique nullable — un goal a au plus un programme.
- Toutes les FK sont implicitement indexées par Prisma.

Aucun index secondaire n'est défini : sur de gros volumes, prévoir des index sur `Session.date`, `Reservation.userId`, `Reservation.sessionId`, `Notification.userId+read`.

---

## Cycles de vie

### Réservation

```
[créer]  ─────► CONFIRMED  (Solo, ou Duo avec partenaire en attente)
[créer]  ─────► WAITING    (Duo, première personne)
WAITING  ─────► CONFIRMED  (deuxième personne s'inscrit)
CONFIRMED ────► WAITING    (partenaire Duo annule)
* ──[cancel]─► CANCELLED   (ligne conservée pour re-réservation propre)
CANCELLED ────► CONFIRMED  (re-réservation : update de la ligne)
```

### Strikes

```
attendance = null
     │
     │ coach marque ABSENT
     ▼
strikes +1 ─── si strikes >= 3 et !blockedUntil ───► blockedUntil = now + 7j
     │
     │ coach corrige (PRESENT/CANCELLED)
     ▼
strikes -1

À la prochaine réservation :
  blockedUntil < now ───► déblocage automatique (blockedUntil = null)
```
