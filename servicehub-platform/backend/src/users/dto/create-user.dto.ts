import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsUUID,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Adresse email de l\'utilisateur',
  })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'L\'email est requis' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Mot de passe (min 8 caractères)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(50, { message: 'Le mot de passe ne peut pas dépasser 50 caractères' })
  password: string;

  @ApiProperty({
    example: 'Jean',
    description: 'Prénom de l\'utilisateur',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis' })
  @MaxLength(100, { message: 'Le prénom ne peut pas dépasser 100 caractères' })
  firstName: string;

  @ApiProperty({
    example: 'Dupont',
    description: 'Nom de l\'utilisateur',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  lastName: string;

  @ApiProperty({
    example: 'uuid-role-id',
    description: 'ID du rôle de l\'utilisateur',
    required: false,
  })
  @IsUUID('4', { message: 'L\'ID du rôle doit être un UUID valide' })
  @IsOptional()
  roleId?: string;
}
