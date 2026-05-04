# Coaching App — Wiicode

Application web interne de gestion des sessions de coaching sportif.
Permet au coach de créer des créneaux, aux employés de réserver des sessions,
et à l'admin de superviser l'ensemble de l'activité.

---

## Fonctionnalités clés

- Authentification avec gestion des rôles (admin / coach / employé)
- Création et gestion des créneaux par le coach (CRUD)
- Réservation et annulation de sessions par les employés
- Gestion stricte des types Solo et Duo (capacité, logique d'attente)
- Dashboard adapté par rôle (planning, historique, stats)
- Historique des sessions avec statuts de présence
- Système de pénalités pour absences non justifiées *(niveau 2)*
- Suivi des objectifs et programmes sportifs *(niveau 2)*

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | React Router v6 |
| Appels API | Axios + React Query (TanStack) |
| Formulaires | React Hook Form |
| Backend | Node.js 20 + Express 4 |
| ORM | Prisma 5 |
| Validation | Zod |
| Auth | JWT + bcrypt |
| Base de données | PostgreSQL 16 |
| Hébergement | Render (back + DB) + Vercel (front) |

---

## Prérequis

- [Node.js 20 LTS](https://nodejs.org/) installé sur la machine
- [npm](https://www.npmjs.com/) (inclus avec Node.js)
- [PostgreSQL 16](https://www.postgresql.org/) installé localement (ou accès à une instance distante)
- Un éditeur de code (VS Code recommandé)
- Git

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/wiicode/coaching-app.git
cd coaching-app
```

### 2. Installer les dépendances backend

```bash
cd backend
npm install
```

### 3. Configurer les variables d'environnement backend

```bash
cp .env.example .env
# Éditer .env avec tes valeurs (DATABASE_URL, JWT_SECRET…)
```

### 4. Initialiser la base de données

```bash
npx prisma migrate dev
npx prisma db seed   # optionnel : données de test
```

### 5. Installer les dépendances frontend

```bash
cd ../frontend
npm install
```

### 6. Configurer les variables d'environnement frontend

```bash
cp .env.example .env
# Éditer VITE_API_URL avec l'URL du backend
```

---

## Lancer le projet en développement

### Backend

```bash
cd backend
npm run dev
# Écoute sur http://localhost:3000
```

### Frontend

```bash
cd frontend
npm run dev
# Écoute sur http://localhost:5173
```

---

## Structure des dossiers

```
coaching-app/
│
├── /frontend
│   └── /src
│       ├── /assets
│       ├── /components
│       ├── /pages
│       ├── /layouts
│       ├── /hooks
│       ├── /services
│       ├── /store
│       ├── /utils
│       └── /routes
│
├── /backend
│   ├── /src
│   │   ├── /routes
│   │   ├── /controllers
│   │   ├── /middlewares
│   │   ├── /validators
│   │   └── /utils
│   └── /prisma
│       ├── schema.prisma
│       └── /migrations
│
├── /docs
│   ├── MODULES.md
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── API.md          ← à venir
│
├── .gitignore
└── README.md
```

---

## Documentation

| Fichier | Contenu |
|---------|---------|
| [docs/MODULES.md](docs/MODULES.md) | Découpage fonctionnel, dépendances, priorités |
| [docs/STACK.md](docs/STACK.md) | Choix techniques justifiés |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Flux de données, conventions de code |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Avancement par module, checklists |

---

## Statut

> 🟡 En cours de cadrage — aucun code applicatif produit à ce stade.
