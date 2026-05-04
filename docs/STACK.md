# STACK.md — Choix techniques — App Coaching Wiicode

> Décisions techniques figées après phase de cadrage.
> Aucune installation effectuée à ce stade.

---

## 1. Stack complet

### Frontend — React + Vite + Tailwind CSS

| Outil | Rôle | Pourquoi |
|-------|------|----------|
| **React 18** | Framework UI | Le plus documenté, le plus demandé, communauté immense. Parfait pour un débutant qui veut trouver des réponses facilement. |
| **Vite** | Bundler / Dev server | Ultra-rapide, config quasi-nulle, remplace Create React App qui est abandonné. |
| **Tailwind CSS** | Style | Pas de CSS à écrire à la main. Classes utilitaires directement dans le JSX. Idéal pour aller vite sans se perdre. |
| **React Router v6** | Navigation | Standard de facto pour le routing côté client en React. Bien documenté. |
| **Axios** | Appels API | Plus lisible que fetch natif, gestion des erreurs et des headers simplifiée. |
| **React Query (TanStack)** | Gestion des données serveur | Gère le cache, le loading, les erreurs automatiquement. Évite de tout mettre dans useState. |
| **React Hook Form** | Formulaires | Léger, performant, validation simple. Parfait pour les formulaires de réservation et créneaux. |

---

### Backend — Node.js + Express + Prisma

| Outil | Rôle | Pourquoi |
|-------|------|----------|
| **Node.js** | Runtime | Même langage que le frontend (JavaScript). Un seul langage à maîtriser pour un débutant. |
| **Express.js** | Framework HTTP | Ultra-documenté, minimaliste, des milliers de tutoriels disponibles. |
| **Prisma** | ORM (accès base de données) | Génère les requêtes SQL automatiquement, typage fort, migrations intégrées. Bien meilleur qu'écrire du SQL brut pour un débutant. |
| **Zod** | Validation des données | Valide les données entrantes (body, params) avant qu'elles touchent la base. Simple et très lisible. |

---

### Base de données — PostgreSQL

**Pourquoi PostgreSQL et pas MySQL ou SQLite ?**

- Le cahier des charges le recommande explicitement (PostgreSQL ou MySQL).
- PostgreSQL gère mieux les contraintes complexes (unicité, clés étrangères) — exactement ce dont on a besoin pour éviter les doublons de réservation.
- SQLite est trop limité pour un projet en production.
- MySQL fonctionne aussi, mais PostgreSQL est plus robuste et mieux supporté par Prisma.

---

### Authentification — JWT (JSON Web Tokens) + bcrypt

| Outil | Rôle | Pourquoi |
|-------|------|----------|
| **bcrypt** | Hashage des mots de passe | Standard de l'industrie. Ne jamais stocker un mot de passe en clair. |
| **JWT** | Sessions / tokens | Stateless, simple à implémenter avec Express. Le token est stocké côté client (localStorage ou cookie httpOnly). |

> ⚠️ Note : pour une vraie prod, préférer les cookies `httpOnly` au `localStorage` pour stocker le JWT (plus sécurisé contre les attaques XSS). À décider lors de l'implémentation.

---

### Hébergement — Render (pour démarrer)

| Couche | Service | Pourquoi |
|--------|---------|----------|
| **Backend** | Render (Web Service) | Gratuit pour démarrer, déploiement depuis GitHub en quelques clics, supporte Node.js nativement. |
| **Base de données** | Render (PostgreSQL) | Base PostgreSQL managée incluse dans Render, pas de config serveur à faire. |
| **Frontend** | Vercel | Gratuit, déploiement automatique depuis GitHub, optimisé pour les apps React/Vite. |

> Pour une app interne (réseau Wiicode), l'hébergement peut changer — à valider avec le client (voir question 10 du cahier des charges).

---

## 2. Résumé visuel du stack

```
┌─────────────────────────────────────┐
│         FRONTEND (Vercel)           │
│  React 18 + Vite + Tailwind CSS     │
│  React Router · Axios · RQ · RHF   │
└──────────────────┬──────────────────┘
                   │ HTTP / JSON (REST API)
┌──────────────────▼──────────────────┐
│         BACKEND (Render)            │
│       Node.js + Express.js          │
│         Prisma ORM · Zod            │
│         JWT + bcrypt (Auth)         │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│      BASE DE DONNÉES (Render)       │
│           PostgreSQL                │
└─────────────────────────────────────┘
```

---

## 3. Structure des dossiers

```
coaching-app/
│
├── /frontend                        # App React
│   ├── /public
│   ├── /src
│   │   ├── /assets                  # Images, icônes
│   │   ├── /components              # Composants réutilisables (Button, Modal…)
│   │   ├── /pages                   # Pages (Dashboard, Planning, Login…)
│   │   ├── /layouts                 # Layouts partagés (Sidebar, Header…)
│   │   ├── /hooks                   # Hooks personnalisés (useAuth, useReservation…)
│   │   ├── /services                # Appels API (axios) par module
│   │   ├── /store                   # État global si besoin (Context API)
│   │   ├── /utils                   # Fonctions utilitaires (formatDate…)
│   │   ├── /routes                  # Définition des routes protégées
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── /backend                         # API Node.js + Express
│   ├── /src
│   │   ├── /routes                  # Définition des endpoints REST
│   │   │   ├── auth.routes.js
│   │   │   ├── users.routes.js
│   │   │   ├── sessions.routes.js
│   │   │   └── reservations.routes.js
│   │   ├── /controllers             # Logique métier par module
│   │   │   ├── auth.controller.js
│   │   │   ├── users.controller.js
│   │   │   ├── sessions.controller.js
│   │   │   └── reservations.controller.js
│   │   ├── /middlewares             # Auth JWT, gestion erreurs, validation
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── /validators              # Schémas Zod de validation
│   │   ├── /utils                   # Fonctions utilitaires (helpers, dates…)
│   │   └── app.js                   # Config Express centrale
│   ├── /prisma
│   │   ├── schema.prisma            # Schéma de base de données
│   │   └── /migrations              # Migrations générées par Prisma
│   ├── server.js                    # Point d'entrée
│   ├── .env                         # Variables d'environnement (NE PAS COMMITTER)
│   ├── .env.example                 # Modèle de variables (à committer)
│   └── package.json
│
├── /docs                            # Documentation du projet
│   ├── MODULES.md                   # (déjà fait)
│   ├── STACK.md                     # (ce fichier)
│   ├── API.md                       # Documentation des endpoints REST (à venir)
│   ├── SCHEMA.md                    # Schéma de BDD commenté (à venir)
│   └── QUESTIONS_CLIENT.md          # Questions en attente de réponse
│
├── .gitignore
└── README.md                        # Présentation du projet, instructions de démarrage
```

---

## 4. Variables d'environnement à prévoir (.env)

```env
# Base de données
DATABASE_URL="postgresql://user:password@host:5432/coaching_db"

# JWT
JWT_SECRET="une_clé_secrète_longue_et_aléatoire"
JWT_EXPIRES_IN="7d"

# Serveur
PORT=3000
NODE_ENV=development

# Frontend (Vite)
VITE_API_URL=http://localhost:3000
```

---

## 5. Versions cibles

| Outil | Version cible |
|-------|--------------|
| Node.js | 20 LTS |
| React | 18.x |
| Vite | 5.x |
| Express | 4.x |
| Prisma | 5.x |
| PostgreSQL | 16.x |
| Tailwind CSS | 3.x |

---

*Document de cadrage — validé avant démarrage du projet.*
