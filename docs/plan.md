# PLAN — Refonte Design V2

> Préparation à valider par Tito **avant** d'écrire la moindre ligne de code.
> Référence le prompt de cadrage et les 7 docs (`README/MODULES/STACK/ARCHITECTURE/API/SCHEMA/ROADMAP`).
> Aucun fichier autre que ce `plan.md` n'a été modifié à ce stade.

---

## 1. Inventaire de l'existant (frontend) — à toucher

### Pages (`frontend/src/pages/`)
| Fichier | Rôle | Phase |
|---------|------|-------|
| `LoginPage.jsx` | Connexion | 3 |
| `DashboardPage.jsx` | Wrapper qui choisit la vue par rôle | 4 |
| `PlanningPage.jsx` | Liste/calendrier des créneaux | 5 |
| `SessionDetailPage.jsx` | Détail d'une session, gestion présence | 5 |
| `HistoryPage.jsx` | Historique paginé avec filtres | 5 |
| `UsersPage.jsx` | CRUD utilisateurs (admin) | 5 |
| `PenaltiesPage.jsx` | Pénalités / strikes (admin) | 5 |
| `ProgramsPage.jsx` | Wrapper objectifs/programmes | 5 |

### Layout & routing
| Fichier | Action | Phase |
|---------|--------|-------|
| `App.jsx` | Wrap `<Outlet/>` dans `<AnimatePresence mode="wait">` | 2 |
| `main.jsx` | Ajouter `<ToastProvider>` autour de `<App/>` | 1 |
| `layouts/MainLayout.jsx` | Refonte sidebar/topbar/drawer mobile | 2 |
| `routes/ProtectedRoute.jsx` | Inchangé | — |
| `index.css` | `@font-face` + reset typo | 0 |
| `index.html` | Favicon + `<html lang="fr">` confirmé | 0 |

### Composants (`frontend/src/components/`)
| Fichier | Action | Phase |
|---------|--------|-------|
| `dashboard/EmployeeDashboard.jsx` | Refonte | 4.B |
| `dashboard/CoachDashboard.jsx` | Refonte | 4.B |
| `dashboard/AdminDashboard.jsx` | Refonte | 4.B |
| `history/EmployeeHistory.jsx` | Responsive cards/table | 5 |
| `history/CoachHistory.jsx` | Responsive | 5 |
| `history/AdminHistory.jsx` | Responsive | 5 |
| `programs/CoachPrograms.jsx` | Split-view | 5 |
| `programs/EmployeePrograms.jsx` | Split-view | 5 |
| `notifications/NotificationBell.jsx` | Refonte animée | 2 |

### Services & utils (intouchables sauf justification)
- `services/api.js` + 9 services ressource → **pas touche** sauf besoin d'un endpoint **existant** non appelé.
- `store/AuthContext.jsx` → pas touche.
- `utils/formatDate.js`, `utils/goals.js` → conservés.
- **Ajouts** : `utils/cn.js` (Phase 0), hook `useCountUp.js` (Phase 4.A), helper `useRelativeTime.js` si besoin (Phase 4.A).

### Endpoints exploitables sans toucher au back
Pour enrichir les dashboards :
- `GET /api/history?limit=200` pour le BarChart présence 3 mois employé.
- `GET /api/goals` pour les mini-cartes objectifs employé.
- `GET /api/history?from=...&to=...` pour le LineChart taux de remplissage coach 30 jours.

Aucun nouvel endpoint backend nécessaire.

---

## 2. Inventaire de `assets/`

| Fichier | Type | Détail | Usage proposé |
|---------|------|--------|---------------|
| `1.jpg` | JPEG progressive 7000×4667 | Paysage HD | Login hero candidat |
| `2.jpg` | JPEG progressive 6240×4160 | Paysage HD | Login hero candidat (recommandé desktop) |
| `3.jpg` | JPEG progressive 5760×3840 | Paysage HD | Ambient dashboard |
| `4.jpg` | JPEG progressive 3960×2640 | Paysage | Cover Programmes |
| `5.jpg` | JPEG progressive 5325×3550 | Paysage | Empty state (planning vide, historique vide) |
| `6.jpg` | JPEG progressive 5504×8256 | Portrait | Login hero mobile |
| `logo.png` | PNG RGBA 1291×368 | Logo wide | Sidebar + favicon (besoin d'une variante carrée, cf. Q3) |
| `Bricolage_Grotesque.zip` | Fonts | Variable + statiques (ExtraLight → ExtraBold, normal/condensé/semi-condensé, 24pt/36pt) | `font-body` |
| `Pogonia.zip` | Fonts | 9 graisses `.otf` + `.ttf` (Thin → Black) | `font-display` |
| `surgena-font.zip` | Font | **1 fichier** SemiBold `personalUseOnly` | `font-heading` — ⚠️ licence (cf. Q1) |

**Plan d'action assets (Phase 0)**
- Dézipper les 3 zips, **retenir seulement** :
  - Bricolage Grotesque : `Regular`, `Medium`, `SemiBold`, `Bold` (variantes 24pt-standard).
  - Pogonia : `Regular`, `SemiBold`, `Bold`.
  - Surgena : `SemiBold` (le seul disponible).
- Convertir tous les retenus en **`.woff2`** (réduction taille ~×4, support universel).
- Placer dans `frontend/public/fonts/` (un sous-dossier par famille).
- Optimiser les JPG : compression mozjpeg q=75 + variantes 1280px / 1920px → `frontend/public/images/{login,dashboard,programs,empty-states}/`.
- Logo : `frontend/public/brand/logo.png` + favicon dérivé (cf. Q3).

---

## 3. Questions ouvertes (à trancher avant Phase 0)

| # | Question | Pourquoi ça bloque | Proposition par défaut |
|---|----------|---------------------|------------------------|
| Q1 | **Licence Surgena** — le zip mentionne explicitement `personalUseOnly`. Wiicode l'utilise pour son app interne, à des fins commerciales (employés rémunérés) ? | Risque légal | Si non confirmé : remplacer `font-heading` par Bricolage SemiBold + tracking custom — visuellement très proche pour des headings courts |
| Q2 | **Affectation photos 1–6.jpg** : je n'ai que les dimensions, pas le contenu visuel | Choix hero login crucial | `6.jpg` (portrait) → hero login mobile ; `2.jpg` (paysage HD) → hero login desktop ; `4.jpg` → cover Programmes ; `5.jpg` → empty states ; `3.jpg` → ambient dashboard ; `1.jpg` → roue de secours |
| Q3 | **Favicon** : le `logo.png` est en format wide (1291×368), pas adapté à un favicon carré | Bloque le favicon | Soit Tito fournit une version carrée (recommandé), soit je crée un favicon 32×32 minimaliste à partir d'un détail du logo |
| Q4 | **Tagline hero login** exacte ? | Texte placeholder sinon | « Coachez votre équipe. Restez en mouvement. » |
| Q5 | **`canvas-confetti`** pour la complétion d'objectif ? Package léger (~6 ko) | À approuver | OFF par défaut, ajouté en Phase 7 sur feu vert |
| Q6 | **Mode sombre** dans le scope V2 ? | Change la structure de palette Tailwind | NON pour V2 — design system "dual-ready" (tokens), pas de toggle exposé |
| Q7 | **Illustrations empty state** dédiées (SVG line art) ? Pas d'illu vectorielle dans les assets | Pour des `EmptyState` propres | Fallback : photo `5.jpg` blur teal-tintée + icône Lucide en surimpression. Si Tito a mieux : volontiers |
| Q8 | **Analytics / event tracking** sur les nouvelles interactions ? | Pour mesurer la V2 | Hors scope V2 |

> Je commence la Phase 0 dès que tu valides ces 8 points (ou que tu confirmes globalement les propositions par défaut).

---

## 4. Plan en phases

> Chaque phase = 1 commit (sauf Phase 0 et Phase 4 = 2 commits). Récap à la fin de chaque phase au §7.

### Phase 0 — Fondations (2 commits)

**Commit A `chore(deps): install design dependencies`**
- `cd frontend && npm install framer-motion lucide-react recharts clsx tailwind-merge`
- `npm install -D @types/node`

**Commit B `feat(design): foundations (palette, fonts, tokens)`**
- Extraction + sélection + conversion woff2 des polices → `frontend/public/fonts/`
- Optimisation + placement des images → `frontend/public/images/...`
- Logo + favicon → `frontend/public/brand/`
- `tailwind.config.js` complet :
  - palette `primary` 50→900, `accent` 50→900, `ink` 50/200/500/700/900, sémantique `success/warning/danger/info`-500
  - `fontFamily.display = Pogonia`, `heading = Surgena`, `body = Bricolage Grotesque`
  - `fontSize` tokens : `display-xl/lg`, `h1/2/3`, `body-lg/body/caption` avec line-height + tracking
  - `boxShadow` : `soft / card / elevated / glow`
  - `keyframes` + `animation` : `shake`, `pulse-soft`, `shimmer`, `fade-in-up`
- `index.css` : `@font-face` (avec `font-display: swap`) + reset typo (body en Bricolage, headings en Surgena, hero en Pogonia)
- `index.html` : favicon + `<html lang="fr">`
- `frontend/src/utils/cn.js` (helper `clsx + twMerge`)
- `frontend/src/components/ui/` créé (vide, rempli en Phase 1)

### Phase 1 — Primitives UI (1 commit `feat(design): ui primitives`)

Création de `frontend/src/components/ui/` :
- `Button.jsx` — variantes `primary | accent | ghost | danger | outline`, tailles `sm | md | lg`, état `loading`, hover/tap Framer Motion
- `Card.jsx` — `interactive` toggle (hover lift)
- `Input.jsx`, `Textarea.jsx`, `Select.jsx` — focus ring teal, état erreur danger-500
- `Badge.jsx` — `success | warning | danger | info | neutral | accent`
- `Avatar.jsx` — initiales sur fond `primary-100`/texte `primary-700`
- `Modal.jsx` — backdrop fade + content scale, ferme sur ESC / clic backdrop / bouton croix
- `Skeleton.jsx` — shimmer
- `Toast.jsx` + `ToastProvider` (wrappé dans `main.jsx`)
- `EmptyState.jsx`
- `Tooltip.jsx`
- JSDoc minimal + `displayName` pour devtools

### Phase 2 — Layout & Navigation (1 commit `feat(design): layout + nav`)

- Refonte `MainLayout.jsx` :
  - Sidebar desktop ≥1024px : 264px, dégradé `from-primary-800 to-primary-900`, items avec icônes Lucide + barre `accent` à gauche pour l'actif
  - Topbar mobile <1024px : header sticky 64px, hamburger → drawer Framer Motion (slide gauche + backdrop blur)
  - Breadcrumb desktop (caption + chevron)
  - Page transitions via `<AnimatePresence mode="wait">` + `motion.div` (fade + translate-y 8px, 250ms)
- Refonte `NotificationBell.jsx` (cloche Lucide, badge `accent` `animate-pulse-soft` si unread, dropdown panel animé)

### Phase 3 — Login (1 commit `feat(design): login`)

- `LoginPage.jsx` refonte complète :
  - Split desktop 50/50 (image teal-overlay à gauche, formulaire à droite max-w-440)
  - Mobile : hero 240px + formulaire dessous
  - Stagger 100ms : logo → titre → email → password → bouton → footer
  - Erreur en card rouge + anim `shake`

### Phase 4 — Dashboard (2 commits)

**Commit A `feat(design): dashboard primitives`**
- `components/dashboard/StatCard.jsx` (avec `<CountUp/>`)
- `components/dashboard/ChartCard.jsx`
- `components/dashboard/ActivityFeed.jsx`
- `components/dashboard/UpcomingSessionCard.jsx`
- `components/dashboard/Countdown.jsx`
- `hooks/useCountUp.js`

**Commit B `feat(design): dashboards (employee/coach/admin)`**
- `EmployeeDashboard.jsx` : hero, 4 StatCards, Prochaine session (countdown), 5 sessions, BarChart présence 3 mois, mini objectifs actifs
- `CoachDashboard.jsx` : hero, 4 StatCards, sessions du jour avec participants, LineChart fillRate 30j, sessions à attention, Donut Solo/Duo
- `AdminDashboard.jsx` : hero, 4 StatCards, AreaChart activité 30j, Donut rôles, BarChart top 5, 5 sessions récentes, encart alertes
- Tooltips recharts custom (composant React partagé)

### Phase 5 — Pages secondaires (1 commit `feat(design): secondary pages`)

- `PlanningPage` : vue calendrier hebdo desktop / liste mobile, FAB création (coach/admin)
- `SessionDetailPage` : header large + stagger sections
- `HistoryPage` : table desktop / cards mobile, filtres sticky, pagination animée + StatCards employé
- `UsersPage` : search bar client, modale édition + modale désactivation (remplace `confirm()`)
- `PenaltiesPage` : cards strikes avec 3 dots, modales strike/déblocage (remplace `confirm()` + `prompt()`)
- `ProgramsPage` : split-view desktop (liste/détail) + crossfade au switch ; stack mobile

### Phase 6 — Responsive QA & polish (1 commit `chore(design): qa responsive & a11y`)

- Tests manuels 375 / 768 / 1440 sur les 8 pages
- `EmptyState` sur chaque liste vide
- `Skeleton` sur chaque query React Query
- Focus visible préservé (`focus-visible:`)
- Lighthouse > 90 sur Performance / Accessibility / Best Practices (mobile)
- Vercel preview à valider en condition réelle

### Phase 7 — Animations globales & micro-interactions (1 commit `feat(design): polish & motion`)

- Stagger d'entrée 50ms sur listes principales
- Count-up sur tous les chiffres clés
- Progress bars width animées (objectifs, fillRate)
- `Toast` aux actions clés (réservation OK/KO, annulation, présence marquée, etc.)
- `canvas-confetti` si Q5 = oui (complétion d'objectif uniquement)
- Audit final : aucun écran blanc, focus visible partout, contrastes AA

---

## 5. Checklist de non-régression (à rejouer après chaque phase)

### Employé (`employe@wiicode.fr` / `Wiicode-Employe-Coaching-2025!`)
- [ ] Login OK
- [ ] Dashboard : stats + prochaines sessions visibles
- [ ] Réserver une session Solo libre
- [ ] Réserver une session Duo (WAITING → CONFIRMED quand partenaire arrive)
- [ ] Annuler une réservation future
- [ ] Historique : filtres type/présence/dates fonctionnent
- [ ] Cloche : notifications affichées, badge unread, "marquer tout lu"
- [ ] Voir objectifs et programmes, ajouter un suivi de progression

### Coach (`coach@wiicode.fr` / `Wiicode-Coach-Coaching-2025!`)
- [ ] Login OK
- [ ] Créer un créneau SOLO et un DUO
- [ ] Modifier un créneau futur (non verrouillé)
- [ ] Supprimer un créneau sans réservation, tentative bloquée avec réservation active
- [ ] Marquer présence : PRESENT, ABSENT, CANCELLED
- [ ] Dashboard coach : todaySessions, fillRate, needsAttention
- [ ] Créer objectif + programme pour un employé, ajouter un ProgressLog

### Admin (`admin@wiicode.fr` / `Wiicode-Admin-Coaching-2025!`)
- [ ] Login OK
- [ ] CRUD utilisateurs : créer, modifier, désactiver (logique `isActive=false`)
- [ ] Pénalités : strike manuel, déblocage manuel
- [ ] `POST /api/notifications/generate-reminders` (bouton à exposer dans Phase 5)
- [ ] Dashboard admin : stats globales, donut rôles, area 30j, top 5

### Transverse
- [ ] CORS / proxy OK en local Docker (front 5173 → back 3000)
- [ ] Vercel preview build passe (Phase 6)
- [ ] Aucun scroll horizontal en 375px sur aucune page
- [ ] Lighthouse mobile > 90 (Perf / A11y / Best Practices)

---

## 6. Notes d'implémentation transversales

- **Composants < 250 lignes** : si un dashboard dépasse, on découpe par section
- **JSDoc** systématique sur les primitives `ui/`
- **Sémantique HTML** : `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`
- **a11y** : `aria-label` sur boutons icône, `alt` non vide pour images informatives, `focus-visible` partout
- **`cn(...)`** exclusivement (jamais de string concat)
- **Framer Motion** : import nominatif (`motion`, `AnimatePresence`, `useReducedMotion`) ; respecter `prefers-reduced-motion`
- **Recharts** : `import { LineChart, ... } from 'recharts'`, lazy-load si bundle > 300 ko après build (à mesurer Phase 6)
- **JWT en localStorage** : inchangé pour V2 (cf. `ROADMAP.md` pour la suite)
- **Backend & API** : interdit de toucher

---

## 7. Récapitulatifs de fin de phase

> À compléter au fil de l'avancement.

- ✅ Phase 0 — done (commits `1b3989b` deps + `<this>` foundations) — fonts woff2 (Bricolage 4 graisses, Pogonia 3 graisses) ; images JPG optimisées 75-80% ; favicon généré depuis logo ; `tailwind.config.js` (palette primary/accent 50→900, ink, sémantique, shadows, keyframes shake/pulse-soft/shimmer/fade-in-up) ; `index.css` (@font-face + reset typo + prefers-reduced-motion) ; `utils/cn.js`. **Note Q1** : Surgena mis en attente, `font-heading` retombe sur Bricolage SemiBold via `font-weight: 600`.
- ✅ Phase 1 — done — 13 primitives dans `frontend/src/components/ui/` : Spinner, Button (5 variantes × 3 tailles, loading, hover/tap motion), Card (interactive lift), Input/Textarea/Select (label + erreur + hint, forwardRef compat RHF), Badge (7 variantes), Avatar (initiales + image, 5 tailles), Modal (portal + ESC + scroll lock + AnimatePresence), Skeleton (shimmer teal/amber), Tooltip (delay 300 ms), EmptyState (image overlay teal + icon fallback), Toast + ToastProvider (4 variantes, slide-in droite, auto-dismiss 4 s). Barrel `index.js`. ToastProvider wrappé dans `main.jsx`. Bundle gzip JS 160 ko (à optimiser en Phase 6).
- ✅ Phase 2 — done — Refonte `MainLayout` : sidebar desktop 264px gradient teal (logo blanchi, items Lucide, indicateur actif animé via `layoutId`, footer avatar/rôle/logout), drawer mobile slide-in spring + backdrop blur, topbar mobile sticky (hamburger / logo / bell / avatar), topbar desktop avec breadcrumb dynamique + bell, page transitions `<AnimatePresence mode="wait">` (fade + translate-y 8px, 250 ms). `NotificationBell` refondu (icône Lucide, badge `accent` pulse-soft, dropdown spring scale-in, marqueur non-lus ambre, types mappés sur icônes Lucide, support `tone="light|dark"`). Bundle gzip JS 162 ko.
- ✅ Phase 3 — done — Refonte `LoginPage` : split desktop 50/50 (hero `2.jpg` 1920px avec overlay teal `mix-blend-multiply` + gradient ambre subtil, tagline « Coachez votre équipe. Restez en mouvement. » Pogonia), mobile hero compact 240px (image portrait `6.jpg` via `<picture>` responsive) + form en dessous. Stagger Framer Motion 80 ms (logo → titre → email → password → erreur → bouton → footer). Champs `Input` avec icônes Lucide (Mail/Lock). Bouton `Button variant="primary" size="lg"` avec loading. Erreur en card rouge avec `animate-shake`. Footer caption « Wiicode · YYYY ». Respect `prefers-reduced-motion`.
- ✅ Phase 4 — done (2 commits) — **Commit A** primitives : `StatCard` (count-up Framer Motion, 7 tones, trend pill), `ChartCard` (header + body + footer), `ChartTooltip` (recharts shared, fond surface, dots accent), `Countdown` (j/h/min, refresh 30 s), `UpcomingSessionCard` (date pastille + badges + avatars empilés), `ActivityFeed` (timeline stagger, formatRelative), hook `useCountUp` (reduced-motion aware). **Commit B** dashboards : `EmployeeDashboard` (4 stats + hero session teal/Countdown + 5 prochaines + BarChart présence 3 mois + bloc objectifs actifs), `CoachDashboard` (4 stats + today sessions + alertes + AreaChart fillRate 30 j + donut Solo/Duo + grille fillRate), `AdminDashboard` (4 stats + AreaChart 30 j sessions/réservations + donut rôles + barres horizontales top 5 employés + alertes blocages + tableau récents), `DashboardPage` hero Pogonia + Skeleton loading. Bundle gzip JS 288 ko (recharts → lazy-load Phase 6).
- ✅ Phase 5 — done — Refonte des 6 pages secondaires. `PlanningPage` (calendrier hebdo desktop 7 colonnes avec prev/next/aujourd'hui + tiles colorées Solo teal / Duo accent + barre de fill, vue liste mobile groupée par jour avec CTA Réserver/Rejoindre, filtres type en chips, toggle Semaine/Liste, FAB création mobile, modale `CreateSessionModal`). `SessionDetailPage` (hero teal Pogonia + Countdown + badges, Duo status banner, participants avec select présence, modale confirmation suppression). `HistoryPage` (filter bar sticky + Select primitives, pagination animée slide, 3 sous-composants role-aware : Employee StatCards + table desktop / cards mobile, Coach cards groupées, Admin cards avec filtre coach inline). `UsersPage` (search bar, table desktop + cards mobile, badges rôles, modale `UserFormModal` create, modale confirmation désactivation). `PenaltiesPage` (3 StatCards + sections Comptes suspendus / Avertissements, cards rows avec dots strikes visuels, modale `StrikeModal` avec raison Textarea, modale confirmation déblocage). `ProgramsPage` (tabs Objectifs/Programmes, split-view 5/7 desktop avec AnimatePresence crossfade au changement de sélection, list mobile, formulaires en modales pour coach, progress bar gradient ambre pour employé, suppression via modale confirmation). Tous les `confirm()`/`prompt()` natifs remplacés. Toasts intégrés sur toutes les actions clés. Sticky topbar desktop respecté (`lg:top-14`).
- ✅ Phase 6 — done — Code-splitting & polish. Toutes les pages (sauf `LoginPage` qui doit être instantanée) sont en `React.lazy` + `<Suspense fallback={<RouteFallback />}>` ; `RouteFallback` est un écran Skeleton aligné sur le padding des pages. `vite.config.js` configure des `manualChunks` (react-vendor 157 ko, query-vendor 92 ko, motion-vendor 134 ko, chart-vendor 400 ko, icons-vendor 18 ko, form-vendor 25 ko). Bundle initial login passe de 983 ko monolithe à **~487 ko / 155 ko gzip**, `recharts` (400 ko / 116 ko gzip) chargé uniquement à l'arrivée sur Dashboard. Chaque page = chunk 6-26 ko. Fix sticky filter bar `HistoryPage` (`top-16 lg:top-14` pour ne pas chevaucher le topbar mobile 64 px ni le breadcrumb desktop 56 px).
- ✅ Phase 7 — done — Polish final : `ScrollToTop` monté à la racine du `BrowserRouter` (remonte en haut sur chaque changement de route, ignore les liens d'ancre `#`). Toast d'accueil à la connexion (« Bienvenue, Prénom — Bonne séance ») et toast info à la déconnexion (« À bientôt »). Stagger Framer Motion ajouté aux deux tableaux restants (UsersPage desktop, AdminDashboard sessions récentes) avec `motion.tbody` + `motion.tr` et `useReducedMotion`. Audit grep : zéro `console.log`/`confirm`/`prompt`/`alert` dans le code. **Q5** (canvas-confetti) reste OFF par défaut — paquet non ajouté ; si Tito confirme, déclencher au passage d'un objectif en `COMPLETED` côté `goalsService.updateStatus` success.

---

## 8. Prochaine action

**J'attends ton feu vert.**

- « go phase 0 » si toutes les questions ouvertes (§3) sont OK avec mes propositions par défaut
- sinon, réponses point par point sur Q1 → Q8 ; je mets `plan.md` à jour avant de démarrer
