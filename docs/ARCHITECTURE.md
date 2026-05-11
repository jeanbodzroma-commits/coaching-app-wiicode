# ARCHITECTURE.md — Coaching App Wiicode

> Document construit à partir du code source. Décrit les flux, conventions et limites actuelles.

---

## 1. Vue d'ensemble

```
┌────────────────────────────┐
│  Frontend (Vercel)         │
│  React 18 + Vite           │
│  Tailwind · React Router   │
│  Axios · React Query · RHF │
└──────────────┬─────────────┘
               │ HTTP/JSON, Bearer JWT
┌──────────────▼─────────────┐
│  Backend (Render)          │
│  Express 4                 │
│  Prisma 5 · Zod            │
│  bcrypt · jsonwebtoken     │
└──────────────┬─────────────┘
               │ TCP/TLS
┌──────────────▼─────────────┐
│  PostgreSQL 16 (Render)    │
└────────────────────────────┘
```

Communication exclusivement **REST/JSON** sous `/api/*`. Aucun WebSocket ; les rafraîchissements temps réel passent par le `refetchInterval` de React Query (30 s pour les notifications, 60 s pour le dashboard).

---

## 2. Backend

### Point d'entrée

`backend/server.js` :

1. Charge `.env`.
2. Nettoie `DATABASE_URL` des guillemets accidentels (cas Render).
3. Importe `src/app.js`, écoute sur `process.env.PORT` (défaut 3000).

`src/app.js` configure Express :

- CORS limité à `process.env.FRONTEND_URL`, `https://coaching-app-wiicode.vercel.app` et `http://localhost:5173`.
- `express.json()` pour parser les bodies.
- `GET /health` non authentifié — retourne `{ status, db_set, db_prefix }`. Le `db_prefix` est temporaire (cf. commit `72f9dae`, à retirer une fois le déploiement stabilisé).
- Montage de 10 sous-routeurs sous `/api/*`.
- Error middleware final (cf. plus bas).

### Arborescence des dossiers

```
backend/src/
├── routes/         Routeurs Express (1 fichier par ressource)
├── controllers/    Fonctions async exportées (signature (req, res, next))
├── middlewares/    auth (JWT), role (RBAC), error (Zod + fallback)
├── validators/     Schémas Zod
└── utils/          jwt (sign/verify), notify (insert Notification), penalties (constantes)
```

### Conventions de contrôleur

- Toujours dans un `try/catch`, `next(err)` en cas d'erreur non métier.
- Erreurs métier : `res.status(...).json({ message })` directement, **sans** lever d'exception.
- Validation : `schema.parse(req.body)` en tête de handler — une `ZodError` est interceptée globalement.
- Prisma : un seul `PrismaClient` instancié au niveau du module (pas de pool partagé entre fichiers).

### Middlewares

- **`authMiddleware`** : lit `Authorization: Bearer <token>`, vérifie via `verifyToken`, pose `req.user = { id, role, email }`.
- **`requireRole(...roles)`** : 403 si `req.user.role` n'est pas dans la liste.
- **`errorMiddleware`** : intercepte `ZodError` ⇒ 400 + détails, sinon `err.status || 500` + `err.message`.

### Authentification

- Login : email + mot de passe (Zod `min(6)`), `bcrypt.compare`, JWT signé avec `JWT_SECRET` (`expiresIn` configurable, défaut `7d`).
- Payload : `{ id, role, email }`.
- Pas de refresh token, pas de blacklist. Pour invalider une session il faut changer le secret.
- Les comptes `isActive=false` sont refusés à la connexion (`401`).

### Logique métier critique

**Solo/Duo dans `reservations.controller.js#create`** : voir [MODULES.md §5](MODULES.md). La contrainte `@@unique([userId, sessionId])` garantit qu'un même utilisateur ne peut pas avoir deux lignes sur la même session ; une réservation `CANCELLED` est **mise à jour** et non recréée en cas de nouvelle réservation.

**Strikes** : déclenchés depuis `updateAttendance`. Passage à `ABSENT` ⇒ `+1`. Passage d'`ABSENT` à autre chose ⇒ `-1`. Au seuil et seulement si `blockedUntil` n'est pas déjà posé, on bloque pour 7 jours.

**Déblocage automatique** : si l'utilisateur tente de réserver alors que `blockedUntil` est dans le passé, on le remet à `null` avant de continuer.

---

## 3. Frontend

### Point d'entrée

`src/main.jsx` monte `<App/>` dans un `QueryClientProvider` (retry 1, staleTime 30 s).

`App.jsx` définit toutes les routes :

```
/login                       → LoginPage
/                            → ProtectedRoute → MainLayout
  ├── /dashboard             (index)
  ├── /planning              PlanningPage
  ├── /planning/:id          SessionDetailPage
  ├── /history               HistoryPage
  ├── /programs              ProgramsPage
  ├── /users                 UsersPage          (ADMIN only)
  └── /penalties             PenaltiesPage      (ADMIN only)
/*                           → redirect /dashboard
```

### Gestion d'état

- **Auth** : `store/AuthContext.jsx`. Le token est en `localStorage`, l'utilisateur courant est rechargé via `/auth/me` au montage. Expose `login`, `logout`, `user`, `loading`.
- **Server state** : exclusivement React Query (`@tanstack/react-query`). Pas de Redux ni de Context pour les données métier.
- **UI state** : `useState` local par composant. Pas de store global UI.

### Couche services

`src/services/api.js` :

- `baseURL` = `${VITE_API_URL}/api` ou `/api` (proxy Vite en dev).
- Intercepteur de requête : injecte `Authorization: Bearer <token>`.
- Intercepteur de réponse : sur `401`, supprime le token et `window.location.href = '/login'`.

Chaque ressource a son service (`sessions.service.js`, `reservations.service.js`, …) qui n'expose que les `(args) => api.<verb>(...).then(r => r.data)` — pas de transformation supplémentaire.

### Composants par rôle

Plusieurs pages éclatent l'UI par rôle :

- `DashboardPage` → `EmployeeDashboard | CoachDashboard | AdminDashboard`
- `HistoryPage`   → `EmployeeHistory | CoachHistory | AdminHistory`
- `ProgramsPage`  → `EmployeePrograms | CoachPrograms` (admin réutilise la vue coach)

L'API renvoie déjà la forme adaptée au rôle (cf. `dashboard.controller.js`), le frontend choisit juste le composant.

---

## 4. Schéma de base de données

7 modèles Prisma : `User`, `Session`, `Reservation`, `Notification`, `Goal`, `Program`, `ProgressLog`.
7 enums : `Role`, `SessionType`, `ReservationStatus`, `AttendanceStatus`, `NotificationType`, `GoalType`, `GoalStatus`.

Voir [SCHEMA.md](SCHEMA.md) pour le détail.

> ⚠️ `backend/prisma/migrations/` est **ignoré par git** (cf. racine `.gitignore`). En conséquence :
>
> - L'historique de migration n'est pas partagé.
> - Sur un nouvel environnement, `npx prisma migrate dev` crée une migration `init` à partir du `schema.prisma`.
> - En production, `npm run build` exécute `prisma generate && prisma db push --accept-data-loss` — c'est une synchro schéma directe, sans historique. À surveiller : `--accept-data-loss` autorise la suppression de colonnes/tables sans confirmation.

---

## 5. Sécurité — état actuel et limites

| Aspect | État | Note |
|--------|------|------|
| Mot de passe stocké en clair | ❌ | Hashé `bcrypt` 10 rounds |
| Auth | JWT Bearer | Stocké en `localStorage` (vulnérable XSS — à durcir en cookies `httpOnly` pour la prod) |
| CORS | ✅ allowlist | Origines explicites dans `app.js` |
| Validation des entrées | ✅ Zod | Sur les bodies des contrôleurs ; les query params (`history`, `notifications`) ne sont pas validés via Zod |
| Authorization | ✅ RBAC | `requireRole(...)` par route. Les endpoints ressource (`/api/goals/:id`, `/api/programs/:id`) revérifient la propriété dans le contrôleur |
| Rate limiting | ❌ | Pas de `express-rate-limit` |
| Helmet / CSP | ❌ | Pas de middleware sécurité standard |
| Logs | ⚠️ `console.error` | Pas de logger structuré (pino, winston) |
| Secrets | ✅ via `.env` | `JWT_SECRET` à changer impérativement |
| Endpoint `/health` | ⚠️ | Expose les 15 premiers caractères de `DATABASE_URL` — à retirer après debug (cf. commit `72f9dae`) |

---

## 6. Déploiement

- **Backend** : Render Web Service Node.
  - Build : `npm install && prisma generate && prisma db push --accept-data-loss`.
  - Start : `node server.js`.
  - Variables : `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT` (fourni par Render), `FRONTEND_URL`.
- **Base** : Render PostgreSQL.
- **Frontend** : Vercel.
  - Build : `vite build` (`npm run build`).
  - `vercel.json` ré-écrit toutes les URL vers `/index.html` (SPA fallback).
  - Variable : `VITE_API_URL` = URL du backend Render.

Le fichier `render.yaml` a été retiré (commit `bc0f5ee`).

---

## 7. Conventions de code

- **Backend** : JavaScript CommonJS (`require/module.exports`), pas de TypeScript, pas de transpilation.
- **Frontend** : JavaScript moderne (ESM, `type: module`), pas de TypeScript, pas de PropTypes.
- **Indentation** : 2 espaces.
- **Strings** : `'`, template literals avec backticks.
- **Imports** : alphabétiques par bloc (Node core / packages / locaux), pas d'alias `@/`.
- **Date** : tout est `Date` JS côté backend ; on parse depuis ISO avec `new Date(...)`. Formatage utilisateur via `Intl.DateTimeFormat('fr-FR')` côté front.
- **CSS** : Tailwind uniquement, pas de fichiers `.css` modules. Une seule couleur custom (`primary` bleu) dans `tailwind.config.js`.

---

## 8. Limites connues / dette technique

- Migrations Prisma non versionnées (`backend/prisma/migrations/` git-ignoré).
- `server.js` et `server_1.js` à la racine sont des reliquats non fonctionnels (chemin `./src/app` invalide depuis la racine).
- Endpoint `/health` expose une partie de `DATABASE_URL` (debug temporaire — commit `72f9dae`).
- Pas de tests automatisés (ni unitaires, ni e2e).
- Pas de pagination sur `GET /api/sessions` ni `GET /api/users` — risque de charge sur grosses bases.
- Pas de cron : `generate-reminders` doit être appelé manuellement.
- Pas de système de mot de passe oublié.
- `confirm()` / `prompt()` natifs utilisés pour certaines confirmations UI (UsersPage, PenaltiesPage).
- Les contrôleurs instancient chacun leur `PrismaClient` — en pratique un seul est partagé via le cache de modules Node, mais ce n'est pas explicite.
