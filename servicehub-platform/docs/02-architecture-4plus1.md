# Architecture 4+1 Vues - ServiceHub Platform

## Introduction

Ce document présente l'architecture de la plateforme ServiceHub selon le modèle 4+1 vues de Philippe Kruchten. Ce modèle permet de représenter l'architecture sous différents angles pour répondre aux préoccupations de tous les intervenants du projet.

---

## Vue d'ensemble

```
                    ┌─────────────────────┐
                    │   Vue Scénarios     │
                    │   (Cas d'usage)     │
                    └─────────┬───────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Vue Logique    │ │ Vue Processus   │ │ Vue Physique    │
│  (Fonctions)    │ │   (Runtime)     │ │ (Déploiement)   │
└────────┬────────┘ └─────────────────┘ └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Vue Développement│
│ (Organisation)   │
└─────────────────┘
```

---

## 1. Vue Logique

### Description

La vue logique représente la décomposition fonctionnelle du système. Elle montre les principaux modules et leurs responsabilités.

### Architecture modulaire NestJS

```
┌───────────────────────────────────────────────────────────────────────┐
│                         APPLICATION NESTJS                             │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                      COUCHE PRÉSENTATION                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │  Auth    │ │  Users   │ │ Tickets  │ │ Billing  │           │   │
│  │  │Controller│ │Controller│ │Controller│ │Controller│ ...       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                │                                       │
│                                ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                      COUCHE MÉTIER                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │  Auth    │ │  Users   │ │ Tickets  │ │ Billing  │           │   │
│  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │ ...       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                │                                       │
│                                ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    COUCHE PERSISTANCE                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │  Users   │ │ Tickets  │ │ Invoices │ │ Payments │           │   │
│  │  │Repository│ │Repository│ │Repository│ │Repository│ ...       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                │                                       │
│                                ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    PRISMA ORM + POSTGRESQL                      │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

### Modules et leurs responsabilités

| Module | Responsabilités |
|--------|-----------------|
| **Common** | Guards, Filters, Interceptors, Decorators partagés |
| **Config** | Configuration de l'application |
| **Prisma** | Abstraction de la base de données |
| **Users** | Authentification, gestion utilisateurs et rôles |
| **Tickets** | Gestion du cycle de vie des tickets |
| **Billing** | Facturation et paiements |
| **Reporting** | Dashboard et rapports |

### Relations entre modules

```
                    ┌──────────────┐
                    │    Common    │
                    │   (Global)   │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│    Config     │  │    Prisma     │  │     JWT       │
│   (Global)    │  │   (Global)    │  │   Module      │
└───────────────┘  └───────┬───────┘  └───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│    Users      │  │   Tickets     │  │   Billing     │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  Reporting    │
                   └───────────────┘
```

---

## 2. Vue Processus

### Description

La vue processus montre le comportement du système à l'exécution, les flux de données et les interactions entre composants.

### Flux d'authentification JWT

```
┌────────┐     ┌────────────┐     ┌────────────┐     ┌──────────┐     ┌────────┐
│ Client │     │ AuthGuard  │     │ AuthCtrl   │     │ AuthSvc  │     │ UserRep│
└───┬────┘     └─────┬──────┘     └─────┬──────┘     └────┬─────┘     └───┬────┘
    │                │                  │                 │               │
    │ POST /login    │                  │                 │               │
    │────────────────────────────────────▶                │               │
    │                │                  │                 │               │
    │                │                  │  validate(dto)  │               │
    │                │                  │────────────────▶│               │
    │                │                  │                 │               │
    │                │                  │                 │ findByEmail() │
    │                │                  │                 │──────────────▶│
    │                │                  │                 │               │
    │                │                  │                 │◀──────────────│
    │                │                  │                 │    user       │
    │                │                  │                 │               │
    │                │                  │                 │ verify pwd    │
    │                │                  │                 │──────────────▶│
    │                │                  │                 │               │
    │                │                  │                 │ generate JWT  │
    │                │                  │◀───────────────│               │
    │                │                  │  { token, user }│               │
    │◀───────────────────────────────────                │               │
    │    { accessToken, user }          │                 │               │
    │                │                  │                 │               │
    │                │                  │                 │               │
    │ GET /protected │                  │                 │               │
    │───────────────▶│                  │                 │               │
    │                │                  │                 │               │
    │                │ verify JWT       │                 │               │
    │                │────────────────▶│                  │               │
    │                │                  │                 │               │
    │                │ payload          │                 │               │
    │                │◀────────────────│                  │               │
    │                │                  │                 │               │
    │◀───────────────│                  │                 │               │
    │   request.user = payload          │                 │               │
```

### Flux de création de ticket

```
┌────────┐     ┌────────────┐     ┌────────────┐     ┌──────────┐     ┌────────┐
│ Client │     │ TicketCtrl │     │ TicketSvc  │     │TicketRep │     │ Prisma │
└───┬────┘     └─────┬──────┘     └─────┬──────┘     └────┬─────┘     └───┬────┘
    │                │                  │                 │               │
    │ POST /tickets  │                  │                 │               │
    │───────────────▶│                  │                 │               │
    │                │                  │                 │               │
    │                │ create(dto,user) │                 │               │
    │                │─────────────────▶│                 │               │
    │                │                  │                 │               │
    │                │                  │  countToday()   │               │
    │                │                  │────────────────▶│               │
    │                │                  │                 │───────────────▶
    │                │                  │                 │◀──────────────│
    │                │                  │◀───────────────│ count         │
    │                │                  │                 │               │
    │                │                  │ generateRef()   │               │
    │                │                  │                 │               │
    │                │                  │   create()      │               │
    │                │                  │────────────────▶│               │
    │                │                  │                 │───────────────▶
    │                │                  │                 │◀──────────────│
    │                │                  │◀───────────────│ ticket        │
    │                │◀────────────────│                 │               │
    │◀──────────────│   ticket         │                 │               │
    │  201 Created   │                  │                 │               │
```

### Flux de résolution de ticket avec facturation

```
┌───────┐   ┌────────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│ Agent │   │ TicketCtrl │   │ TicketSvc │   │BillingCtrl│   │BillingSvc │
└───┬───┘   └─────┬──────┘   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
    │             │                │               │               │
    │ PUT /status │                │               │               │
    │────────────▶│                │               │               │
    │             │ changeStatus() │               │               │
    │             │───────────────▶│               │               │
    │             │                │               │               │
    │             │                │ validate      │               │
    │             │                │ transition    │               │
    │             │                │               │               │
    │             │                │ update status │               │
    │             │                │ set resolvedAt│               │
    │             │◀──────────────│               │               │
    │◀────────────│  ticket        │               │               │
    │             │                │               │               │
    │             │                │               │               │
    │           Manager            │               │               │
    │             │                │               │               │
    │ POST /invoices               │               │               │
    │─────────────────────────────────────────────▶│               │
    │             │                │               │ create()      │
    │             │                │               │──────────────▶│
    │             │                │               │               │
    │             │                │               │ calculate()   │
    │             │                │               │ subtotal,tax  │
    │             │                │               │               │
    │             │                │               │ generate ref  │
    │             │                │               │               │
    │             │                │               │◀─────────────│
    │◀─────────────────────────────────────────────│  invoice      │
    │             │                │               │               │
```

---

## 3. Vue Développement

### Description

La vue développement montre l'organisation du code source et les dépendances entre packages.

### Structure des dossiers

```
servicehub-platform/
├── docker-compose.yml           # Configuration Docker dev
├── docker-compose.prod.yml      # Configuration Docker prod
├── .env                         # Variables d'environnement
├── docs/                        # Documentation
│   ├── 01-analyse-fonctionnelle.md
│   ├── 01-blocs-metiers.md
│   ├── 02-architecture-4plus1.md
│   ├── 02-justification-architecture.md
│   ├── 03-etude-styles-architecturaux.md
│   └── diagrams/                # Diagrammes PlantUML
│
└── backend/
    ├── Dockerfile               # Image production
    ├── Dockerfile.dev           # Image développement
    ├── package.json             # Dépendances npm
    ├── tsconfig.json            # Configuration TypeScript
    │
    ├── prisma/
    │   ├── schema.prisma        # Schéma base de données
    │   └── seed.ts              # Données initiales
    │
    ├── src/
    │   ├── main.ts              # Point d'entrée
    │   ├── app.module.ts        # Module racine
    │   │
    │   ├── common/              # Module transverse
    │   │   ├── decorators/      # @Public, @Roles, @CurrentUser
    │   │   ├── filters/         # Exception filters
    │   │   ├── guards/          # Auth & Roles guards
    │   │   ├── interceptors/    # Logging, Transform
    │   │   ├── pipes/           # Validation
    │   │   ├── exceptions/      # Business exceptions
    │   │   └── utils/           # Utilitaires
    │   │
    │   ├── config/              # Configuration
    │   ├── prisma/              # Service Prisma
    │   │
    │   ├── users/               # Module Users
    │   │   ├── controllers/
    │   │   ├── services/
    │   │   ├── repositories/
    │   │   ├── dto/
    │   │   ├── entities/
    │   │   └── interfaces/
    │   │
    │   ├── tickets/             # Module Tickets
    │   ├── billing/             # Module Billing
    │   └── reporting/           # Module Reporting
    │
    └── test/                    # Tests e2e
```

### Dépendances npm principales

```json
{
  "dependencies": {
    "@nestjs/common": "^10.x",
    "@nestjs/core": "^10.x",
    "@nestjs/config": "^3.x",
    "@nestjs/jwt": "^10.x",
    "@nestjs/passport": "^10.x",
    "@nestjs/swagger": "^7.x",
    "@prisma/client": "^5.x",
    "bcrypt": "^5.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.x",
    "@nestjs/testing": "^10.x",
    "prisma": "^5.x",
    "jest": "^29.x",
    "typescript": "^5.x"
  }
}
```

### Organisation par couche

```
┌─────────────────────────────────────────────────────────────────┐
│                         src/module/                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐                                              │
│  │ module.ts     │  Configuration du module NestJS              │
│  └───────────────┘                                              │
│                                                                  │
│  ┌───────────────┐                                              │
│  │ controllers/  │  Couche présentation (HTTP)                  │
│  │   *.controller.ts                                            │
│  └───────────────┘                                              │
│                                                                  │
│  ┌───────────────┐                                              │
│  │ services/     │  Couche métier (logique applicative)         │
│  │   *.service.ts                                               │
│  └───────────────┘                                              │
│                                                                  │
│  ┌───────────────┐                                              │
│  │ repositories/ │  Couche données (abstraction persistence)    │
│  │   *.repository.ts                                            │
│  │   *.repository.interface.ts                                  │
│  └───────────────┘                                              │
│                                                                  │
│  ┌───────────────┐                                              │
│  │ dto/          │  Data Transfer Objects (validation)          │
│  │   create-*.dto.ts                                            │
│  │   update-*.dto.ts                                            │
│  └───────────────┘                                              │
│                                                                  │
│  ┌───────────────┐                                              │
│  │ entities/     │  Entités de domaine                          │
│  │   *.entity.ts                                                │
│  └───────────────┘                                              │
│                                                                  │
│  ┌───────────────┐                                              │
│  │ interfaces/   │  Contrats et types                           │
│  │   *.interface.ts                                             │
│  └───────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Vue Physique (Déploiement)

### Description

La vue physique montre l'infrastructure matérielle et logicielle sur laquelle le système est déployé.

### Architecture Docker

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           DOCKER HOST                                      │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    servicehub-network (bridge)                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                │                    │                    │                 │
│                ▼                    ▼                    ▼                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │                  │  │                  │  │                  │        │
│  │  servicehub-     │  │  servicehub-     │  │  servicehub-     │        │
│  │  backend         │  │  postgres        │  │  adminer         │        │
│  │                  │  │                  │  │                  │        │
│  │  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────┐  │        │
│  │  │ NestJS App │  │  │  │ PostgreSQL │  │  │  │  Adminer   │  │        │
│  │  │            │  │  │  │    16      │  │  │  │    UI      │  │        │
│  │  │ Port: 3000 │  │  │  │ Port: 5432 │  │  │  │ Port: 8080 │  │        │
│  │  └────────────┘  │  │  └────────────┘  │  │  └────────────┘  │        │
│  │                  │  │                  │  │                  │        │
│  │  Volume: /app    │  │  Volume:         │  │                  │        │
│  │  (bind mount)    │  │  postgres_data   │  │                  │        │
│  │                  │  │                  │  │                  │        │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘        │
│           │                     │                     │                   │
└───────────┼─────────────────────┼─────────────────────┼───────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
     ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
     │ localhost:   │      │ localhost:   │      │ localhost:   │
     │    3000      │      │    5432      │      │    8080      │
     └──────────────┘      └──────────────┘      └──────────────┘
```

### Configuration Docker Compose

| Service | Image | Port | Volume | Dépendances |
|---------|-------|------|--------|-------------|
| backend | Dockerfile.dev | 3000:3000 | ./backend:/app | postgres |
| postgres | postgres:16-alpine | 5432:5432 | postgres_data | - |
| adminer | adminer:latest | 8080:8080 | - | postgres |

### Environnement de production

```
┌───────────────────────────────────────────────────────────────────┐
│                         CLOUD PROVIDER                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐                                              │
│  │  Load Balancer  │                                              │
│  │    (HTTPS)      │                                              │
│  └────────┬────────┘                                              │
│           │                                                        │
│           ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Container Orchestrator                    │  │
│  │                    (Docker Swarm / K8s)                      │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │  │
│  │  │   Backend    │  │   Backend    │  │   Backend    │       │  │
│  │  │   Replica 1  │  │   Replica 2  │  │   Replica N  │       │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │  │
│  │                                                              │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │                                  │
│                                 ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Managed PostgreSQL                        │  │
│  │                    (RDS / Cloud SQL)                         │  │
│  │                                                              │  │
│  │        Primary ◄─────────────────────► Replica               │  │
│  │                                                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 5. Vue Scénarios (Cas d'utilisation)

### Description

La vue scénarios montre les interactions entre les acteurs et le système à travers les principaux cas d'utilisation.

### Diagramme des cas d'utilisation

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         ServiceHub Platform                                │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        Module Authentication                         │  │
│  │                                                                      │  │
│  │    (Se connecter)──────────────────────◄───── CLIENT                 │  │
│  │         │                                      AGENT                 │  │
│  │         │                                      MANAGER               │  │
│  │    (Se déconnecter)─────────────────────◄───── ADMIN                │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          Module Tickets                              │  │
│  │                                                                      │  │
│  │    (Créer ticket)───────────────────────◄───── CLIENT               │  │
│  │         │                                                            │  │
│  │    (Consulter tickets)──────────────────◄───── CLIENT, AGENT        │  │
│  │         │                                                            │  │
│  │    (Traiter ticket)─────────────────────◄───── AGENT                │  │
│  │         │                                                            │  │
│  │    (Assigner ticket)────────────────────◄───── MANAGER              │  │
│  │         │                                                            │  │
│  │    (Supprimer ticket)───────────────────◄───── ADMIN                │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          Module Billing                              │  │
│  │                                                                      │  │
│  │    (Créer facture)──────────────────────◄───── MANAGER              │  │
│  │         │                                                            │  │
│  │    (Enregistrer paiement)───────────────◄───── MANAGER              │  │
│  │         │                                                            │  │
│  │    (Consulter factures)─────────────────◄───── CLIENT (own), MANAGER│  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         Module Reporting                             │  │
│  │                                                                      │  │
│  │    (Consulter dashboard)────────────────◄───── AGENT, MANAGER       │  │
│  │         │                                                            │  │
│  │    (Générer rapport)────────────────────◄───── MANAGER              │  │
│  │         │                                                            │  │
│  │    (Exporter données)───────────────────◄───── MANAGER, ADMIN       │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                          Module Users                                │  │
│  │                                                                      │  │
│  │    (Gérer utilisateurs)─────────────────◄───── ADMIN                │  │
│  │         │                                                            │  │
│  │    (Gérer rôles)────────────────────────◄───── ADMIN                │  │
│  │         │                                                            │  │
│  │    (Modifier profil)────────────────────◄───── Tous authentifiés    │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

### Scénarios clés

#### Scénario 1: Traitement complet d'un ticket

```
CLIENT                      AGENT                       MANAGER
   │                          │                            │
   │ 1. Crée un ticket        │                            │
   │────────────────────────▶│                            │
   │                          │                            │
   │                          │    2. Assigne le ticket    │
   │                          │◀───────────────────────────│
   │                          │                            │
   │ 3. Reçoit notification   │                            │
   │◀────────────────────────│                            │
   │                          │                            │
   │                          │ 4. Traite le ticket        │
   │                          │─────────────────────────▶  │
   │                          │                            │
   │                          │ 5. Demande info client     │
   │◀────────────────────────│                            │
   │                          │                            │
   │ 6. Répond au ticket      │                            │
   │────────────────────────▶│                            │
   │                          │                            │
   │                          │ 7. Résout le ticket        │
   │◀────────────────────────│                            │
   │                          │                            │
   │ 8. Valide la résolution  │                            │
   │────────────────────────▶│                            │
   │                          │                            │
   │                          │ 9. Clôture le ticket       │
   │                          │─────────────────────────▶  │
```

#### Scénario 2: Cycle de facturation

```
MANAGER                     SYSTÈME                     CLIENT
   │                          │                            │
   │ 1. Crée facture (DRAFT)  │                            │
   │────────────────────────▶│                            │
   │                          │                            │
   │ 2. Envoie facture        │                            │
   │────────────────────────▶│                            │
   │                          │ 3. Notifie client          │
   │                          │───────────────────────────▶│
   │                          │                            │
   │                          │ 4. Consulte facture        │
   │                          │◀───────────────────────────│
   │                          │                            │
   │                          │   [Paiement effectué]      │
   │                          │                            │
   │ 5. Enregistre paiement   │                            │
   │────────────────────────▶│                            │
   │                          │                            │
   │                          │ 6. Met à jour statut       │
   │                          │    (PAID)                  │
   │                          │                            │
   │                          │ 7. Notifie client          │
   │                          │───────────────────────────▶│
```
