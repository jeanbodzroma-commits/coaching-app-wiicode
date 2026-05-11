# MODULES.md — Application Coaching Wiicode

> Découpage fonctionnel du projet en modules.
> Mis à jour à partir du code source actuel : les 10 modules sont implémentés.

---

## Vue d'ensemble

| # | Module | Priorité | Statut | Backend | Frontend |
|---|--------|----------|--------|---------|----------|
| 1 | Auth | CRITIQUE | ✅ | `auth.*` | `LoginPage`, `AuthContext`, `ProtectedRoute` |
| 2 | Utilisateurs | CRITIQUE | ✅ | `users.*` | `UsersPage` |
| 3 | Créneaux | CRITIQUE | ✅ | `sessions.*` | `PlanningPage`, `SessionDetailPage` |
| 4 | Réservations | CRITIQUE | ✅ | `reservations.*` | (inline dans Planning + Detail) |
| 5 | Gestion Solo/Duo | CRITIQUE | ✅ | logique dans `reservations.controller.js` | `PlanningPage`, `SessionDetailPage` |
| 6 | Dashboard | IMPORTANT | ✅ | `dashboard.controller.js` | `DashboardPage` + 3 composants par rôle |
| 7 | Historique | IMPORTANT | ✅ | `history.controller.js` | `HistoryPage` + 3 composants par rôle |
| 8 | Pénalités | NIVEAU 2 | ✅ | `penalties.*` + intégré aux réservations | `PenaltiesPage` |
| 9 | Objectifs & Programmes | NIVEAU 2 | ✅ | `goals.*` + `programs.*` | `ProgramsPage` + `CoachPrograms` / `EmployeePrograms` |
| 10 | Notifications | BONUS | ✅ in-app | `notifications.*` + util `notify` | `NotificationBell` |

---

## Détail des modules

### Module 1 — Auth

Authentification par email + mot de passe, JWT signé côté backend (`jsonwebtoken`), stocké en `localStorage` côté frontend. Le token est rejoué dans un header `Authorization: Bearer …` par un intercepteur axios.

- **Endpoints** : `POST /api/auth/login`, `GET /api/auth/me`
- **Mots de passe** : hashés `bcrypt` (10 rounds)
- **Middleware** : `auth.middleware.js` vérifie le JWT, `role.middleware.js` filtre par rôle
- **Frontend** : `AuthContext` charge `/auth/me` au boot si un token existe, `ProtectedRoute` redirige les utilisateurs non connectés ou sans le bon rôle
- **Compte désactivé** : `isActive=false` ⇒ login refusé (`401 Identifiants invalides`)

---

### Module 2 — Utilisateurs

CRUD réservé à l'admin. La suppression est une désactivation logique (`isActive=false`) — aucun enregistrement n'est physiquement supprimé.

- **Endpoints** : `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id` (tous `ADMIN`)
- **Champs** : `email`, `password`, `firstName`, `lastName`, `role` (`ADMIN` / `COACH` / `EMPLOYEE`)
- **Sortie** : sélection sûre (jamais le hash de mot de passe)
- **Validation** : Zod (`createUserSchema`, `updateUserSchema`)
- **Conflit email** : Prisma `P2002` ⇒ `409 Email déjà utilisé`

---

### Module 3 — Créneaux (Sessions)

Création par le coach (ou l'admin) avec date, durée (15–180 min) et type (SOLO/DUO). La capacité est dérivée du type (`SOLO=1`, `DUO=2`) côté serveur.

- **Endpoints** : `GET /api/sessions` (tous), `GET /api/sessions/:id`, `POST/PUT/DELETE` (coach/admin)
- **Verrouillage** : `isLocked=true` empêche la modification
- **Suppression** : refusée si une réservation `CONFIRMED`/`WAITING` existe
- **Listing** : `GET /api/sessions` retourne `confirmedCount` et `waitingCount` agrégés

---

### Module 4 — Réservations

L'employé réserve un créneau. Toutes les règles métier sont concentrées dans `reservations.controller.js#create` :

- pas de réservation si l'utilisateur est suspendu (`blockedUntil > now`)
- pas de double réservation active sur la même session (réservation `CANCELLED` réactivable)
- pas de réservation sur session verrouillée ou passée
- **Endpoints** :
  - `GET /api/reservations/me`
  - `POST /api/reservations` (employé/admin)
  - `DELETE /api/reservations/:id` (auteur ou coach/admin)
  - `PATCH /api/reservations/:id/attendance` (coach/admin)

L'annulation après le créneau passé est refusée.

---

### Module 5 — Gestion Solo / Duo

Logique encodée dans `reservations.controller.js#create` et `#cancel` :

- **Solo** : 1 place. Si `confirmedCount >= 1` → 400 « Créneau Solo complet ».
- **Duo** :
  - 1ʳᵉ réservation → statut `WAITING` (en attente d'un partenaire).
  - 2ᵉ réservation → la `WAITING` existante passe `CONFIRMED`, la nouvelle devient `CONFIRMED`. Notification `DUO_PARTNER_JOINED` envoyée au partenaire.
  - Si déjà 2 `CONFIRMED` → 400 « Créneau Duo complet ».
  - **Annulation Duo** : si un `CONFIRMED` annule alors qu'un partenaire est déjà confirmé, ce dernier repasse `WAITING` et reçoit `DUO_PARTNER_LEFT`.

---

### Module 6 — Dashboard

Endpoint unique `GET /api/dashboard` qui retourne des données différentes selon le rôle :

- **EMPLOYEE** : prochaine session, 5 prochaines, 5 dernières, stats (à venir / présent / absent / total).
- **COACH** : sessions du jour avec participants, 7 prochaines avec `fillRate`, sessions passées sans présence marquée, compteurs.
- **ADMIN** : agrégats utilisateurs (par rôle), sessions, statuts de réservations, 5 sessions récentes.

Le frontend rafraîchit la query `['dashboard']` toutes les 60 s.

---

### Module 7 — Historique

`GET /api/history` paginé (`limit` 15 par défaut), filtres :

- `type` : `SOLO` | `DUO`
- `attendance` : `PRESENT` | `ABSENT` | `CANCELLED` | `UNMARKED`
- `from` / `to` : bornes de date
- `coachId` : (admin uniquement)

Trois branches selon le rôle :

- **EMPLOYEE** : ses propres réservations passées + stats (taux de présence).
- **COACH** : ses sessions passées avec participants.
- **ADMIN** : toutes les sessions passées + liste des coachs (pour le filtre).

---

### Module 8 — Pénalités

Configuration en dur dans `backend/src/utils/penalties.utils.js` :

- `STRIKE_THRESHOLD = 3` — au 3ᵉ strike non couvert, suspension auto.
- `BLOCK_DAYS = 7` — durée de suspension.

Flux automatique :

- Coach passe une réservation à `ABSENT` ⇒ `+1 strike`. Si on repasse à autre chose : `-1 strike`.
- Au seuil et sans `blockedUntil` déjà posé, on pose `blockedUntil = now + 7j`.
- L'employé suspendu ne peut plus réserver (`403`).

Endpoints `ADMIN` :

- `GET /api/penalties` : employés avec `strikes > 0`
- `POST /api/penalties/:userId/unblock` : remise à 0 + déblocage
- `POST /api/penalties/:userId/strike` : strike manuel (raison requise)

---

### Module 9 — Objectifs & Programmes

Deux entités distinctes mais liables (`Program.goalId` optionnel et unique).

- **Goals** : type (`WEIGHT_LOSS` / `CARDIO` / `MUSCLE_GAIN` / `FLEXIBILITY` / `OTHER`), `status` (`ACTIVE`/`COMPLETED`/`PAUSED`), date cible, employé, coach.
- **Programs** : `title` + `content` libre (texte multi-lignes), optionnellement rattaché à un objectif.
- **ProgressLog** : note + valeur numérique optionnelle (poids, temps…), tracé par n'importe qui (coach ou employé).

Visibilité :

- `EMPLOYEE` voit ses propres objectifs/programmes.
- `COACH` voit ceux qu'il a créés.
- `ADMIN` voit tout.

---

### Module 10 — Notifications

Notifications **in-app uniquement** (pas d'email). Stockées en base, affichées via un bell icon dans la sidebar (`NotificationBell.jsx`), rafraîchissement toutes les 30 s.

Types (`NotificationType` enum) :

- `RESERVATION_CONFIRMED`, `RESERVATION_CANCELLED`
- `SESSION_REMINDER`
- `DUO_PARTNER_JOINED`, `DUO_PARTNER_LEFT`
- `STRIKE_ADDED`, `ACCOUNT_UNBLOCKED`

Le helper `utils/notify.js` est appelé par les contrôleurs concernés. Erreur silencieuse — une notif ratée ne plante pas la requête principale.

L'envoi de rappels (`SESSION_REMINDER`) est manuel : `POST /api/notifications/generate-reminders` (admin). Il génère les rappels pour les sessions à venir dans les 24 h, en dédupliquant sur la dernière heure. **Pas de cron** configuré — il faut appeler cet endpoint depuis l'extérieur.

---

## Ordre de construction réel

L'ordre de cadrage initial a été respecté. Le code reflète une montée progressive : modules critiques d'abord, puis dashboards/historique, puis pénalités, objectifs/programmes et notifications.

---

## Critères MVP — atteints

- [x] Auth opérationnelle avec gestion des rôles
- [x] CRUD des créneaux par le coach
- [x] Réservation / annulation avec règles métier
- [x] Gestion Solo / Duo correcte
- [x] Dashboards par rôle
- [x] Aucune incohérence de réservation (contrainte `@@unique([userId, sessionId])`)

---

*Document de référence — à mettre à jour à chaque évolution fonctionnelle.*
