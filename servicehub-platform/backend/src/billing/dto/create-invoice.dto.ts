import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceLineDto {
  @ApiProperty({
    example: 'Support technique - 2 heures',
    description: 'Description de la ligne',
  })
  @IsString()
  @IsNotEmpty({ message: 'La description est requise' })
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Quantité',
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'La quantité doit être au moins 1' })
  quantity?: number;

  @ApiProperty({
    example: 50.0,
    description: 'Prix unitaire HT',
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Le prix unitaire est requis' })
  @Min(0, { message: 'Le prix unitaire doit être positif' })
  unitPrice: number;

  @ApiPropertyOptional({
    example: 'uuid-ticket-id',
    description: 'ID du ticket associé (optionnel)',
  })
  @IsUUID('4', { message: 'L\'ID du ticket doit être un UUID valide' })
  @IsOptional()
  ticketId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({
    type: [CreateInvoiceLineDto],
    description: 'Lignes de la facture',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une ligne est requise' })
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  lines: CreateInvoiceLineDto[];

  @ApiPropertyOptional({
    example: 20.0,
    description: 'Taux de TVA en pourcentage',
    default: 20,
  })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Le taux de TVA doit être positif' })
  taxRate?: number;

  @ApiPropertyOptional({
    example: '2024-02-15T00:00:00.000Z',
    description: 'Date d\'échéance',
  })
  @IsDateString({}, { message: 'Date d\'échéance invalide' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    example: 'Facture mensuelle pour services de support',
    description: 'Notes additionnelles',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Les notes ne peuvent pas dépasser 1000 caractères' })
  notes?: string;
}
