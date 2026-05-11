# ROADMAP.md — Avancement & pistes

> Snapshot construit en lisant le code à date.
> Les 10 modules du cadrage initial sont implémentés.

---

## État par module

| # | Module | Backend | Frontend | Tests | Commentaire |
|---|--------|---------|----------|-------|-------------|
| 1 | Auth | ✅ | ✅ | ❌ | JWT en `localStorage` (à durcir en `httpOnly` pour la prod) |
| 2 | Utilisateurs | ✅ | ✅ | ❌ | Suppression = désactivation. Pas de reset password |
| 3 | Créneaux | ✅ | ✅ | ❌ | Pas de pagination sur `GET /sessions` |
| 4 | Réservations | ✅ | ✅ | ❌ | Logique Solo/Duo couverte |
| 5 | Solo / Duo | ✅ | ✅ | ❌ | File d'attente Duo gérée |
| 6 | Dashboard | ✅ | ✅ | ❌ | Refetch 60 s côté front |
| 7 | Historique | ✅ | ✅ | ❌ | Filtres + pagination |
| 8 | Pénalités | ✅ | ✅ | ❌ | Seuil 3 / 7 jours en dur (`penalties.utils.js`) |
| 9 | Objectifs & Programmes | ✅ | ✅ | ❌ | Goal ↔ Program 1–1 optionnel |
| 10 | Notifications | ✅ in-app | ✅ bell + refetch 30 s | ❌ | Rappels non automatisés (cron manquant) |

---

## Améliorations conseillées

### Court terme (techniques rapides à clore)

- [ ] Supprimer `server.js` et `server_1.js` à la racine (reliquats non fonctionnels).
- [ ] Retirer la fuite `db_prefix` du `/health` après stabilisation du déploiement (commit `72f9dae`).
- [ ] Versionner les migrations Prisma (`backend/prisma/migrations/`) — actuellement git-ignorées.
- [ ] Remplacer `prisma db push --accept-data-loss` par `prisma migrate deploy` en production.
- [ ] Remplacer `confirm()` / `prompt()` natifs par des modales (UsersPage, PenaltiesPage).
- [ ] Valider aussi les query params (`history`, etc.) via Zod.

### Sécurité

- [ ] Migrer JWT vers cookie `httpOnly` + `SameSite=Strict` (XSS).
- [ ] Ajouter `helmet` et un rate limiter sur `/api/auth/login`.
- [ ] Logger structuré (pino) + corrélation par requête.
- [ ] Politique de mots de passe (complexité, reset par email).

### Fonctionnel

- [ ] Cron / scheduler pour `generate-reminders` (Render Cron Job ou GitHub Actions).
- [ ] Limite hebdomadaire de sessions par employé (`MODULES.md §4` mentionnait l'idée).
- [ ] Export CSV de l'historique (admin / coach).
- [ ] Recherche / filtre par nom d'employé sur la page Pénalités.
- [ ] Notifications email (en plus de l'in-app) — Resend / SendGrid.

### Qualité

- [ ] Tests unitaires Vitest / Jest sur la logique Solo/Duo et strikes.
- [ ] Tests d'intégration Supertest sur les endpoints réservations.
- [ ] Tests e2e Playwright sur les golden paths (login, réserver Duo, marquer présence).
- [ ] CI GitHub Actions : lint + test + build.
- [ ] Migrer le frontend en TypeScript (optionnel mais utile vu la surface API).

### Performance / scalabilité

- [ ] Pagination sur `GET /api/sessions` et `GET /api/users`.
- [ ] Index DB sur `Session.date`, `Reservation.userId`, `Notification.(userId, read)`.
- [ ] Cache HTTP `Cache-Control` sur les listes publiques peu volatiles.

---

## Décisions ouvertes

| Sujet | Statut |
|-------|--------|
| Inscription libre ou admin-only | ✅ **Admin-only** (pas de route `register` côté backend) |
| Limite max de sessions/semaine | ❌ pas implémentée |
| Canal des notifications | ✅ in-app uniquement |
| Hébergement interne Wiicode vs Render | ✅ Render (à valider pour la prod réelle) |
| Stratégie de stockage du JWT (localStorage vs cookie) | ⚠️ `localStorage` aujourd'hui, à rediscuter avant mise en prod externe |
