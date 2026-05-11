# Coaching App — Wiicode

Application web interne de gestion des sessions de coaching sportif.
Le coach crée des créneaux, les employés réservent, l'admin supervise.

---

## Fonctionnalités implémentées

- Authentification JWT avec 3 rôles : `ADMIN` / `COACH` / `EMPLOYEE`
- CRUD utilisateurs (admin) avec désactivation logique (`isActive`)
- CRUD créneaux (coach / admin), verrouillage des créneaux passés, protection à la suppression
- Réservation / annulation de sessions par les employés
- Gestion stricte Solo (1 place) et Duo (2 places, file d'attente d'un partenaire)
- Marquage de présence post-session par le coach (PRESENT / ABSENT / CANCELLED)
- Dashboards adaptés par rôle (employé, coach, admin)
- Historique paginé avec filtres (type, présence, dates)
- Pénalités automatiques : +1 strike par absence non justifiée, suspension de 7 jours à 3 strikes, déblocage manuel admin
- Objectifs sportifs + programmes assignés par le coach, avec journal de progression
- Notifications in-app (réservation, partenaire Duo, rappel, strike, déblocage)

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Routing | React Router v6 |
| Data fetching | Axios + TanStack React Query 5 |
| Formulaires | React Hook Form |
| Backend | Node.js 20 + Express 4 |
| ORM | Prisma 5 (`@prisma/client`) |
| Validation | Zod |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Base de données | PostgreSQL 16 |
| Hébergement | Render (API + DB) + Vercel (front) |

---

## Prérequis

- [Node.js 20 LTS](https://nodejs.org/)
- [PostgreSQL 16](https://www.postgresql.org/) (local ou distant)
- npm, Git

---

## Installation

```bash
git clone <repo>
cd coaching-app-wiicode

# Backend
cd backend
cp .env.example .env       # éditer DATABASE_URL et JWT_SECRET
npm install
npx prisma migrate dev     # crée les tables
node prisma/seed.js        # comptes de test (admin / coach / employé)

# Frontend (dans un autre terminal)
cd ../frontend
cp .env.example .env       # VITE_API_URL=http://localhost:3000
npm install
```

---

## Lancer en développement

```bash
# Backend → http://localhost:3000
cd backend && npm run dev

# Frontend → http://localhost:5173
cd frontend && npm run dev
```

Le frontend Vite proxifie `/api` vers `http://localhost:3000` (cf. `vite.config.js`).
Health check : `GET /health`.

---

## Comptes de seed

| Rôle | Email | Mot de passe par défaut | Override env (production) |
|------|-------|-------------------------|----------------------------|
| Admin | `admin@wiicode.fr` | `Wiicode-Admin-Coaching-2025!` | `SEED_ADMIN_PASSWORD` |
| Coach | `coach@wiicode.fr` | `Wiicode-Coach-Coaching-2025!` | `SEED_COACH_PASSWORD` |
| Employé | `employe@wiicode.fr` | `Wiicode-Employe-Coaching-2025!` | `SEED_EMPLOYEE_PASSWORD` |

> Comptes démo additionnels (seed étendu) : `sarah.coach@wiicode.fr`, `antoine.coach@wiicode.fr` + 12 employés `<prenom>.<nom>@wiicode.fr` — tous avec `demo@1234` (override `SEED_DEMO_PASSWORD`).
> Les overrides sont lus à la **première** exécution du seed (DB vide). Renseigner les env vars **avant** le premier déploiement pour ne pas exposer les mots de passe par défaut.

---

## Déploiement Docker (serveur self-hosted derrière nginx)

### 1. Préparer le fichier `.env` sur le serveur

```bash
cp .env.production.example .env
# Édite .env, remplace les <…> par tes vraies valeurs
nano .env
```

Génère `JWT_SECRET` avec `openssl rand -hex 64`. Idem pour `POSTGRES_PASSWORD` et chaque `SEED_*_PASSWORD`.

### 2. Lancer la stack

```bash
docker compose up -d --build
docker compose logs -f backend   # vérifier que le seed a tourné avec les bons mots de passe
```

### 3. Configurer nginx (snippet d'exemple)

Le compose expose les ports applicatifs sur **127.0.0.1** uniquement (`BIND_IP=127.0.0.1`). nginx reverse-proxy depuis le port HTTPS public.

```nginx
server {
    listen 443 ssl http2;
    server_name coaching.tondomaine.fr;

    ssl_certificate     /etc/letsencrypt/live/coaching.tondomaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coaching.tondomaine.fr/privkey.pem;

    client_max_body_size 5M;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name coaching.tondomaine.fr;
    return 301 https://$host$request_uri;
}
```

Recharger nginx (`sudo nginx -t && sudo systemctl reload nginx`). Le navigateur attaque `https://coaching.tondomaine.fr` → nginx terminate TLS → reverse-proxy vers `127.0.0.1:5173` (container frontend) → nginx interne forward `/api/*` vers `backend:3000`.

### 4. Vérifications post-déploiement

- `curl https://coaching.tondomaine.fr/` → 200, sert `index.html`
- `curl https://coaching.tondomaine.fr/api/health` → `{"status":"ok","db_set":true,…}`
- Login admin avec le mot de passe de `SEED_ADMIN_PASSWORD` → token retourné

### 5. Backups DB

Cron quotidien minimal (à coller dans `/etc/cron.d/coaching-pgdump`) :

```cron
0 3 * * * root docker exec coaching-db pg_dump -U coaching coaching_db | gzip > /var/backups/coaching/coaching_$(date +\%Y\%m\%d).sql.gz
```

Crée d'abord `mkdir -p /var/backups/coaching && chown root:root /var/backups/coaching && chmod 700 /var/backups/coaching`. Penser à exporter régulièrement hors-serveur (rsync vers un autre host, ou rclone vers un bucket S3-compatible).

### 6. Mises à jour

```bash
cd ~/coaching-app-wiicode
git pull
docker compose up -d --build
```

Le seed ne se ré-exécute pas (DB déjà peuplée), aucune perte de données. Les migrations Prisma futures s'appliqueront via `prisma db push` au démarrage du backend.

> ⚠️ **Avant de pull une version qui modifie `prisma/schema.prisma`**, fais un backup `pg_dump` au préalable — `db push` peut détruire des colonnes.

---

## Structure des dossiers (état réel)

```
coaching-app-wiicode/
├── backend/
│   ├── src/
│   │   ├── app.js                  Config Express + montage des routes
│   │   ├── routes/                 10 fichiers de routes (auth, users, sessions, …)
│   │   ├── controllers/            Logique métier par module
│   │   ├── middlewares/            auth, role, error
│   │   ├── validators/             Schémas Zod
│   │   └── utils/                  jwt, notify, penalties
│   ├── prisma/
│   │   ├── schema.prisma           7 modèles + 7 enums
│   │   ├── seed.js                 Comptes admin/coach/employé + 1 session
│   │   └── seed-test-session.js    Session passée pour tester l'attendance
│   ├── server.js                   Point d'entrée
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 Routes React Router
│   │   ├── main.jsx                Bootstrap + QueryClient
│   │   ├── pages/                  8 pages (Login, Dashboard, Planning, …)
│   │   ├── components/             dashboard/, history/, programs/, notifications/
│   │   ├── layouts/MainLayout.jsx  Sidebar + Outlet
│   │   ├── routes/ProtectedRoute   Garde de routes par rôle
│   │   ├── services/               9 services API (axios)
│   │   ├── store/AuthContext.jsx   Auth globale + token localStorage
│   │   └── utils/                  formatDate, libellés goals
│   ├── index.html
│   ├── vite.config.js              proxy /api → :3000
│   ├── tailwind.config.js
│   ├── vercel.json                 SPA rewrite
│   └── .env.example
│
├── docs/
│   ├── README.md                   (ce fichier)
│   ├── MODULES.md                  Découpage fonctionnel
│   ├── STACK.md                    Choix techniques justifiés
│   ├── ARCHITECTURE.md             Flux, conventions, sécurité
│   ├── API.md                      Référence des endpoints REST
│   ├── SCHEMA.md                   Schéma BDD commenté
│   └── ROADMAP.md                  Avancement par module
│
├── README.md
├── server.js                       Reliquat — ne pas exécuter (cf. note)
└── server_1.js                     Reliquat — ne pas exécuter (cf. note)
```

> ⚠️ Les fichiers `server.js` et `server_1.js` à la racine sont des copies anciennes (`require('./src/app')` relatif à la racine — chemin invalide). Ils ne servent pas. L'entrée réelle est `backend/server.js`.

---

## Documentation

| Fichier | Contenu |
|---------|---------|
| [MODULES.md](MODULES.md) | Découpage fonctionnel des 10 modules |
| [STACK.md](STACK.md) | Justification des choix techniques |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture, flux d'authentification, conventions |
| [API.md](API.md) | Référence complète des endpoints REST |
| [SCHEMA.md](SCHEMA.md) | Modèle de données Prisma commenté |
| [ROADMAP.md](ROADMAP.md) | Avancement par module |

---

## Statut

> 🟢 MVP fonctionnel — les 10 modules sont implémentés en backend et frontend.
> Les migrations Prisma ne sont **pas** versionnées (`.gitignore` : `backend/prisma/migrations/`) — `prisma migrate dev` les régénère localement à partir du `schema.prisma`.
