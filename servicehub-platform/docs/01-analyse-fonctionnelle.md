# Analyse Fonctionnelle - ServiceHub Platform

## 1. Présentation du projet

### 1.1 Contexte

ServiceHub Solutions est un éditeur de solutions numériques B2B spécialisé dans les outils de gestion de la relation client. Face à une croissance rapide et des exigences clients de plus en plus élevées, l'entreprise a décidé de développer une plateforme SaaS moderne pour la gestion de services clients.

### 1.2 Objectifs

- **Centraliser** la gestion des demandes clients (tickets)
- **Automatiser** les processus de facturation
- **Fournir** des indicateurs de performance en temps réel
- **Garantir** une disponibilité 24/7
- **Permettre** une évolution fonctionnelle rapide

### 1.3 Périmètre

La plateforme ServiceHub couvre les domaines fonctionnels suivants :
- Gestion des utilisateurs et des accès
- Gestion du cycle de vie des tickets
- Facturation et suivi des paiements
- Reporting et tableaux de bord

---

## 2. Acteurs du système

### 2.1 ADMIN (Administrateur système)

**Description** : Utilisateur ayant un accès total à la plateforme. Responsable de la configuration système et de la gestion globale.

**Permissions** :
- `users:read`, `users:write`, `users:delete`
- `tickets:read`, `tickets:write`, `tickets:delete`, `tickets:assign`
- `billing:read`, `billing:write`, `billing:delete`
- `reporting:read`, `reporting:export`
- `roles:read`, `roles:write`

**Cas d'usage associés** :
- Créer/modifier/supprimer des utilisateurs
- Gérer les rôles et permissions
- Accéder à tous les rapports
- Configurer les paramètres système

### 2.2 MANAGER (Gestionnaire de compte)

**Description** : Responsable d'une équipe d'agents. Gère les aspects opérationnels et financiers.

**Permissions** :
- `users:read`, `users:write`
- `tickets:read`, `tickets:write`, `tickets:assign`
- `billing:read`, `billing:write`
- `reporting:read`, `reporting:export`

**Cas d'usage associés** :
- Superviser l'équipe d'agents
- Assigner les tickets aux agents
- Créer et gérer les factures
- Consulter les rapports de performance

### 2.3 AGENT (Agent support)

**Description** : Membre de l'équipe support. Traite les demandes clients au quotidien.

**Permissions** :
- `tickets:read`, `tickets:write`
- `users:read`

**Cas d'usage associés** :
- Traiter les tickets assignés
- Ajouter des commentaires aux tickets
- Changer le statut des tickets
- Consulter les informations clients

### 2.4 CLIENT (Client final)

**Description** : Utilisateur de la plateforme cliente. Crée des demandes et consulte leur avancement.

**Permissions** :
- `tickets:read:own`, `tickets:write:own`
- `billing:read:own`

**Cas d'usage associés** :
- Créer des tickets
- Consulter ses propres tickets
- Ajouter des commentaires
- Consulter ses factures

### 2.5 SYSTEM (Système externe)

**Description** : Acteur technique représentant les systèmes externes interagissant via l'API.

**Cas d'usage associés** :
- Appels API automatisés
- Intégrations tierces
- Webhooks

---

## 3. Domaines fonctionnels

### 3.1 Module Users (Gestion des utilisateurs)

#### Fonctionnalités principales

| Fonctionnalité | Description | Acteurs |
|----------------|-------------|---------|
| Authentification JWT | Connexion sécurisée avec tokens | Tous |
| Gestion CRUD utilisateurs | Créer, lire, modifier, supprimer | ADMIN, MANAGER |
| Gestion des rôles | Attribution et modification des rôles | ADMIN |
| Profil utilisateur | Consultation et modification du profil | Tous |
| Activation/Désactivation | Activer ou désactiver un compte | ADMIN, MANAGER |

#### Entités

- **User** : id, email, password, firstName, lastName, isActive, roleId, createdAt, updatedAt
- **Role** : id, name, description, permissions[], createdAt, updatedAt

### 3.2 Module Tickets (Gestion des demandes)

#### Cycle de vie d'un ticket

```
OPEN → IN_PROGRESS → WAITING_CLIENT/WAITING_INTERNAL → RESOLVED → CLOSED
                  ↓
             CANCELLED
```

#### États du ticket

| Statut | Description |
|--------|-------------|
| OPEN | Ticket créé, en attente de prise en charge |
| IN_PROGRESS | Ticket en cours de traitement par un agent |
| WAITING_CLIENT | En attente d'une réponse du client |
| WAITING_INTERNAL | En attente d'une action interne |
| RESOLVED | Ticket résolu, en attente de validation |
| CLOSED | Ticket clôturé définitivement |
| CANCELLED | Ticket annulé |

#### Priorités

| Priorité | Description | SLA indicatif |
|----------|-------------|---------------|
| LOW | Demande non urgente | 5 jours |
| MEDIUM | Demande standard | 2 jours |
| HIGH | Demande importante | 1 jour |
| CRITICAL | Urgence absolue | 4 heures |

#### Entités

- **Ticket** : id, reference, title, description, status, priority, createdById, assignedToId, resolvedAt, dueDate
- **TicketComment** : id, content, isInternal, ticketId, authorId
- **Attachment** : id, filename, path, mimeType, size, ticketId

### 3.3 Module Billing (Facturation)

#### Cycle de vie d'une facture

```
DRAFT → SENT → PAID
         ↓      ↑
    PARTIALLY_PAID
         ↓
      OVERDUE → CANCELLED
```

#### États de la facture

| Statut | Description |
|--------|-------------|
| DRAFT | Brouillon, modifiable |
| SENT | Envoyée au client |
| PAID | Entièrement payée |
| PARTIALLY_PAID | Partiellement payée |
| OVERDUE | En retard de paiement |
| CANCELLED | Annulée |

#### Méthodes de paiement

- CREDIT_CARD : Carte bancaire
- BANK_TRANSFER : Virement bancaire
- CHECK : Chèque
- CASH : Espèces
- OTHER : Autre

#### Entités

- **Invoice** : id, reference, status, issueDate, dueDate, subtotal, taxRate, taxAmount, total, notes, createdById
- **InvoiceLine** : id, description, quantity, unitPrice, total, invoiceId, ticketId
- **Payment** : id, amount, method, reference, paidAt, invoiceId

### 3.4 Module Reporting (Pilotage)

#### KPIs principaux

| KPI | Description | Formule |
|-----|-------------|---------|
| Tickets ouverts | Nombre de tickets non clôturés | COUNT(status NOT IN [CLOSED, CANCELLED]) |
| Temps moyen de résolution | Durée moyenne de traitement | AVG(resolvedAt - createdAt) |
| Taux de résolution | % de tickets résolus | RESOLVED / TOTAL * 100 |
| CA mensuel | Chiffre d'affaires du mois | SUM(invoices.total WHERE status=PAID) |
| Factures en retard | Nombre de factures non payées | COUNT(status=OVERDUE) |

#### Fonctionnalités

- Dashboard temps réel
- Rapports personnalisables
- Export CSV
- Graphiques et visualisations

---

## 4. Cas d'usage principaux

### UC01 - Authentification

**Acteur** : Tous
**Préconditions** : Compte utilisateur existant et actif
**Scénario principal** :
1. L'utilisateur saisit son email et mot de passe
2. Le système valide les identifiants
3. Le système génère un token JWT
4. L'utilisateur accède à la plateforme

### UC02 - Création d'un ticket

**Acteur** : CLIENT, AGENT, MANAGER, ADMIN
**Préconditions** : Utilisateur authentifié
**Scénario principal** :
1. L'utilisateur accède au formulaire de création
2. L'utilisateur saisit titre, description, priorité
3. Le système génère une référence unique (TKT-YYYYMMDD-XXXX)
4. Le ticket est créé avec le statut OPEN

### UC03 - Traitement d'un ticket

**Acteur** : AGENT
**Préconditions** : Ticket assigné à l'agent
**Scénario principal** :
1. L'agent consulte le ticket
2. L'agent passe le statut en IN_PROGRESS
3. L'agent ajoute des commentaires
4. L'agent résout le ticket (statut RESOLVED)

### UC04 - Assignation d'un ticket

**Acteur** : MANAGER, ADMIN
**Préconditions** : Ticket existant, Agent disponible
**Scénario principal** :
1. Le manager sélectionne un ticket
2. Le manager choisit un agent
3. Le système assigne le ticket
4. Le statut passe automatiquement à IN_PROGRESS

### UC05 - Création d'une facture

**Acteur** : MANAGER, ADMIN
**Préconditions** : Utilisateur authentifié avec droits billing
**Scénario principal** :
1. L'utilisateur accède à la création de facture
2. L'utilisateur ajoute les lignes de facturation
3. Le système calcule les montants (HT, TVA, TTC)
4. La facture est créée en statut DRAFT

### UC06 - Enregistrement d'un paiement

**Acteur** : MANAGER, ADMIN
**Préconditions** : Facture existante (SENT ou PARTIALLY_PAID)
**Scénario principal** :
1. L'utilisateur sélectionne une facture
2. L'utilisateur saisit le montant et la méthode
3. Le système enregistre le paiement
4. Le système met à jour le statut (PAID ou PARTIALLY_PAID)

### UC07 - Consultation du dashboard

**Acteur** : ADMIN, MANAGER, AGENT
**Préconditions** : Utilisateur authentifié
**Scénario principal** :
1. L'utilisateur accède au dashboard
2. Le système affiche les KPIs
3. L'utilisateur peut filtrer par période
4. Les données sont mises à jour en temps réel

### UC08 - Export de rapport

**Acteur** : ADMIN, MANAGER
**Préconditions** : Utilisateur authentifié avec droits reporting
**Scénario principal** :
1. L'utilisateur sélectionne le type de rapport
2. L'utilisateur définit les filtres
3. Le système génère le rapport
4. L'utilisateur télécharge le fichier CSV

### UC09 - Gestion des utilisateurs

**Acteur** : ADMIN
**Préconditions** : Utilisateur authentifié avec rôle ADMIN
**Scénario principal** :
1. L'admin accède à la liste des utilisateurs
2. L'admin peut créer/modifier/supprimer des utilisateurs
3. L'admin peut activer/désactiver des comptes
4. L'admin peut modifier les rôles

### UC10 - Consultation des tickets (Client)

**Acteur** : CLIENT
**Préconditions** : Utilisateur CLIENT authentifié
**Scénario principal** :
1. Le client accède à "Mes tickets"
2. Le système affiche uniquement ses tickets
3. Le client peut filtrer et rechercher
4. Le client peut ajouter des commentaires

---

## 5. Règles métier

### Gestion des utilisateurs

| ID | Règle |
|----|-------|
| RG01 | Un email doit être unique dans le système |
| RG02 | Un mot de passe doit contenir au minimum 8 caractères |
| RG03 | Un utilisateur désactivé ne peut pas se connecter |
| RG04 | Le rôle ADMIN ne peut pas être supprimé |
| RG05 | Un utilisateur doit obligatoirement avoir un rôle |

### Gestion des tickets

| ID | Règle |
|----|-------|
| RG06 | Un ticket ne peut être assigné qu'à un agent actif |
| RG07 | La référence ticket suit le format TKT-YYYYMMDD-XXXX |
| RG08 | Le passage en RESOLVED nécessite un commentaire de résolution |
| RG09 | Un ticket CLOSED ou CANCELLED ne peut plus être modifié |
| RG10 | Seul le créateur ou un agent assigné peut modifier un ticket |
| RG11 | Un ticket CRITICAL doit être traité dans les 4 heures |
| RG12 | L'assignation d'un ticket OPEN le passe automatiquement en IN_PROGRESS |
| RG13 | Un client ne peut voir que ses propres tickets |
| RG14 | Les commentaires internes ne sont pas visibles par les clients |
| RG15 | Un ticket ne peut avoir qu'un seul agent assigné à la fois |

### Facturation

| ID | Règle |
|----|-------|
| RG16 | Une facture SENT ne peut plus être modifiée |
| RG17 | La référence facture suit le format INV-YYYYMMDD-XXXX |
| RG18 | Le taux de TVA par défaut est de 20% |
| RG19 | Une facture doit contenir au moins une ligne |
| RG20 | Seules les factures DRAFT peuvent être supprimées |
| RG21 | Une facture PAID ne peut pas être annulée |
| RG22 | Le montant total est calculé automatiquement (HT + TVA) |
| RG23 | Un paiement ne peut pas dépasser le montant restant dû |
| RG24 | Une facture devient OVERDUE si non payée après la date d'échéance |
| RG25 | La date d'échéance par défaut est de 30 jours |

---

## 6. Glossaire métier

| Terme | Définition |
|-------|------------|
| **Ticket** | Demande ou incident créé par un utilisateur nécessitant une action |
| **SLA** | Service Level Agreement - Engagement de niveau de service |
| **KPI** | Key Performance Indicator - Indicateur clé de performance |
| **HT** | Hors Taxes - Montant avant application de la TVA |
| **TTC** | Toutes Taxes Comprises - Montant final incluant la TVA |
| **TVA** | Taxe sur la Valeur Ajoutée - Impôt indirect sur la consommation |
| **JWT** | JSON Web Token - Standard de création de tokens d'accès |
| **CRUD** | Create, Read, Update, Delete - Opérations de base sur les données |
| **SaaS** | Software as a Service - Logiciel en tant que service |
| **B2B** | Business to Business - Commerce entre entreprises |
| **API** | Application Programming Interface - Interface de programmation |
| **REST** | Representational State Transfer - Style d'architecture pour API web |
