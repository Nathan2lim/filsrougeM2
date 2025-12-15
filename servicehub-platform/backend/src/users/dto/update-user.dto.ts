import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Adresse email de l\'utilisateur',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'NewPassword123!',
    description: 'Nouveau mot de passe (min 8 caractères)',
  })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(50, { message: 'Le mot de passe ne peut pas dépasser 50 caractères' })
  password?: string;

  @ApiPropertyOptional({
    example: 'Jean',
    description: 'Prénom de l\'utilisateur',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Dupont',
    description: 'Nom de l\'utilisateur',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  lastName?: string;

  @ApiPropertyOptional({
    example: 'uuid-role-id',
    description: 'ID du rôle de l\'utilisateur',
  })
  @IsUUID('4', { message: 'L\'ID du rôle doit être un UUID valide' })
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Statut actif de l\'utilisateur',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
