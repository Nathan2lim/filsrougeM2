import { Injectable } from '@nestjs/common';
import { TicketComment } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { ITicketsRepository, TicketWithRelations } from './tickets.repository.interface';

const ticketInclude = {
  createdBy: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
  assignedTo: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
  comments: {
    orderBy: { createdAt: 'desc' as const },
    take: 10,
  },
  _count: {
    select: { comments: true, attachments: true },
  },
};

@Injectable()
export class TicketsRepository implements ITicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.ticket.create({
      data: {
        reference: data.reference,
        title: data.title,
        description: data.description,
        status: data.status as 'OPEN',
        priority: data.priority as 'MEDIUM',
        createdById: data.createdById,
        assignedToId: data.assignedToId,
        dueDate: data.dueDate,
      },
      include: ticketInclude,
    });
  }

  async findById(id: string): Promise<TicketWithRelations | null> {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: ticketInclude,
    });
  }

  async findByReference(reference: string): Promise<TicketWithRelations | null> {
    return this.prisma.ticket.findUnique({
      where: { reference },
      include: ticketInclude,
    });
  }

  async findMany(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<TicketWithRelations[]> {
    return this.prisma.ticket.findMany({
      ...options,
      include: ticketInclude,
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.ticket.count({ where });
  }

  async countToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.ticket.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  async update(id: string, data: Record<string, unknown>): Promise<TicketWithRelations> {
    return this.prisma.ticket.update({
      where: { id },
      data,
      include: ticketInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ticket.delete({
      where: { id },
    });
  }

  async addComment(
    ticketId: string,
    data: { content: string; isInternal: boolean; authorId: string },
  ): Promise<TicketComment> {
    return this.prisma.ticketComment.create({
      data: {
        ticketId,
        content: data.content,
        isInternal: data.isInternal,
        authorId: data.authorId,
      },
    });
  }
}
