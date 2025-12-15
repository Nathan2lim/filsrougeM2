import { Injectable, Inject } from '@nestjs/common';
import { ITicketsRepository } from '../repositories/tickets.repository.interface';
import { CreateTicketDto, UpdateTicketDto } from '../dto';
import { TicketStatus, TicketPriority } from '../enums';
import {
  EntityNotFoundException,
  InvalidOperationException,
} from '@common/exceptions';
import { generateReference } from '@common/utils';

interface FindAllParams {
  page: number;
  limit: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string;
  search?: string;
  userId?: string;
  userRole?: string;
}

@Injectable()
export class TicketsService {
  constructor(
    @Inject('ITicketsRepository')
    private readonly ticketsRepository: ITicketsRepository,
  ) {}

  async create(createTicketDto: CreateTicketDto, createdById: string) {
    const count = await this.ticketsRepository.countToday();
    const reference = generateReference('TKT', count + 1);

    return this.ticketsRepository.create({
      title: createTicketDto.title,
      description: createTicketDto.description,
      reference,
      createdById,
      status: TicketStatus.OPEN,
      priority: createTicketDto.priority || TicketPriority.MEDIUM,
      assignedToId: createTicketDto.assignedToId,
      dueDate: createTicketDto.dueDate ? new Date(createTicketDto.dueDate) : undefined,
    });
  }

  async findAll(params: FindAllParams) {
    const { page, limit, status, priority, assignedToId, search, userId, userRole } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Les clients ne voient que leurs propres tickets
    if (userRole === 'CLIENT' && userId) {
      where.createdById = userId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      this.ticketsRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.ticketsRepository.count(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findUserTickets(userId: string, params: { page: number; limit: number }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const where = {
      OR: [{ createdById: userId }, { assignedToId: userId }],
    };

    const [tickets, total] = await Promise.all([
      this.ticketsRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.ticketsRepository.count(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) {
      throw new EntityNotFoundException('Ticket', id);
    }
    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) {
      throw new EntityNotFoundException('Ticket', id);
    }

    if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.CANCELLED) {
      throw new InvalidOperationException(
        'Impossible de modifier un ticket fermé ou annulé',
      );
    }

    return this.ticketsRepository.update(id, { ...updateTicketDto });
  }

  async assign(id: string, assignedToId: string) {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) {
      throw new EntityNotFoundException('Ticket', id);
    }

    if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.CANCELLED) {
      throw new InvalidOperationException(
        'Impossible d\'assigner un ticket fermé ou annulé',
      );
    }

    const updateData: Record<string, unknown> = { assignedToId };

    // Si le ticket est OPEN, le passer automatiquement en IN_PROGRESS
    if (ticket.status === TicketStatus.OPEN) {
      updateData.status = TicketStatus.IN_PROGRESS;
    }

    return this.ticketsRepository.update(id, updateData);
  }

  async changeStatus(id: string, newStatus: TicketStatus) {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) {
      throw new EntityNotFoundException('Ticket', id);
    }

    // Validation des transitions de statut
    this.validateStatusTransition(ticket.status as TicketStatus, newStatus);

    const updateData: Record<string, unknown> = { status: newStatus };

    // Si on passe en RESOLVED, enregistrer la date de résolution
    if (newStatus === TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    return this.ticketsRepository.update(id, updateData);
  }

  private validateStatusTransition(currentStatus: TicketStatus, newStatus: TicketStatus) {
    const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.OPEN]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.CANCELLED,
      ],
      [TicketStatus.IN_PROGRESS]: [
        TicketStatus.WAITING_CLIENT,
        TicketStatus.WAITING_INTERNAL,
        TicketStatus.RESOLVED,
        TicketStatus.CANCELLED,
      ],
      [TicketStatus.WAITING_CLIENT]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
        TicketStatus.CANCELLED,
      ],
      [TicketStatus.WAITING_INTERNAL]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
        TicketStatus.CANCELLED,
      ],
      [TicketStatus.RESOLVED]: [
        TicketStatus.CLOSED,
        TicketStatus.IN_PROGRESS, // Réouverture
      ],
      [TicketStatus.CLOSED]: [],
      [TicketStatus.CANCELLED]: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new InvalidOperationException(
        `Transition de statut invalide: ${currentStatus} → ${newStatus}`,
      );
    }
  }

  async addComment(
    ticketId: string,
    data: { content: string; isInternal: boolean; authorId: string },
  ) {
    const ticket = await this.ticketsRepository.findById(ticketId);
    if (!ticket) {
      throw new EntityNotFoundException('Ticket', ticketId);
    }

    return this.ticketsRepository.addComment(ticketId, data);
  }

  async delete(id: string) {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) {
      throw new EntityNotFoundException('Ticket', id);
    }

    await this.ticketsRepository.delete(id);
    return { message: 'Ticket supprimé avec succès' };
  }

  async getStats() {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      criticalTickets,
    ] = await Promise.all([
      this.ticketsRepository.count(),
      this.ticketsRepository.count({ status: TicketStatus.OPEN }),
      this.ticketsRepository.count({ status: TicketStatus.IN_PROGRESS }),
      this.ticketsRepository.count({ status: TicketStatus.RESOLVED }),
      this.ticketsRepository.count({ priority: TicketPriority.CRITICAL }),
    ]);

    return {
      total: totalTickets,
      byStatus: {
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
      },
      critical: criticalTickets,
    };
  }
}
