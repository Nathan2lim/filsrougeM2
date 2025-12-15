# Matrice des Blocs Métiers - ServiceHub Platform

## Vue d'ensemble

Cette matrice détaille les responsabilités, entités et dépendances de chaque module de la plateforme ServiceHub.

---

## 1. Module Core (Common)

### Responsabilités

| Responsabilité | Description |
|----------------|-------------|
| Gestion des exceptions | Formatage uniforme des erreurs HTTP |
| Logging | Journalisation des requêtes et réponses |
| Validation | Validation des données entrantes |
| Sécurité | Guards d'authentification et d'autorisation |
| Transformation | Formatage uniforme des réponses API |

### Composants transverses

| Composant | Type | Description |
|-----------|------|-------------|
| HttpExceptionFilter | Filter | Capture et formate toutes les exceptions |
| LoggingInterceptor | Interceptor | Log des requêtes entrantes/sortantes |
| TransformInterceptor | Interceptor | Enveloppe les réponses dans un format standard |
| AuthGuard | Guard | Vérifie la validité du token JWT |
| RolesGuard | Guard | Vérifie les permissions basées sur les rôles |
| ValidationPipe | Pipe | Valide les DTOs avec class-validator |

### Dépendances

| Dépend de | Utilisé par |
|-----------|-------------|
| - | Users, Tickets, Billing, Reporting |

---

## 2. Module Users

### Responsabilités

| Responsabilité | Description |
|----------------|-------------|
| Authentification | Gestion du login/logout et tokens JWT |
| Gestion des utilisateurs | CRUD complet sur les utilisateurs |
| Gestion des rôles | Attribution et gestion des permissions |
| Profils | Gestion des profils utilisateurs |

### Entités

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                                │
├─────────────────────────────────────────────────────────────┤
│ id          : UUID (PK)                                      │
│ email       : String (UNIQUE)                                │
│ password    : String (hashed)                                │
│ firstName   : String                                         │
│ lastName    : String                                         │
│ isActive    : Boolean (default: true)                        │
│ roleId      : UUID (FK → Role)                               │
│ createdAt   : DateTime                                       │
│ updatedAt   : DateTime                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ N:1
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                          ROLE                                │
├─────────────────────────────────────────────────────────────┤
│ id          : UUID (PK)                                      │
│ name        : String (UNIQUE)                                │
│ description : String (nullable)                              │
│ permissions : String[]                                       │
│ createdAt   : DateTime                                       │
│ updatedAt   : DateTime                                       │
└─────────────────────────────────────────────────────────────┘
```

### Endpoints API

| Méthode | Endpoint | Description | Rôles |
|---------|----------|-------------|-------|
| POST | /auth/login | Connexion | Public |
| POST | /auth/register | Inscription client | Public |
| GET | /users | Liste des utilisateurs | ADMIN, MANAGER |
| GET | /users/me | Profil connecté | Authentifié |
| GET | /users/:id | Détail utilisateur | ADMIN, MANAGER |
| POST | /users | Créer utilisateur | ADMIN, MANAGER |
| PUT | /users/:id | Modifier utilisateur | ADMIN, MANAGER |
| DELETE | /users/:id | Supprimer utilisateur | ADMIN |
| PUT | /users/:id/activate | Activer compte | ADMIN, MANAGER |
| PUT | /users/:id/deactivate | Désactiver compte | ADMIN, MANAGER |

### Dépendances

| Dépend de | Utilisé par |
|-----------|-------------|
| Common, Prisma | Tickets, Billing, Reporting |

---

## 3. Module Tickets

### Responsabilités

| Responsabilité | Description |
|----------------|-------------|
| Gestion des tickets | CRUD complet sur les tickets |
| Workflow | Gestion des transitions de statut |
| Commentaires | Ajout et gestion des commentaires |
| Pièces jointes | Gestion des fichiers attachés |
| Assignation | Attribution des tickets aux agents |

### Entités

```
┌─────────────────────────────────────────────────────────────┐
│                         TICKET                               │
├─────────────────────────────────────────────────────────────┤
│ id           : UUID (PK)                                     │
│ reference    : String (UNIQUE) - TKT-YYYYMMDD-XXXX          │
│ title        : String                                        │
│ description  : Text                                          │
│ status       : Enum (OPEN, IN_PROGRESS, ...)                │
│ priority     : Enum (LOW, MEDIUM, HIGH, CRITICAL)           │
│ createdById  : UUID (FK → User)                             │
│ assignedToId : UUID (FK → User, nullable)                   │
│ resolvedAt   : DateTime (nullable)                          │
│ dueDate      : DateTime (nullable)                          │
│ createdAt    : DateTime                                      │
│ updatedAt    : DateTime                                      │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │ 1:N                          │ 1:N
         ▼                              ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│   TICKET_COMMENT    │    │          ATTACHMENT              │
├─────────────────────┤    ├─────────────────────────────────┤
│ id         : UUID   │    │ id        : UUID                │
│ content    : Text   │    │ filename  : String              │
│ isInternal : Bool   │    │ path      : String              │
│ ticketId   : UUID   │    │ mimeType  : String              │
│ authorId   : UUID   │    │ size      : Integer             │
│ createdAt  : DT     │    │ ticketId  : UUID                │
│ updatedAt  : DT     │    │ createdAt : DateTime            │
└─────────────────────┘    └─────────────────────────────────┘
```

### Machine à états - Ticket

```
                    ┌─────────┐
                    │  OPEN   │
                    └────┬────┘
                         │ assign/start
                         ▼
                ┌────────────────┐
           ┌────┤  IN_PROGRESS   ├────┐
           │    └───────┬────────┘    │
           │            │             │
           ▼            ▼             ▼
    ┌──────────┐  ┌───────────┐  ┌──────────┐
    │ WAITING  │  │  WAITING  │  │ RESOLVED │
    │ _CLIENT  │  │ _INTERNAL │  └────┬─────┘
    └────┬─────┘  └─────┬─────┘       │
         │              │             │
         └──────┬───────┘             │
                │                     ▼
                │              ┌──────────┐
                └──────────────┤  CLOSED  │
                               └──────────┘

    * CANCELLED accessible depuis tous les états sauf CLOSED
```

### Endpoints API

| Méthode | Endpoint | Description | Rôles |
|---------|----------|-------------|-------|
| GET | /tickets | Liste des tickets | Authentifié |
| GET | /tickets/my-tickets | Mes tickets | Authentifié |
| GET | /tickets/stats | Statistiques | ADMIN, MANAGER, AGENT |
| GET | /tickets/:id | Détail ticket | Authentifié |
| POST | /tickets | Créer ticket | Authentifié |
| PUT | /tickets/:id | Modifier ticket | Authentifié |
| DELETE | /tickets/:id | Supprimer ticket | ADMIN |
| PUT | /tickets/:id/assign | Assigner ticket | ADMIN, MANAGER |
| PUT | /tickets/:id/status | Changer statut | Authentifié |
| POST | /tickets/:id/comments | Ajouter commentaire | Authentifié |

### Dépendances

| Dépend de | Utilisé par |
|-----------|-------------|
| Common, Prisma, Users | Billing, Reporting |

---

## 4. Module Billing

### Responsabilités

| Responsabilité | Description |
|----------------|-------------|
| Gestion des factures | CRUD complet sur les factures |
| Calculs financiers | Calcul HT, TVA, TTC |
| Paiements | Enregistrement des règlements |
| Workflow facturation | Gestion des transitions de statut |

### Entités

```
┌─────────────────────────────────────────────────────────────┐
│                        INVOICE                               │
├─────────────────────────────────────────────────────────────┤
│ id          : UUID (PK)                                      │
│ reference   : String (UNIQUE) - INV-YYYYMMDD-XXXX           │
│ status      : Enum (DRAFT, SENT, PAID, ...)                 │
│ issueDate   : DateTime                                       │
│ dueDate     : DateTime                                       │
│ subtotal    : Decimal(10,2)                                  │
│ taxRate     : Decimal(5,2) - default: 20.00                 │
│ taxAmount   : Decimal(10,2)                                  │
│ total       : Decimal(10,2)                                  │
│ notes       : Text (nullable)                                │
│ createdById : UUID (FK → User)                              │
│ createdAt   : DateTime                                       │
│ updatedAt   : DateTime                                       │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │ 1:N                          │ 1:N
         ▼                              ▼
┌─────────────────────────┐    ┌────────────────────────────┐
│     INVOICE_LINE        │    │         PAYMENT             │
├─────────────────────────┤    ├────────────────────────────┤
│ id          : UUID      │    │ id        : UUID           │
│ description : String    │    │ amount    : Decimal(10,2)  │
│ quantity    : Integer   │    │ method    : Enum           │
│ unitPrice   : Decimal   │    │ reference : String         │
│ total       : Decimal   │    │ paidAt    : DateTime       │
│ invoiceId   : UUID      │    │ invoiceId : UUID           │
│ ticketId    : UUID      │    │ createdAt : DateTime       │
└─────────────────────────┘    └────────────────────────────┘
```

### Endpoints API

| Méthode | Endpoint | Description | Rôles |
|---------|----------|-------------|-------|
| GET | /invoices | Liste des factures | ADMIN, MANAGER |
| GET | /invoices/stats | Statistiques | ADMIN, MANAGER |
| GET | /invoices/:id | Détail facture | ADMIN, MANAGER |
| POST | /invoices | Créer facture | ADMIN, MANAGER |
| PUT | /invoices/:id/send | Envoyer facture | ADMIN, MANAGER |
| PUT | /invoices/:id/cancel | Annuler facture | ADMIN, MANAGER |
| DELETE | /invoices/:id | Supprimer facture | ADMIN |
| GET | /payments | Liste des paiements | ADMIN, MANAGER |
| GET | /payments/:id | Détail paiement | ADMIN, MANAGER |
| POST | /payments | Enregistrer paiement | ADMIN, MANAGER |

### Dépendances

| Dépend de | Utilisé par |
|-----------|-------------|
| Common, Prisma, Users, Tickets | Reporting |

---

## 5. Module Reporting

### Responsabilités

| Responsabilité | Description |
|----------------|-------------|
| Dashboard | Agrégation des données temps réel |
| KPIs | Calcul des indicateurs de performance |
| Rapports | Génération de rapports personnalisés |
| Exports | Export des données en CSV |

### KPIs calculés

| KPI | Source | Calcul |
|-----|--------|--------|
| Tickets ouverts | Tickets | COUNT(status NOT IN [CLOSED, CANCELLED]) |
| Tickets critiques | Tickets | COUNT(priority=CRITICAL AND status!=CLOSED) |
| Temps moyen résolution | Tickets | AVG(resolvedAt - createdAt) |
| Taux résolution | Tickets | RESOLVED / TOTAL * 100 |
| CA mensuel | Billing | SUM(total WHERE status=PAID AND month=current) |
| Factures en retard | Billing | COUNT(status=OVERDUE) |

### Endpoints API

| Méthode | Endpoint | Description | Rôles |
|---------|----------|-------------|-------|
| GET | /dashboard | Dashboard complet | ADMIN, MANAGER, AGENT |
| GET | /dashboard/tickets | Stats tickets | ADMIN, MANAGER, AGENT |
| GET | /dashboard/billing | Stats facturation | ADMIN, MANAGER |
| GET | /dashboard/users | Stats utilisateurs | ADMIN, MANAGER |
| GET | /dashboard/activity | Activité récente | ADMIN, MANAGER, AGENT |
| GET | /reports/tickets | Rapport tickets | ADMIN, MANAGER |
| GET | /reports/billing | Rapport facturation | ADMIN, MANAGER |
| GET | /reports/performance | Rapport performance | ADMIN, MANAGER |
| POST | /reports/export/csv | Export CSV | ADMIN, MANAGER |

### Dépendances

| Dépend de | Utilisé par |
|-----------|-------------|
| Common, Prisma, Users, Tickets, Billing | - |

---

## Matrice des dépendances inter-modules

```
              ┌─────────┬─────────┬─────────┬─────────┬─────────┐
              │ Common  │  Users  │ Tickets │ Billing │Reporting│
┌─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│   Common    │    -    │    ✓    │    ✓    │    ✓    │    ✓    │
├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│   Users     │    ✗    │    -    │    ✓    │    ✓    │    ✓    │
├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│   Tickets   │    ✗    │    ✗    │    -    │    ✓    │    ✓    │
├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│   Billing   │    ✗    │    ✗    │    ✗    │    -    │    ✓    │
├─────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│  Reporting  │    ✗    │    ✗    │    ✗    │    ✗    │    -    │
└─────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

✓ = Le module ligne utilise le module colonne
✗ = Pas de dépendance
```

---

## Flux de données principaux

### Flux 1: Création et traitement d'un ticket

```
Client                Users              Tickets             Billing
  │                     │                   │                   │
  │──── Login ──────────▶                   │                   │
  │◀─── JWT Token ──────│                   │                   │
  │                     │                   │                   │
  │──── Create Ticket ──────────────────────▶                   │
  │◀─── Ticket Created ─────────────────────│                   │
  │                     │                   │                   │
  │                   Agent                 │                   │
  │                     │                   │                   │
  │                     │──── Assign ───────▶                   │
  │                     │◀─── Status: IP ───│                   │
  │                     │                   │                   │
  │                     │──── Resolve ──────▶                   │
  │                     │◀─── Status: RES ──│                   │
  │                     │                   │                   │
  │                  Manager                │                   │
  │                     │                   │                   │
  │                     │──── Create Invoice ───────────────────▶
  │                     │◀─── Invoice Created ──────────────────│
```

### Flux 2: Génération du Dashboard

```
Manager             Reporting           Tickets            Billing             Users
  │                    │                   │                  │                  │
  │──── Get Dashboard ─▶                   │                  │                  │
  │                    │                   │                  │                  │
  │                    │──── Get Stats ────▶                  │                  │
  │                    │◀─── Ticket Stats ─│                  │                  │
  │                    │                   │                  │                  │
  │                    │──── Get Stats ────────────────────────▶                  │
  │                    │◀─── Billing Stats ────────────────────│                  │
  │                    │                   │                  │                  │
  │                    │──── Get Stats ─────────────────────────────────────────▶
  │                    │◀─── User Stats ────────────────────────────────────────│
  │                    │                   │                  │                  │
  │◀─── Dashboard ─────│                   │                  │                  │
```
