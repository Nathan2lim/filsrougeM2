import { v4 as uuidv4 } from 'uuid';
import { referenceGenerator } from '../singleton/reference-generator.singleton';

/**
 * Builder pour la construction de tickets
 * Permet une construction fluide et flexible des tickets
 */

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'WAITING_INTERNAL' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BuiltTicket {
  id: string;
  reference: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdById: string;
  assignedToId: string | null;
  dueDate: Date | null;
  resolvedAt: Date | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class TicketBuilder {
  private id: string;
  private reference: string | null = null;
  private title: string | null = null;
  private description: string | null = null;
  private status: TicketStatus = 'OPEN';
  private priority: TicketPriority = 'MEDIUM';
  private createdById: string | null = null;
  private assignedToId: string | null = null;
  private dueDate: Date | null = null;
  private tags: string[] = [];

  constructor() {
    this.id = uuidv4();
  }

  /**
   * Crée une nouvelle instance du builder
   */
  public static create(): TicketBuilder {
    return new TicketBuilder();
  }

  /**
   * Définit le titre
   */
  public withTitle(title: string): TicketBuilder {
    this.title = title;
    return this;
  }

  /**
   * Définit la description
   */
  public withDescription(description: string): TicketBuilder {
    this.description = description;
    return this;
  }

  /**
   * Définit la référence (sinon générée automatiquement)
   */
  public withReference(reference: string): TicketBuilder {
    this.reference = reference;
    return this;
  }

  /**
   * Définit le statut
   */
  public withStatus(status: TicketStatus): TicketBuilder {
    this.status = status;
    return this;
  }

  /**
   * Définit la priorité
   */
  public withPriority(priority: TicketPriority): TicketBuilder {
    this.priority = priority;
    return this;
  }

  /**
   * Définit une priorité basse
   */
  public asLowPriority(): TicketBuilder {
    this.priority = 'LOW';
    return this;
  }

  /**
   * Définit une priorité moyenne
   */
  public asMediumPriority(): TicketBuilder {
    this.priority = 'MEDIUM';
    return this;
  }

  /**
   * Définit une priorité haute
   */
  public asHighPriority(): TicketBuilder {
    this.priority = 'HIGH';
    return this;
  }

  /**
   * Définit une priorité critique
   */
  public asCritical(): TicketBuilder {
    this.priority = 'CRITICAL';
    return this;
  }

  /**
   * Définit le créateur
   */
  public createdBy(userId: string): TicketBuilder {
    this.createdById = userId;
    return this;
  }

  /**
   * Assigne à un technicien
   */
  public assignedTo(userId: string): TicketBuilder {
    this.assignedToId = userId;
    return this;
  }

  /**
   * Définit la date d'échéance
   */
  public withDueDate(date: Date): TicketBuilder {
    this.dueDate = date;
    return this;
  }

  /**
   * Définit l'échéance dans X heures
   */
  public dueInHours(hours: number): TicketBuilder {
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + hours);
    this.dueDate = dueDate;
    return this;
  }

  /**
   * Définit l'échéance dans X jours
   */
  public dueInDays(days: number): TicketBuilder {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    this.dueDate = dueDate;
    return this;
  }

  /**
   * Ajoute un tag
   */
  public addTag(tag: string): TicketBuilder {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    return this;
  }

  /**
   * Ajoute plusieurs tags
   */
  public addTags(tags: string[]): TicketBuilder {
    tags.forEach((tag) => this.addTag(tag));
    return this;
  }

  /**
   * Configure comme ticket urgent
   */
  public asUrgent(): TicketBuilder {
    this.priority = 'CRITICAL';
    this.dueInHours(24);
    this.addTag('urgent');
    return this;
  }

  /**
   * Configure comme ticket de support standard
   */
  public asSupport(): TicketBuilder {
    this.priority = 'MEDIUM';
    this.dueInDays(3);
    this.addTag('support');
    return this;
  }

  /**
   * Configure comme ticket de maintenance
   */
  public asMaintenance(): TicketBuilder {
    this.priority = 'LOW';
    this.dueInDays(7);
    this.addTag('maintenance');
    return this;
  }

  /**
   * Configure comme ticket de bug
   */
  public asBug(): TicketBuilder {
    this.priority = 'HIGH';
    this.dueInDays(2);
    this.addTag('bug');
    return this;
  }

  /**
   * Configure comme demande de fonctionnalité
   */
  public asFeatureRequest(): TicketBuilder {
    this.priority = 'LOW';
    this.addTag('feature-request');
    return this;
  }

  /**
   * Construit le ticket final
   */
  public build(): BuiltTicket {
    // Validations
    if (!this.title) {
      throw new Error('Ticket must have a title (use withTitle())');
    }
    if (!this.description) {
      throw new Error('Ticket must have a description (use withDescription())');
    }
    if (!this.createdById) {
      throw new Error('Ticket must have a creator (use createdBy())');
    }

    const now = new Date();
    const reference = this.reference || referenceGenerator.generateTicketReference();

    return {
      id: this.id,
      reference,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      createdById: this.createdById,
      assignedToId: this.assignedToId,
      dueDate: this.dueDate,
      resolvedAt: null,
      tags: [...this.tags],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Réinitialise le builder pour réutilisation
   */
  public reset(): TicketBuilder {
    this.id = uuidv4();
    this.reference = null;
    this.title = null;
    this.description = null;
    this.status = 'OPEN';
    this.priority = 'MEDIUM';
    this.createdById = null;
    this.assignedToId = null;
    this.dueDate = null;
    this.tags = [];
    return this;
  }
}
