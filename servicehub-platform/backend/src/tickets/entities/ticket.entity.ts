import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus, TicketPriority } from '../enums';

export class TicketEntity {
  @ApiProperty({ example: 'uuid-ticket-id' })
  id: string;

  @ApiProperty({ example: 'TKT-20240115-0001' })
  reference: string;

  @ApiProperty({ example: 'Problème de connexion' })
  title: string;

  @ApiProperty({ example: 'Description détaillée du problème...' })
  description: string;

  @ApiProperty({ enum: TicketStatus, example: TicketStatus.OPEN })
  status: TicketStatus;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: '2024-01-16T14:00:00.000Z', nullable: true })
  resolvedAt: Date | null;

  @ApiProperty({ example: '2024-01-20T00:00:00.000Z', nullable: true })
  dueDate: Date | null;

  @ApiProperty({ example: 'uuid-user-id' })
  createdById: string;

  @ApiProperty({ example: 'uuid-user-id', nullable: true })
  assignedToId: string | null;

  constructor(partial: Partial<TicketEntity>) {
    Object.assign(this, partial);
  }
}
