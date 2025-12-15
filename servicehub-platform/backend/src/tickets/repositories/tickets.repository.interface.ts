import { Ticket, TicketComment, User } from '@prisma/client';

export type TicketWithRelations = Ticket & {
  createdBy: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  assignedTo: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null;
  comments: TicketComment[];
  _count: { comments: number; attachments: number };
};

export interface ITicketsRepository {
  create(data: {
    reference: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    createdById: string;
    assignedToId?: string;
    dueDate?: Date;
  }): Promise<TicketWithRelations>;

  findById(id: string): Promise<TicketWithRelations | null>;

  findByReference(reference: string): Promise<TicketWithRelations | null>;

  findMany(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<TicketWithRelations[]>;

  count(where?: Record<string, unknown>): Promise<number>;

  countToday(): Promise<number>;

  update(id: string, data: Record<string, unknown>): Promise<TicketWithRelations>;

  delete(id: string): Promise<void>;

  addComment(
    ticketId: string,
    data: { content: string; isInternal: boolean; authorId: string },
  ): Promise<TicketComment>;
}
