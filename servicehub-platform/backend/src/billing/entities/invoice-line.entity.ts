import { ApiProperty } from '@nestjs/swagger';

export class InvoiceLineEntity {
  @ApiProperty({ example: 'uuid-line-id' })
  id: string;

  @ApiProperty({ example: 'Support technique - 2 heures' })
  description: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 50.0 })
  unitPrice: number;

  @ApiProperty({ example: 100.0 })
  total: number;

  @ApiProperty({ example: 'uuid-invoice-id' })
  invoiceId: string;

  @ApiProperty({ example: 'uuid-ticket-id', nullable: true })
  ticketId: string | null;

  constructor(partial: Partial<InvoiceLineEntity>) {
    Object.assign(this, partial);
  }
}
