import { ApiProperty } from '@nestjs/swagger';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export class InvoiceEntity {
  @ApiProperty({ example: 'uuid-invoice-id' })
  id: string;

  @ApiProperty({ example: 'INV-20240115-0001' })
  reference: string;

  @ApiProperty({ enum: InvoiceStatus, example: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  issueDate: Date;

  @ApiProperty({ example: '2024-02-15T00:00:00.000Z' })
  dueDate: Date;

  @ApiProperty({ example: 500.0 })
  subtotal: number;

  @ApiProperty({ example: 20.0 })
  taxRate: number;

  @ApiProperty({ example: 100.0 })
  taxAmount: number;

  @ApiProperty({ example: 600.0 })
  total: number;

  @ApiProperty({ example: 'Notes de la facture', nullable: true })
  notes: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 'uuid-user-id' })
  createdById: string;

  constructor(partial: Partial<InvoiceEntity>) {
    Object.assign(this, partial);
  }
}
