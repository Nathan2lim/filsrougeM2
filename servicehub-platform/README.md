# ServiceHub Platform

Plateforme SaaS B2B de gestion de services - Projet M2 Architecture Logicielle

## Description

ServiceHub Platform est une application de gestion de tickets et de facturation pour les entreprises B2B. Elle permet la gestion complete du cycle de vie des tickets de support, la facturation des interventions et le reporting des activites.

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| **Backend** | NestJS (TypeScript) |
| **Frontend** | React + Vite |
| **Base de donnees** | PostgreSQL 16 |
| **ORM** | Prisma |
| **Authentification** | JWT |
| **Documentation API** | Swagger/OpenAPI |
| **Containerisation** | Docker + Docker Compose |

## Demarrage Rapide

### Prerequis

- Docker & Docker Compose
- Node.js 20+ (pour le developpement local)

### Installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd servicehub-platform
```

2. **Configurer l'environnement**
```bash
# Le fichier .env est deja configure pour le developpement
cat .env
```

3. **Lancer les services**
```bash
docker-compose up -d
```

4. **Executer les migrations et le seed**
```bash
docker exec servicehub-backend npx prisma migrate dev --name init
docker exec servicehub-backend npx prisma db seed
```

5. **Acceder a l'application**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Backend | http://localhost:3000/api/v1 |
| Documentation Swagger | http://localhost:3000/api/docs |
| Adminer (DB UI) | http://localhost:8080 |

## Identifiants de Test

| Role | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@servicehub.com | password123 |
| Manager | manager@servicehub.com | password123 |
| Agent | agent1@servicehub.com | password123 |
| Client | client1@example.com | password123 |

## Architecture

### Structure du Projet

```
servicehub-platform/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── common/            # Guards, Filters, Decorators, Pipes
│   │   ├── config/            # Configuration
│   │   ├── prisma/            # Service Prisma
│   │   ├── users/             # Module utilisateurs + auth
│   │   ├── tickets/           # Module tickets
│   │   ├── billing/           # Module facturation
│   │   └── reporting/         # Module reporting
│   └── prisma/
│       ├── schema.prisma      # Schema base de donnees
│       └── seed.ts            # Donnees de test
├── frontend/                   # Application React
│   └── src/
│       ├── components/        # Composants reutilisables
│       ├── pages/             # Pages de l'application
│       ├── services/          # Services API
│       └── context/           # Context React (Auth)
├── docs/                       # Documentation
│   ├── diagrams/              # Diagrammes PlantUML
│   └── *.md                   # Documents d'analyse
└── docker-compose.yml         # Configuration Docker
```

### Architecture en Couches

```
┌─────────────────────────────────────┐
│     Couche Presentation             │
│  (Controllers, DTOs, Swagger)       │
├─────────────────────────────────────┤
│     Couche Metier (Services)        │
│  (Business Logic, Validation)       │
├─────────────────────────────────────┤
│     Couche Persistance              │
│  (Repositories, Prisma)             │
├─────────────────────────────────────┤
│     Infrastructure                  │
│  (PostgreSQL, External Services)    │
└─────────────────────────────────────┘
```

### Modules Backend

| Module | Description | Endpoints |
|--------|-------------|-----------|
| **Users** | Gestion utilisateurs et authentification | `/auth/*`, `/users/*` |
| **Tickets** | Gestion des tickets de support | `/tickets/*` |
| **Billing** | Facturation et paiements | `/invoices/*`, `/payments/*` |
| **Reporting** | Dashboard et rapports | `/dashboard/*`, `/reports/*` |

## Fonctionnalites

### Gestion des Tickets
- Creation et suivi de tickets
- Workflow de statuts (Open -> In Progress -> Resolved -> Closed)
- Priorites (Critical, High, Medium, Low)
- Assignation aux agents
- Commentaires (publics et internes)

### Facturation
- Creation de factures avec lignes de detail
- Gestion des statuts (Draft, Sent, Paid, etc.)
- Calcul automatique TVA
- Enregistrement des paiements

### Reporting
- Dashboard avec statistiques temps reel
- Rapports tickets par statut/priorite
- Rapports financiers
- Export CSV

### Securite
- Authentification JWT
- Roles et permissions (RBAC)
- Guards de protection des routes
- Validation des donnees (class-validator)

## Commandes Utiles

### Docker

```bash
# Demarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Arreter les services
docker-compose down

# Rebuild un service
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Prisma

```bash
# Migrations
docker exec servicehub-backend npx prisma migrate dev

# Reset database
docker exec servicehub-backend npx prisma migrate reset

# Ouvrir Prisma Studio
docker exec -it servicehub-backend npx prisma studio
```

### Tests API avec curl

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@servicehub.com","password":"password123"}'

# Get tickets (avec token)
curl http://localhost:3000/api/v1/tickets \
  -H "Authorization: Bearer <votre-token>"
```

## Documentation

La documentation complete est disponible dans le dossier `/docs`:

- `01-analyse-fonctionnelle.md` - Analyse fonctionnelle complete
- `01-blocs-metiers.md` - Description des modules metier
- `02-architecture-4plus1.md` - Vues architecturales (modele 4+1)
- `02-justification-architecture.md` - Justification des choix techniques
- `03-etude-styles-architecturaux.md` - Etude comparative des styles

## Variables d'Environnement

| Variable | Description | Defaut |
|----------|-------------|--------|
| `DB_USER` | Utilisateur PostgreSQL | servicehub |
| `DB_PASSWORD` | Mot de passe PostgreSQL | servicehub_secret |
| `DB_NAME` | Nom de la base | servicehub_db |
| `DB_PORT` | Port PostgreSQL | 5432 |
| `BACKEND_PORT` | Port API | 3000 |
| `FRONTEND_PORT` | Port Frontend | 5173 |
| `JWT_SECRET` | Secret JWT | (a changer en prod) |
| `JWT_EXPIRATION` | Duree token | 1d |

## Developpement Local (sans Docker)

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tests

```bash
# Tests unitaires
docker exec servicehub-backend npm run test

# Tests e2e
docker exec servicehub-backend npm run test:e2e

# Couverture de tests
docker exec servicehub-backend npm run test:cov
```

## Auteur

Projet academique M2 - Architecture Logicielle

## License

MIT
