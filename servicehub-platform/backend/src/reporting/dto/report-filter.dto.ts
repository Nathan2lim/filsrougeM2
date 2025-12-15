import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReportType {
  TICKETS = 'tickets',
  BILLING = 'billing',
  PERFORMANCE = 'performance',
}

export class ReportFilterDto {
  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Date de début',
  })
  @IsDateString({}, { message: 'Date de début invalide' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-01-31T23:59:59.999Z',
    description: 'Date de fin',
  })
  @IsDateString({}, { message: 'Date de fin invalide' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'OPEN',
    description: 'Filtre par statut',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'HIGH',
    description: 'Filtre par priorité (pour les tickets)',
  })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({
    enum: ReportType,
    example: ReportType.TICKETS,
    description: 'Type de rapport',
  })
  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;
}
