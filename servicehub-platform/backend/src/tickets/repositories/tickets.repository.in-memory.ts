import { Injectable } from '@nestjs/common';
import { ITicketsRepository, TicketWithRelations } from './tickets.repository.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implémentation In-Memory du repository Tickets
 * Utilisée pour les tests et le développement sans base de données
 */
@Injectable()
export class TicketsRepositoryInMemory implements ITicketsRepository {
  private tickets: Map<string, TicketWithRelations> = new Map();
  private comments: Map<string, TicketComment[]> = new Map();

  async create(data: {
    reference: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    createdById: string;
    assignedToId?: string;
    dueDate?: Date;
  }): Promise<TicketWithRelations> {
    const ticket: TicketWithRelations = {
      id: uuidv4(),
      reference: data.reference,
      title: data.title,
      description: data.description,
      status: data.status as TicketStatus,
      priority: data.priority as TicketPriority,
      createdById: data.createdById,
      assignedToId: data.assignedToId || null,
      dueDate: data.dueDate || null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: {
        id: data.createdById,
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Creator',
      },
      assignedTo: data.assignedToId
        ? {
            id: data.assignedToId,
            email: 'tech@example.com',
            firstName: 'Tech',
            lastName: 'Assigned',
          }
        : null,
      comments: [],
      _count: { comments: 0, attachments: 0 },
    };

    this.tickets.set(ticket.id, ticket);
    this.comments.set(ticket.id, []);
    return ticket;
  }

  async findById(id: string): Promise<TicketWithRelations | null> {
    const ticket = this.tickets.get(id);
    if (ticket) {
      ticket.comments = this.comments.get(id) || [];
      ticket._count.comments = ticket.comments.length;
    }
    return ticket || null;
  }

  async findByReference(reference: string): Promise<TicketWithRelations | null> {
    for (const ticket of this.tickets.values()) {
      if (ticket.reference === reference) {
        ticket.comments = this.comments.get(ticket.id) || [];
        ticket._count.comments = ticket.comments.length;
        return ticket;
      }
    }
    return null;
  }

  async findMany(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<TicketWithRelations[]> {
    let result = Array.from(this.tickets.values());

    // Filtrage basique
    if (options.where) {
      result = result.filter((ticket) => {
        return Object.entries(options.where!).every(([key, value]) => {
          return (ticket as Record<string, unknown>)[key] === value;
        });
      });
    }

    // Tri
    if (options.orderBy) {
      const [field, order] = Object.entries(options.orderBy)[0];
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[field];
        const bVal = (b as Record<string, unknown>)[field];
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Ajouter les commentaires
    result = result.map((ticket) => ({
      ...ticket,
      comments: (this.comments.get(ticket.id) || []).slice(0, 10),
      _count: {
        comments: (this.comments.get(ticket.id) || []).length,
        attachments: ticket._count.attachments,
      },
    }));

    // Pagination
    const skip = options.skip || 0;
    const take = options.take || result.length;
    return result.slice(skip, skip + take);
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    if (!where) {
      return this.tickets.size;
    }
    const filtered = await this.findMany({ where });
    return filtered.length;
  }

  async countToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let count = 0;
    for (const ticket of this.tickets.values()) {
      if (ticket.createdAt >= today && ticket.createdAt < tomorrow) {
        count++;
      }
    }
    return count;
  }

  async update(id: string, data: Record<string, unknown>): Promise<TicketWithRelations> {
    const ticket = this.tickets.get(id);
    if (!ticket) {
      throw new Error(`Ticket with id ${id} not found`);
    }

    const updatedTicket: TicketWithRelations = {
      ...ticket,
      ...data,
      updatedAt: new Date(),
    } as TicketWithRelations;

    // Gérer le passage en RESOLVED
    if (data.status === 'RESOLVED' && !ticket.resolvedAt) {
      updatedTicket.resolvedAt = new Date();
    }

    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async delete(id: string): Promise<void> {
    this.tickets.delete(id);
    this.comments.delete(id);
  }

  async addComment(
    ticketId: string,
    data: { content: string; isInternal: boolean; authorId: string },
  ): Promise<TicketComment> {
    const ticketComments = this.comments.get(ticketId) || [];

    const comment: TicketComment = {
      id: uuidv4(),
      ticketId,
      content: data.content,
      isInternal: data.isInternal,
      authorId: data.authorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    ticketComments.unshift(comment);
    this.comments.set(ticketId, ticketComments);

    // Mettre à jour le compteur
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      ticket._count.comments = ticketComments.length;
    }

    return comment;
  }

  // Méthode utilitaire pour les tests
  clear(): void {
    this.tickets.clear();
    this.comments.clear();
  }
}

// Types locaux pour éviter la dépendance Prisma
type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_CLIENT'
  | 'WAITING_INTERNAL'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}
