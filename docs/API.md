# API.md — Référence des endpoints REST

> Toutes les routes sont préfixées par `/api`.
> Sauf indication contraire, l'authentification se fait par `Authorization: Bearer <jwt>`.
> Tous les endpoints peuvent retourner `400` (validation Zod), `401` (token manquant/invalide), `403` (rôle insuffisant) ou `500` (erreur serveur).

---

## Auth — `/api/auth`

| Méthode | Chemin | Auth | Rôles | Description |
|---------|--------|------|-------|-------------|
| POST | `/login` | — | — | Identifiants → token + user |
| GET  | `/me`    | ✅ | tous | Profil du token courant |

### POST `/api/auth/login`

```json
{ "email": "admin@wiicode.fr", "password": "Wiicode-Admin-Coaching-2025!" }
```

Réponse 200 :

```json
{
  "token": "<jwt>",
  "user": { "id": "...", "email": "...", "firstName": "...", "lastName": "...", "role": "ADMIN", ... }
}
```

Erreurs : `401 Identifiants invalides`.

### GET `/api/auth/me`

Réponse 200 : `{ id, email, firstName, lastName, role, strikes }`.

---

## Users — `/api/users` (admin only)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET    | `/`     | Liste de tous les utilisateurs |
| GET    | `/:id`  | Un utilisateur |
| POST   | `/`     | Création |
| PUT    | `/:id`  | Mise à jour (sans `password`) |
| DELETE | `/:id`  | Désactivation logique (`isActive=false`) |

### POST `/api/users`

```json
{
  "email": "u@wiicode.fr",
  "password": "secret123",
  "firstName": "U",
  "lastName": "Ser",
  "role": "EMPLOYEE"          // optionnel, défaut EMPLOYEE
}
```

Erreur : `409 Email déjà utilisé` (P2002).

---

## Sessions — `/api/sessions`

| Méthode | Chemin | Rôles | Description |
|---------|--------|-------|-------------|
| GET    | `/`    | tous           | Liste, triée par date asc |
| GET    | `/:id` | tous           | Détail + participants |
| POST   | `/`    | COACH, ADMIN   | Créer un créneau |
| PUT    | `/:id` | COACH, ADMIN   | Modifier (interdit si verrouillé) |
| DELETE | `/:id` | COACH, ADMIN   | Supprimer (interdit si réservations actives) |

### POST `/api/sessions`

```json
{
  "date": "2026-05-15T10:00:00.000Z",
  "duration": 60,         // 15..180
  "type": "DUO"           // SOLO | DUO
}
```

- `capacity` est calculée serveur (`SOLO=1`, `DUO=2`).
- `coachId` est repris depuis le JWT.

### GET `/api/sessions` (extrait)

```json
[
  {
    "id": "...",
    "date": "...",
    "duration": 60,
    "type": "DUO",
    "capacity": 2,
    "isLocked": false,
    "coach": { "id": "...", "firstName": "...", "lastName": "..." },
    "confirmedCount": 1,
    "waitingCount": 1
  }
]
```

---

## Reservations — `/api/reservations`

| Méthode | Chemin | Rôles | Description |
|---------|--------|-------|-------------|
| GET    | `/me`               | tous            | Mes réservations |
| POST   | `/`                 | EMPLOYEE, ADMIN | Réserver un créneau |
| DELETE | `/:id`              | auteur, COACH, ADMIN | Annuler (interdit si passé) |
| PATCH  | `/:id/attendance`   | COACH, ADMIN    | Marquer présence |

### POST `/api/reservations`

```json
{ "sessionId": "<cuid>" }
```

Réponses :

- `201` réservation créée (`status: CONFIRMED` ou `WAITING` pour Duo solo).
- `400` si créneau passé, complet, ou utilisateur suspendu.
- `404` si créneau introuvable.
- `409` si l'utilisateur a déjà une réservation active sur ce créneau.

### PATCH `/api/reservations/:id/attendance`

```json
{ "attendance": "PRESENT" }   // PRESENT | ABSENT | CANCELLED
```

Effets de bord :

- `ABSENT` → `+1 strike`. Si seuil atteint, `blockedUntil = now + 7j`.
- Repasse d'`ABSENT` à autre chose → `-1 strike`.

---

## Dashboard — `/api/dashboard`

| Méthode | Chemin | Rôles | Description |
|---------|--------|-------|-------------|
| GET    | `/`    | tous  | Payload adapté au rôle |

Réponse selon `req.user.role` :

- `EMPLOYEE` : `{ role, nextSession, upcoming[], stats, recentHistory[] }`
- `COACH` : `{ role, todaySessions[], upcomingSessions[], needsAttention[], stats }`
- `ADMIN` : `{ role, stats, recentSessions[] }`

---

## History — `/api/history`

| Méthode | Chemin | Rôles | Description |
|---------|--------|-------|-------------|
| GET    | `/`    | tous  | Historique paginé + filtres |

Query params :

| Param | Type | Notes |
|-------|------|-------|
| `page` | number | défaut 1 |
| `limit` | number | défaut 15 |
| `type` | `SOLO` \| `DUO` | optionnel |
| `attendance` | `PRESENT` \| `ABSENT` \| `CANCELLED` \| `UNMARKED` | optionnel |
| `from` | ISO date | optionnel |
| `to` | ISO date | inclusif (jusqu'à 23:59:59.999) |
| `coachId` | string | ADMIN uniquement |

Réponse :

```json
{
  "role": "EMPLOYEE",
  "data": [...],
  "pagination": { "page": 1, "limit": 15, "total": 42, "totalPages": 3 },
  "stats": { ... }   // EMPLOYEE uniquement
}
```

---

## Penalties — `/api/penalties` (admin only)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET    | `/`                        | Employés avec `strikes > 0` |
| POST   | `/:userId/unblock`         | RAZ strikes + déblocage |
| POST   | `/:userId/strike`          | Ajout manuel d'un strike |

### GET `/api/penalties`

```json
{
  "users": [
    {
      "id": "...", "email": "...", "firstName": "...", "lastName": "...",
      "strikes": 2, "blockedUntil": null, "isActive": true,
      "isBlocked": false, "blockExpired": false
    }
  ],
  "config": { "strikeThreshold": 3, "blockDays": 7 }
}
```

### POST `/api/penalties/:userId/strike`

```json
{ "reason": "Absence répétée sans justification" }
```

`400 Raison requise` si `reason` absent.

---

## Goals — `/api/goals`

| Méthode | Chemin | Rôles | Description |
|---------|--------|-------|-------------|
| GET    | `/`               | tous           | Objectifs filtrés par rôle |
| GET    | `/:id`            | tous (avec propriété) | Détail + progressLogs |
| POST   | `/`               | COACH, ADMIN   | Créer |
| PUT    | `/:id`            | COACH, ADMIN   | Mettre à jour |
| PATCH  | `/:id/status`     | tous           | Changer le statut |
| DELETE | `/:id`            | COACH, ADMIN   | Supprimer |
| POST   | `/:id/progress`   | tous           | Ajouter un suivi |

Visibilité (filtrage côté serveur) :

- EMPLOYEE : `employeeId = self`.
- COACH : `coachId = self`.
- ADMIN : tout.

### POST `/api/goals`

```json
{
  "type": "WEIGHT_LOSS",      // WEIGHT_LOSS | CARDIO | MUSCLE_GAIN | FLEXIBILITY | OTHER
  "title": "Perdre 5kg",
  "description": "...",       // optionnel, max 500
  "targetDate": "2026-09-01T00:00:00Z",  // optionnel
  "employeeId": "<cuid>"
}
```

### POST `/api/goals/:id/progress`

```json
{ "note": "Séance cardio 30 min", "value": 70.4 }
```

---

## Programs — `/api/programs`

| Méthode | Chemin | Rôles | Description |
|---------|--------|-------|-------------|
| GET    | `/`     | tous            | Liste filtrée |
| GET    | `/:id`  | tous (propriété) | Détail |
| POST   | `/`     | COACH, ADMIN    | Créer |
| PUT    | `/:id`  | COACH, ADMIN    | Modifier |
| DELETE | `/:id`  | COACH, ADMIN    | Supprimer |

### POST `/api/programs`

```json
{
  "title": "Programme cardio 4 semaines",
  "content": "Semaine 1 : 3x30min cardio\nSemaine 2 : ...",
  "employeeId": "<cuid>",
  "goalId": "<cuid>"    // optionnel ; unique côté DB
}
```

---

## Notifications — `/api/notifications`

| Méthode | Chemin | Rôles | Description |
|---------|--------|-------|-------------|
| GET    | `/`                       | tous   | 50 dernières + `unreadCount` |
| PATCH  | `/:id/read`               | tous   | Marquer comme lue |
| POST   | `/mark-all-read`          | tous   | Marquer tout comme lu |
| POST   | `/generate-reminders`     | ADMIN  | Générer les `SESSION_REMINDER` pour les 24 h à venir |

### GET `/api/notifications`

```json
{
  "notifications": [
    {
      "id": "...", "type": "RESERVATION_CONFIRMED", "title": "...",
      "message": "...", "link": "/planning/<id>", "read": false,
      "createdAt": "..."
    }
  ],
  "unreadCount": 3
}
```

Types possibles : `RESERVATION_CONFIRMED`, `RESERVATION_CANCELLED`, `SESSION_REMINDER`, `DUO_PARTNER_JOINED`, `DUO_PARTNER_LEFT`, `STRIKE_ADDED`, `ACCOUNT_UNBLOCKED`.

---

## Endpoint hors `/api`

| Méthode | Chemin | Auth | Description |
|---------|--------|------|-------------|
| GET    | `/health` | — | `{ status: "ok", db_set: true, db_prefix: "postgresql://" }` — debug temporaire (cf. commit `72f9dae`, à retirer) |

---

## Codes d'erreur standard

| Code | Sens | Body |
|------|------|------|
| 400 | Données invalides (Zod) | `{ message, errors: [...] }` |
| 400 | Règle métier violée | `{ message: "..." }` |
| 401 | Token absent / invalide | `{ message: "Token manquant"|"Token invalide ou expiré" }` |
| 401 | Identifiants invalides | `{ message: "Identifiants invalides" }` |
| 403 | Rôle insuffisant / accès refusé | `{ message: "Accès refusé" }` |
| 403 | Compte suspendu | `{ message: "Votre compte est suspendu...", blockedUntil }` |
| 404 | Ressource introuvable | `{ message: "... introuvable" }` |
| 409 | Conflit (email, double réservation) | `{ message: "..." }` |
| 500 | Erreur serveur | `{ message: "Erreur serveur" }` |
