import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  CASH = 'CASH',
  OTHER = 'OTHER',
}

export class CreatePaymentDto {
  @ApiProperty({
    example: 'uuid-invoice-id',
    description: 'ID de la facture associée',
  })
  @IsUUID('4', { message: 'L\'ID de la facture doit être un UUID valide' })
  @IsNotEmpty({ message: 'L\'ID de la facture est requis' })
  invoiceId: string;

  @ApiProperty({
    example: 600.0,
    description: 'Montant du paiement',
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Le montant est requis' })
  @Min(0.01, { message: 'Le montant doit être supérieur à 0' })
  amount: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
    description: 'Méthode de paiement',
  })
  @IsEnum(PaymentMethod, { message: 'Méthode de paiement invalide' })
  @IsNotEmpty({ message: 'La méthode de paiement est requise' })
  method: PaymentMethod;

  @ApiPropertyOptional({
    example: 'TXN-123456789',
    description: 'Référence externe du paiement',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'La référence ne peut pas dépasser 100 caractères' })
  reference?: string;
}
