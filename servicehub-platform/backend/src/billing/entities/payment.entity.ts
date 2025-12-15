import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CASH = 'CASH',
  OTHER = 'OTHER',
}

export class PaymentEntity {
  @ApiProperty({ example: 'uuid-payment-id' })
  id: string;

  @ApiProperty({ example: 600.0 })
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD })
  method: PaymentMethod;

  @ApiProperty({ example: 'TXN-123456789', nullable: true })
  reference: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  paidAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 'uuid-invoice-id' })
  invoiceId: string;

  constructor(partial: Partial<PaymentEntity>) {
    Object.assign(this, partial);
  }
}
