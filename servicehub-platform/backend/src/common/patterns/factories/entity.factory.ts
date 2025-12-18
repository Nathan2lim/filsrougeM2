import { Injectable } from '@nestjs/common';
import { TicketFactory, TicketData, Ticket } from './ticket.factory';
import { InvoiceFactory, InvoiceData, Invoice } from './invoice.factory';
import { UserFactory, UserData, User, Role, RoleName } from './user.factory';
import { TicketBuilder } from '../builders/ticket.builder';
import { InvoiceBuilder } from '../builders/invoice.builder';

/**
 * Factory Globale (Abstract Factory Pattern)
 * Point d'entrée unique pour la création de toutes les entités métier
 * Centralise l'instanciation et permet de changer facilement les implémentations
 */

export type EntityType = 'ticket' | 'invoice' | 'user' | 'role';

@Injectable()
export class EntityFactory {
  private readonly ticketFactory: TicketFactory;
  private readonly invoiceFactory: InvoiceFactory;
  private readonly userFactory: UserFactory;

  constructor() {
    this.ticketFactory = new TicketFactory();
    this.invoiceFactory = new InvoiceFactory();
    this.userFactory = new UserFactory();
  }

  // ============================================================
  // TICKETS
  // ============================================================

  /**
   * Crée un ticket standard
   */
  createTicket(data: TicketData): Ticket {
    return this.ticketFactory.create(data);
  }

  /**
   * Crée un ticket urgent
   */
  createUrgentTicket(data: Omit<TicketData, 'priority' | 'dueDate'>): Ticket {
    return this.ticketFactory.createUrgent(data);
  }

  /**
   * Crée un ticket de support
   */
  createSupportTicket(data: Omit<TicketData, 'priority'>): Ticket {
    return this.ticketFactory.createSupport(data);
  }

  /**
   * Crée un ticket de maintenance
   */
  createMaintenanceTicket(data: Omit<TicketData, 'priority'>): Ticket {
    return this.ticketFactory.createMaintenance(data);
  }

  /**
   * Obtient un builder pour construction personnalisée de ticket
   */
  getTicketBuilder(): TicketBuilder {
    return TicketBuilder.create();
  }

  // ============================================================
  // INVOICES
  // ============================================================

  /**
   * Crée une facture standard
   */
  createInvoice(data: InvoiceData): Invoice {
    return this.invoiceFactory.create(data);
  }

  /**
   * Crée un proforma (devis)
   */
  createProforma(data: InvoiceData): Invoice {
    return this.invoiceFactory.createProforma(data);
  }

  /**
   * Crée une facture avec TVA réduite
   */
  createInvoiceWithReducedTax(data: Omit<InvoiceData, 'taxRate'>): Invoice {
    return this.invoiceFactory.createWithReducedTax(data);
  }

  /**
   * Crée une facture sans TVA
   */
  createInvoiceWithoutTax(data: Omit<InvoiceData, 'taxRate'>): Invoice {
    return this.invoiceFactory.createWithoutTax(data);
  }

  /**
   * Obtient un builder pour construction personnalisée de facture
   */
  getInvoiceBuilder(): InvoiceBuilder {
    return InvoiceBuilder.create();
  }

  // ============================================================
  // USERS
  // ============================================================

  /**
   * Crée un utilisateur (async - hachage du mot de passe)
   */
  async createUser(data: UserData): Promise<User> {
    return this.userFactory.create(data);
  }

  /**
   * Crée un utilisateur (sync - pour les tests)
   */
  createUserSync(data: UserData): User {
    return this.userFactory.createSync(data);
  }

  /**
   * Crée un administrateur
   */
  async createAdmin(data: Omit<UserData, 'roleId'>, adminRoleId: string): Promise<User> {
    return this.userFactory.createAdmin(data, adminRoleId);
  }

  /**
   * Crée un technicien
   */
  async createTechnician(data: Omit<UserData, 'roleId'>, technicianRoleId: string): Promise<User> {
    return this.userFactory.createTechnician(data, technicianRoleId);
  }

  /**
   * Crée un client
   */
  async createClient(data: Omit<UserData, 'roleId'>, clientRoleId: string): Promise<User> {
    return this.userFactory.createClient(data, clientRoleId);
  }

  // ============================================================
  // ROLES
  // ============================================================

  /**
   * Crée un rôle personnalisé
   */
  createRole(name: RoleName, description: string, permissions: string[]): Role {
    return this.userFactory.createRole(name, description, permissions);
  }

  /**
   * Crée les rôles par défaut du système
   */
  createDefaultRoles(): Role[] {
    return this.userFactory.createDefaultRoles();
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  /**
   * Réinitialise tous les compteurs (pour les tests)
   */
  resetAllCounters(): void {
    this.ticketFactory.resetCounter();
    this.invoiceFactory.resetCounter();
  }

  /**
   * Initialise les compteurs depuis la base de données
   */
  initializeCounters(data: {
    tickets?: { dateStr: string; value: number };
    invoices?: { dateStr: string; value: number };
  }): void {
    if (data.tickets) {
      this.ticketFactory.initializeCounter(data.tickets.dateStr, data.tickets.value);
    }
    if (data.invoices) {
      this.invoiceFactory.initializeCounter(data.invoices.dateStr, data.invoices.value);
    }
  }

  /**
   * Accès direct aux factories spécialisées si nécessaire
   */
  get tickets(): TicketFactory {
    return this.ticketFactory;
  }

  get invoices(): InvoiceFactory {
    return this.invoiceFactory;
  }

  get users(): UserFactory {
    return this.userFactory;
  }
}

// Instance singleton exportée pour utilisation simplifiée
let entityFactoryInstance: EntityFactory | null = null;

export function getEntityFactory(): EntityFactory {
  if (!entityFactoryInstance) {
    entityFactoryInstance = new EntityFactory();
  }
  return entityFactoryInstance;
}

export function resetEntityFactory(): void {
  entityFactoryInstance = null;
}
