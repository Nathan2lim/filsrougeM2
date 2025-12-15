# Justification des Choix Architecturaux - ServiceHub Platform

## 1. Introduction

Ce document justifie les choix architecturaux effectués pour la plateforme ServiceHub en s'appuyant sur les contraintes métier, techniques et les bonnes pratiques de l'industrie.

---

## 2. Choix du Framework: NestJS

### Justification

| Critère | Justification |
|---------|---------------|
| **TypeScript natif** | Typage fort, détection précoce des erreurs, meilleure maintenabilité |
| **Architecture modulaire** | Séparation claire des responsabilités, modules réutilisables |
| **Injection de dépendances** | Découplage, testabilité, respect des principes SOLID |
| **Écosystème riche** | Nombreux packages officiels (JWT, Swagger, Passport...) |
| **Documentation** | Documentation exhaustive, communauté active |
| **Performance** | Basé sur Express/Fastify, performances éprouvées |

### Alternatives considérées

| Framework | Avantages | Inconvénients | Décision |
|-----------|-----------|---------------|----------|
| Express.js | Léger, flexible | Pas de structure, TypeScript manuel | Rejeté |
| Fastify | Très performant | Moins mature, écosystème limité | Rejeté |
| Koa | Moderne, middleware | Pas de structure imposée | Rejeté |
| **NestJS** | Structure, TypeScript, DI | Courbe d'apprentissage | **Choisi** |

---

## 3. Choix de l'ORM: Prisma

### Justification

| Critère | Justification |
|---------|---------------|
| **Type-safety** | Génération automatique des types TypeScript |
| **Migrations** | Gestion des migrations intégrée et versionnée |
| **Performances** | Requêtes optimisées, batching automatique |
| **Developer Experience** | Prisma Studio, autocomplétion, documentation |
| **Abstraction** | Support multi-base (PostgreSQL, MySQL, SQLite...) |

### Alternatives considérées

| ORM | Avantages | Inconvénients | Décision |
|-----|-----------|---------------|----------|
| TypeORM | Populaire, décorateurs | Bugs, maintenance, types approximatifs | Rejeté |
| Sequelize | Mature, flexible | JavaScript first, types ajoutés | Rejeté |
| Knex | Flexible, query builder | Pas un ORM complet | Rejeté |
| **Prisma** | Types, DX, moderne | Moins flexible sur requêtes complexes | **Choisi** |

---

## 4. Choix de la Base de Données: PostgreSQL

### Justification

| Critère | Justification |
|---------|---------------|
| **Robustesse** | ACID compliant, intégrité des données garantie |
| **Performances** | Excellentes performances en lecture/écriture |
| **Fonctionnalités** | JSON, arrays, full-text search, extensions |
| **Scalabilité** | Réplication, partitioning, compatible cloud |
| **Open Source** | Gratuit, communauté active, pas de vendor lock-in |
| **Compatibilité** | Supporté par tous les cloud providers |

### Alternatives considérées

| Base | Avantages | Inconvénients | Décision |
|------|-----------|---------------|----------|
| MySQL | Populaire, simple | Moins de fonctionnalités avancées | Rejeté |
| MongoDB | Flexible, NoSQL | Pas adapté aux relations complexes | Rejeté |
| SQLite | Simple, embarqué | Pas adapté à la production | Rejeté |
| **PostgreSQL** | Complet, robuste | Plus complexe à administrer | **Choisi** |

---

## 5. Architecture en Couches

### Justification du pattern

L'architecture en couches a été choisie pour ses avantages suivants :

```
┌─────────────────────────────────────────────────┐
│           AVANTAGES                              │
├─────────────────────────────────────────────────┤
│ ✓ Séparation des responsabilités                │
│ ✓ Testabilité (mocking entre couches)           │
│ ✓ Maintenabilité (modifications isolées)        │
│ ✓ Évolutivité (ajout de couches possible)       │
│ ✓ Réutilisabilité (services indépendants)       │
│ ✓ Compréhension (structure claire)              │
└─────────────────────────────────────────────────┘
```

### Structure des couches

```
┌─────────────────────────────────────────────────────────────────┐
│                     COUCHE PRÉSENTATION                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  Controller   │  │     DTOs      │  │  Swagger Doc  │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│  Responsabilité: Recevoir les requêtes HTTP, valider,           │
│                  retourner les réponses formatées                │
├─────────────────────────────────────────────────────────────────┤
│                       COUCHE MÉTIER                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │   Service     │  │Business Rules │  │   Entities    │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│  Responsabilité: Implémenter la logique métier,                 │
│                  orchestrer les opérations                       │
├─────────────────────────────────────────────────────────────────┤
│                     COUCHE PERSISTANCE                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │  Repository   │  │   Interface   │  │ Prisma Client │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│  Responsabilité: Abstraire l'accès aux données,                 │
│                  implémenter les requêtes                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Repository Pattern

### Justification

Le pattern Repository a été implémenté pour :

| Avantage | Description |
|----------|-------------|
| **Abstraction** | Les services ne connaissent pas l'implémentation de la persistence |
| **Testabilité** | Possibilité de mocker le repository dans les tests |
| **Flexibilité** | Changement d'ORM possible sans impact sur les services |
| **Single Responsibility** | Chaque repository gère une seule entité |

### Implémentation

```typescript
// Interface (contrat)
interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  // ...
}

// Implémentation concrète
class UsersRepository implements IUsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
  // ...
}

// Injection dans le service
class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private repository: IUsersRepository
  ) {}
}
```

---

## 7. Injection de Dépendances (DI)

### Justification

| Principe SOLID | Application |
|----------------|-------------|
| **S** - Single Responsibility | Chaque classe a une responsabilité unique |
| **O** - Open/Closed | Extensions via interfaces, pas de modifications |
| **L** - Liskov Substitution | Implémentations interchangeables |
| **I** - Interface Segregation | Interfaces spécifiques par module |
| **D** - Dependency Inversion | Dépendance vers abstractions (interfaces) |

### Avantages concrets

```
┌─────────────────────────────────────────────────────────────────┐
│                    SANS INJECTION DE DÉPENDANCES                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  class UsersService {                                            │
│    private repository = new UsersRepository(); // ❌ Couplage   │
│  }                                                               │
│                                                                  │
│  Problèmes:                                                      │
│  - Impossible de mocker pour les tests                          │
│  - Couplage fort entre classes                                  │
│  - Difficile à maintenir                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    AVEC INJECTION DE DÉPENDANCES                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  class UsersService {                                            │
│    constructor(                                                  │
│      @Inject('IUsersRepository')                                │
│      private repository: IUsersRepository  // ✓ Abstraction     │
│    ) {}                                                          │
│  }                                                               │
│                                                                  │
│  Avantages:                                                      │
│  - Testable avec des mocks                                      │
│  - Couplage faible                                              │
│  - Respect des principes SOLID                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Modularité NestJS

### Justification

La modularité permet de :

| Avantage | Description |
|----------|-------------|
| **Isolation** | Chaque module gère son propre domaine |
| **Réutilisabilité** | Modules exportables vers d'autres projets |
| **Scalabilité** | Migration vers micro-services facilitée |
| **Organisation** | Structure claire du code |
| **Lazy Loading** | Chargement à la demande possible |

### Structure modulaire

```
┌─────────────────────────────────────────────────────────────────┐
│                        AppModule (Root)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  imports: [                                                      │
│    ConfigModule.forRoot({ isGlobal: true }),                    │
│    PrismaModule,      // Global - Accès BDD                     │
│    CommonModule,      // Global - Transverse                    │
│    UsersModule,       // Feature - Utilisateurs                 │
│    TicketsModule,     // Feature - Tickets                      │
│    BillingModule,     // Feature - Facturation                  │
│    ReportingModule,   // Feature - Reporting                    │
│  ]                                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Authentification JWT

### Justification du choix JWT

| Critère | JWT | Sessions |
|---------|-----|----------|
| Scalabilité | ✓ Stateless | ✗ Stockage serveur |
| Performance | ✓ Pas de lookup BDD | ✗ Accès BDD à chaque requête |
| Microservices | ✓ Partageable entre services | ✗ Synchronisation nécessaire |
| Mobile | ✓ Adapté aux apps | ✗ Gestion cookies complexe |

### Implémentation

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUX AUTHENTIFICATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Client → POST /auth/login (email, password)                 │
│  2. Server → Valide credentials                                  │
│  3. Server → Génère JWT avec payload:                           │
│     {                                                            │
│       sub: "user-id",                                           │
│       email: "user@email.com",                                  │
│       role: "ADMIN",                                            │
│       permissions: ["users:read", "users:write", ...]           │
│     }                                                            │
│  4. Server → Retourne { accessToken, user }                     │
│  5. Client → Stocke le token                                    │
│  6. Client → Inclut "Authorization: Bearer <token>" dans        │
│              chaque requête                                      │
│  7. AuthGuard → Vérifie et décode le token                      │
│  8. RolesGuard → Vérifie les permissions                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Containerisation Docker

### Justification

| Avantage | Description |
|----------|-------------|
| **Reproductibilité** | Environnements identiques dev/prod |
| **Isolation** | Pas de conflits entre dépendances |
| **Portabilité** | Fonctionne sur tout système avec Docker |
| **Scalabilité** | Orchestration facile (Kubernetes, Swarm) |
| **CI/CD** | Intégration naturelle dans les pipelines |

### Multi-stage Build

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]

# Avantages:
# - Image finale plus légère (pas de devDependencies)
# - Sécurité accrue (moins de surface d'attaque)
# - Build reproductible
```

---

## 11. Conclusion

Les choix architecturaux effectués pour ServiceHub Platform répondent aux objectifs suivants :

| Objectif | Solution |
|----------|----------|
| Maintenabilité | Architecture en couches, modules isolés |
| Testabilité | DI, Repository Pattern, interfaces |
| Scalabilité | Stateless, Docker, PostgreSQL |
| Performance | NestJS, Prisma, PostgreSQL |
| Sécurité | JWT, Guards, validation stricte |
| Évolutivité | Modularité, principes SOLID |

Ces choix permettent de construire une application robuste, évolutive et maintenable sur le long terme.
