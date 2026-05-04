# MODULES.md — Application Coaching Wiicode

> Découpage fonctionnel du projet en modules indépendants.
> Généré en phase de cadrage — aucun code produit à ce stade.

---

## Vue d'ensemble

| # | Module | Priorité | Dépend de |
|---|--------|----------|-----------|
| 1 | Auth | CRITIQUE | — |
| 2 | Utilisateurs | CRITIQUE | Auth |
| 3 | Créneaux | CRITIQUE | Auth, Utilisateurs |
| 4 | Réservations | CRITIQUE | Auth, Utilisateurs, Créneaux |
| 5 | Gestion Solo/Duo | CRITIQUE | Réservations |
| 6 | Dashboard | IMPORTANT | Réservations, Créneaux |
| 7 | Historique | IMPORTANT | Réservations |
| 8 | Pénalités | OPTIONNEL | Historique, Utilisateurs |
| 9 | Objectifs & Programmes | OPTIONNEL | Utilisateurs |
| 10 | Notifications | OPTIONNEL | Réservations, Auth |

---

## Détail des modules

---

### Module 1 — Auth
**Priorité : 🔴 CRITIQUE**

Gère l'authentification des utilisateurs : connexion, gestion de session, et attribution des rôles (admin / coach / employé). C'est le socle de l'application — rien ne fonctionne sans lui.

- **Fonctionnalités :**
  - Connexion (email + mot de passe)
  - Gestion des rôles (admin / coach / employé)
  - Protection des routes selon le rôle
  - Inscription (à décider : libre ou admin-only — voir questions client)

- **Dépendances :** aucune

---

### Module 2 — Utilisateurs
**Priorité : 🔴 CRITIQUE**

Gestion des comptes utilisateurs : création, consultation, modification. L'admin peut créer des comptes et gérer les rôles. Ce module expose les données de base nécessaires aux autres modules.

- **Fonctionnalités :**
  - CRUD des comptes utilisateurs (admin)
  - Consultation du profil (tous rôles)
  - Attribution / modification des rôles

- **Dépendances :** Auth

---

### Module 3 — Créneaux
**Priorité : 🔴 CRITIQUE**

Permet au coach de créer et gérer les créneaux d'entraînement. C'est le module central côté coach — sans créneaux, rien à réserver.

- **Fonctionnalités :**
  - Créer un créneau (date, heure, durée, type, capacité)
  - Modifier un créneau (si non passé)
  - Supprimer un créneau (avec règles de protection)
  - Verrouillage automatique des créneaux passés
  - Consultation des créneaux (tous rôles)

- **Dépendances :** Auth, Utilisateurs

---

### Module 4 — Réservations
**Priorité : 🔴 CRITIQUE**

Permet aux employés de réserver et annuler des créneaux, avec toutes les règles métier associées. C'est le module central côté employé.

- **Fonctionnalités :**
  - Voir les créneaux disponibles
  - Réserver un créneau
  - Annuler une réservation
  - Contrôles métier :
    - pas de réservation sur créneau complet
    - pas de double réservation simultanée
    - pas de réservation dans le passé
    - limite max de sessions par semaine (valeur à définir)

- **Dépendances :** Auth, Utilisateurs, Créneaux

---

### Module 5 — Gestion Solo / Duo
**Priorité : 🔴 CRITIQUE**

Couche métier spécifique aux types de sessions Solo et Duo. Étroitement lié au module Réservations mais suffisamment complexe pour être isolé.

- **Fonctionnalités :**
  - Solo : réservation directe, 1 seule place
  - Duo : 2 places max
    - réserver seul → en attente d'un second participant
    - réserver à deux directement (option avancée — à clarifier)
    - blocage si 1 seule place restante en mode Duo

- **Dépendances :** Réservations

---

### Module 6 — Dashboard
**Priorité : 🟡 IMPORTANT**

Tableau de bord adapté à chaque rôle. Agrège les données des autres modules pour offrir une vue synthétique à chaque type d'utilisateur.

- **Fonctionnalités :**
  - Dashboard Employé : prochaines sessions, historique, compteur de sessions
  - Dashboard Coach : planning du jour, taux de remplissage, liste des participants
  - Dashboard Admin : stats globales, utilisateurs actifs (optionnel)

- **Dépendances :** Réservations, Créneaux

---

### Module 7 — Historique
**Priorité : 🟡 IMPORTANT**

Stocke et affiche l'historique des sessions passées pour chaque utilisateur, avec les statuts de présence. Base nécessaire au module Pénalités.

- **Fonctionnalités :**
  - Liste des sessions passées par utilisateur
  - Statuts : présent / absent / annulé
  - Saisie du statut par le coach après la session

- **Dépendances :** Réservations

---

### Module 8 — Pénalités *(Niveau 2)*
**Priorité : 🟢 OPTIONNEL**

Système de strikes pour les absences non justifiées. Déclenche un blocage temporaire après un certain nombre d'absences. Nécessite que le module Historique soit opérationnel.

- **Fonctionnalités :**
  - Enregistrement automatique d'un strike en cas d'absence non justifiée
  - Compteur de strikes par utilisateur
  - Blocage temporaire après X strikes (valeur à définir)
  - Déblocage manuel par l'admin

- **Dépendances :** Historique, Utilisateurs

---

### Module 9 — Objectifs & Programmes *(Niveau 2)*
**Priorité : 🟢 OPTIONNEL**

Permet au coach d'assigner des objectifs sportifs et des programmes personnalisés aux employés. Les employés peuvent consulter leur progression.

- **Fonctionnalités :**
  - Assignation d'un objectif par le coach (perte de poids, cardio, prise de masse)
  - Association d'un programme (texte / exercices)
  - Consultation de l'objectif et suivi de la progression côté employé

- **Dépendances :** Utilisateurs

---

### Module 10 — Notifications *(Bonus)*
**Priorité : 🟢 OPTIONNEL**

Envoie des notifications aux utilisateurs à des moments clés (confirmation de réservation, rappel avant session). Canal à définir avec le client (email, in-app, ou les deux).

- **Fonctionnalités :**
  - Confirmation de réservation
  - Rappel avant session (délai à configurer)
  - Notification d'annulation

- **Dépendances :** Réservations, Auth

---

## Ordre de construction recommandé

```
PHASE 1 — Fondations (pas de dépendances externes)
  └── Module 1 : Auth

PHASE 2 — Données de base
  └── Module 2 : Utilisateurs  (dépend de : Auth)

PHASE 3 — Cœur métier côté coach
  └── Module 3 : Créneaux  (dépend de : Auth, Utilisateurs)

PHASE 4 — Cœur métier côté employé
  ├── Module 4 : Réservations  (dépend de : Auth, Utilisateurs, Créneaux)
  └── Module 5 : Gestion Solo/Duo  (dépend de : Réservations)

PHASE 5 — Visualisation & suivi
  ├── Module 6 : Dashboard  (dépend de : Réservations, Créneaux)
  └── Module 7 : Historique  (dépend de : Réservations)

PHASE 6 — Fonctionnalités avancées (Niveau 2)
  ├── Module 8 : Pénalités  (dépend de : Historique, Utilisateurs)
  └── Module 9 : Objectifs & Programmes  (dépend de : Utilisateurs)

PHASE 7 — Bonus
  └── Module 10 : Notifications  (dépend de : Réservations, Auth)
```

---

## Critères de validation minimaux (MVP)

Le projet est considéré validé si les modules 1 à 5 sont fonctionnels :

- [x] Auth opérationnelle avec gestion des rôles
- [x] CRUD des créneaux par le coach
- [x] Réservation / annulation fonctionnelle avec règles métier
- [x] Gestion Solo / Duo correcte
- [x] Dashboard minimal présent
- [x] Aucune incohérence de réservation

---

*Document de cadrage — à mettre à jour après validation client.*
