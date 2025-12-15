import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TicketStatus, TicketPriority } from '../enums';

export class UpdateTicketDto {
  @ApiPropertyOptional({
    example: 'Problème de connexion (mis à jour)',
    description: 'Titre du ticket',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  title?: string;

  @ApiPropertyOptional({
    example: 'Description mise à jour...',
    description: 'Description détaillée du problème',
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'La description ne peut pas dépasser 5000 caractères' })
  description?: string;

  @ApiPropertyOptional({
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
    description: 'Statut du ticket',
  })
  @IsEnum(TicketStatus, { message: 'Statut invalide' })
  @IsOptional()
  status?: TicketStatus;

  @ApiPropertyOptional({
    enum: TicketPriority,
    example: TicketPriority.HIGH,
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
