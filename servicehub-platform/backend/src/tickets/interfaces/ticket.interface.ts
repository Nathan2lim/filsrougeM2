import { TicketStatus, TicketPriority } from '../enums';

export interface ITicket {
  id: string;
  reference: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  dueDate: Date | null;
  createdById: string;
  assignedToId: string | null;
}

export interface ITicketComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
  ticketId: string;
  authorId: string;
}

export interface IAttachment {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  ticketId: string;
}

export interface ITicketStats {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
  };
  critical: number;
}
