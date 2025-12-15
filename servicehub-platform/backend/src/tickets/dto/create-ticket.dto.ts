import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TicketPriority } from '../enums';

export class CreateTicketDto {
  @ApiProperty({
    example: 'Problème de connexion',
    description: 'Titre du ticket',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le titre est requis' })
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  title: string;

  @ApiProperty({
    example: 'Je n\'arrive pas à me connecter depuis ce matin...',
    description: 'Description détaillée du problème',
  })
  @IsString()
  @IsNotEmpty({ message: 'La description est requise' })
  @MaxLength(5000, { message: 'La description ne peut pas dépasser 5000 caractères' })
  description: string;

  @ApiPropertyOptional({
    enum: TicketPriority,
    example: TicketPriority.MEDIUM,
    description: 'Priorité du ticket',
  })
  @IsEnum(TicketPriority, { message: 'Priorité invalide' })
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({
    example: 'uuid-user-id',
    description: 'ID de l\'agent assigné',
  })
  @IsUUID('4', { message: 'L\'ID de l\'agent doit être un UUID valide' })
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({
    example: '2024-01-20T00:00:00.000Z',
    description: 'Date d\'échéance',
  })
  @IsDateString({}, { message: 'Date d\'échéance invalide' })
  @IsOptional()
  dueDate?: string;
}
