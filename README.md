# ServiceHub Platform

[![CI/CD Pipeline](https://github.com/Nathan2lim/filsrougeM2/actions/workflows/ci.yml/badge.svg)](https://github.com/Nathan2lim/filsrougeM2/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Plateforme de gestion de services B2B permettant de centraliser la relation client, le suivi des interventions et la facturation.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [API Documentation](#api-documentation)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Versioning](#versioning)
- [Contribuer](#contribuer)

## Fonctionnalités

### Gestion des Utilisateurs
- Authentification sécurisée (JWT)
- Gestion des rôles (Admin, Technicien, Client)
- Permissions granulaires

### Gestion des Tickets
- Création avec référence unique (TKT-YYYYMMDD-XXXX)
- Workflow de statuts (Ouvert → En cours → Résolu → Fermé)
- Priorités (Basse, Moyenne, Haute, Critique)
- Commentaires internes et publics
- Pièces jointes

### Facturation
- Génération de factures (INV-YYYYMMDD-XXXX)
- Calcul automatique TVA
- Suivi des paiements
- Multi-modes de paiement (CB, Virement, Chèque, Espèces)

### Reporting
- Statistiques tickets
- Suivi du chiffre d'affaires
- Tableaux de bord

## Architecture

Le projet suit une **architecture monolithe modulaire en couches** :

```
┌─────────────────────────────────────────┐
│           PRÉSENTATION (API)            │
│     Controllers - DTOs - Swagger        │
├─────────────────────────────────────────┤
│            DOMAINE (MÉTIER)             │
│   Services - Entities - Business Rules  │
├─────────────────────────────────────────┤
│        INFRASTRUCTURE (DONNÉES)         │
│      Repositories - Prisma - DB         │
└─────────────────────────────────────────┘
```

### Modules métier

| Module | Description |
|--------|-------------|
| `users` | Authentification, rôles, permissions |
| `tickets` | Gestion des demandes et interventions |
| `billing` | Facturation et paiements |
| `reporting` | Statistiques et KPIs |

### Design Patterns utilisés

- **Repository Pattern** : Abstraction de la couche de données
- **Factory Pattern** : Création centralisée des entités
- **Builder Pattern** : Construction fluide d'objets complexes
- **Singleton Pattern** : Configuration et génération de références

## Technologies

| Technologie | Version | Usage |
|-------------|---------|-------|
| Node.js | ≥ 20.0 | Runtime |
| NestJS | 10.x | Framework backend |
| TypeScript | 5.x | Langage |
| PostgreSQL | 16 | Base de données |
| Prisma | 5.x | ORM |
| Docker | - | Conteneurisation |
| Jest | 29.x | Tests |

## Installation

### Prérequis

- Node.js ≥ 20.0.0
- npm ≥ 10.0.0
- Docker & Docker Compose
- PostgreSQL 16 (ou via Docker)

### Étapes

1. **Cloner le repository**
```bash
git clone https://github.com/Nathan2lim/filsrougeM2.git
cd filsrougeM2/servicehub-platform
```

2. **Configurer l'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

3. **Installer les dépendances**
```bash
cd backend
npm install
```

4. **Générer le client Prisma**
```bash
npx prisma generate
```

5. **Lancer la base de données**
```bash
docker-compose up -d postgres
```

6. **Appliquer les migrations**
```bash
npx prisma migrate dev
```

7. **Peupler la base (optionnel)**
```bash
npx prisma db seed
```

8. **Démarrer l'application**
```bash
npm run start:dev
```

L'API est accessible sur `http://localhost:3000`

## Utilisation

### Scripts npm disponibles

```bash
# Développement
npm run start:dev       # Mode watch
npm run start:debug     # Mode debug

# Build
npm run build           # Compilation
npm run build:clean     # Clean + build

# Qualité
npm run lint            # ESLint fix
npm run format          # Prettier

# Tests
npm run test            # Tests unitaires
npm run test:cov        # Avec couverture
npm run test:e2e        # Tests end-to-end

# Base de données
npm run prisma:studio   # Interface Prisma
npm run prisma:migrate  # Migrations dev
npm run db:reset        # Reset complet

# Docker
npm run docker:build    # Build image
npm run docker:run      # Run container
```

### Démarrage rapide avec Docker

```bash
# Démarrer tout l'environnement
docker-compose -f docker-compose.prod.yml up -d

# Voir les logs
docker-compose logs -f backend

# Arrêter
docker-compose down
```

## Structure du projet

```
filsrougeM2/
├── servicehub-platform/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── common/           # Modules partagés
│   │   │   │   ├── patterns/     # Design patterns (Factory, Builder, Singleton)
│   │   │   │   ├── guards/       # Auth guards
│   │   │   │   ├── filters/      # Exception filters
│   │   │   │   └── interfaces/   # Interfaces communes
│   │   │   ├── config/           # Configuration
│   │   │   ├── prisma/           # Service Prisma
│   │   │   ├── users/            # Module Utilisateurs
│   │   │   ├── tickets/          # Module Tickets
│   │   │   ├── billing/          # Module Facturation
│   │   │   └── reporting/        # Module Reporting
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Schéma BDD
│   │   │   └── seed.ts           # Données initiales
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── scripts/
│   │   ├── build.sh              # Script de build
│   │   └── release.sh            # Script de release
│   └── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       └── ci.yml                # Pipeline CI/CD
├── seance1-analyse.txt           # Documentation séance 1
├── seance2-architecture-4+1.txt  # Documentation séance 2
├── seance4-justification-style.txt
├── seance5-couche-persistence.txt
├── seance6-patterns-creation.txt
├── seance7-versioning-deploiement.txt
└── README.md
```

## API Documentation

### Swagger UI

La documentation interactive est disponible sur :
```
http://localhost:3000/api
```

### Endpoints principaux

#### Authentification
```
POST   /auth/login          # Connexion
POST   /auth/register       # Inscription
```

#### Utilisateurs
```
GET    /users               # Liste des utilisateurs
GET    /users/:id           # Détail utilisateur
POST   /users               # Créer utilisateur
PATCH  /users/:id           # Modifier utilisateur
DELETE /users/:id           # Supprimer utilisateur
```

#### Tickets
```
GET    /tickets             # Liste des tickets
GET    /tickets/:id         # Détail ticket
POST   /tickets             # Créer ticket
PATCH  /tickets/:id         # Modifier ticket
PATCH  /tickets/:id/assign  # Assigner ticket
POST   /tickets/:id/comments # Ajouter commentaire
```

#### Factures
```
GET    /invoices            # Liste des factures
GET    /invoices/:id        # Détail facture
POST   /invoices            # Créer facture
PATCH  /invoices/:id        # Modifier facture
POST   /invoices/:id/payments # Enregistrer paiement
```

## Tests

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:cov

# Tests end-to-end
npm run test:e2e

# Tests en mode watch
npm run test:watch
```

### Structure des tests

```
src/
├── users/
│   ├── users.service.ts
│   └── users.service.spec.ts    # Tests unitaires
├── tickets/
│   ├── tickets.service.ts
│   └── tickets.service.spec.ts
└── ...

test/
├── app.e2e-spec.ts              # Tests E2E
└── jest-e2e.json
```

## Déploiement

### Avec Docker

```bash
# Build de l'image
docker build \
  --build-arg VERSION=$(npm run info:version -s) \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  -t servicehub-backend:latest \
  ./backend

# Lancer en production
docker-compose -f docker-compose.prod.yml up -d
```

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement | `development` |
| `PORT` | Port de l'API | `3000` |
| `DATABASE_URL` | URL PostgreSQL | - |
| `JWT_SECRET` | Clé secrète JWT | - |
| `JWT_EXPIRATION` | Durée token | `1d` |

### CI/CD

Le pipeline GitHub Actions exécute automatiquement :

1. **test** : Lint + Tests unitaires
2. **build** : Compilation TypeScript
3. **docker** : Build et push de l'image
4. **release** : Création de release (sur tags)

## Versioning

Le projet suit le [Semantic Versioning](https://semver.org/) :

```bash
# Bug fix (1.0.0 -> 1.0.1)
./scripts/release.sh patch

# Nouvelle fonctionnalité (1.0.0 -> 1.1.0)
./scripts/release.sh minor

# Breaking change (1.0.0 -> 2.0.0)
./scripts/release.sh major
```

Options :
```bash
./scripts/release.sh --dry-run minor   # Simulation
./scripts/release.sh --skip-tests patch # Sans tests
./scripts/release.sh --no-push minor   # Sans push
```

## Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'feat: ajout de ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Créer une Pull Request

### Convention de commits

```
feat:     Nouvelle fonctionnalité
fix:      Correction de bug
docs:     Documentation
style:    Formatage
refactor: Refactoring
test:     Tests
chore:    Maintenance
```

## Documentation des séances

| Séance | Thème | Document |
|--------|-------|----------|
| 1 | Analyse fonctionnelle | `seance1-analyse.txt` |
| 2 | Architecture 4+1 | `seance2-architecture-4+1.txt` |
| 4 | Justification style | `seance4-justification-style.txt` |
| 5 | Couche persistence | `seance5-couche-persistence.txt` |
| 6 | Patterns de création | `seance6-patterns-creation.txt` |
| 7 | Versioning & déploiement | `seance7-versioning-deploiement.txt` |

## Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Auteur** : Nathan Gilbert
**Formation** : Master 2 - Fil Rouge
**Date** : Décembre 2025
