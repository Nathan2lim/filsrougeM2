import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

/**
 * Factory pour la création d'Utilisateurs
 * Centralise la logique d'instanciation et le hachage des mots de passe
 */

export interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

export type RoleName = 'ADMIN' | 'TECHNICIAN' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  permissions: string[];
}

@Injectable()
export class UserFactory {
  private readonly SALT_ROUNDS = 10;

  /**
   * Crée un nouvel utilisateur avec mot de passe haché
   */
  async create(data: UserData): Promise<User> {
    const now = new Date();
    const hashedPassword = await this.hashPassword(data.password);

    return {
      id: uuidv4(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: this.capitalize(data.firstName.trim()),
      lastName: this.capitalize(data.lastName.trim()),
      roleId: data.roleId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Crée un utilisateur synchrone (sans hachage - pour tests)
   */
  createSync(data: UserData): User {
    const now = new Date();

    return {
      id: uuidv4(),
      email: data.email.toLowerCase().trim(),
      password: data.password, // Non haché - uniquement pour tests
      firstName: this.capitalize(data.firstName.trim()),
      lastName: this.capitalize(data.lastName.trim()),
      roleId: data.roleId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Crée un administrateur
   */
  async createAdmin(data: Omit<UserData, 'roleId'>, adminRoleId: string): Promise<User> {
    return this.create({
      ...data,
      roleId: adminRoleId,
    });
  }

  /**
   * Crée un technicien
   */
  async createTechnician(data: Omit<UserData, 'roleId'>, technicianRoleId: string): Promise<User> {
    return this.create({
      ...data,
      roleId: technicianRoleId,
    });
  }

  /**
   * Crée un client
   */
  async createClient(data: Omit<UserData, 'roleId'>, clientRoleId: string): Promise<User> {
    return this.create({
      ...data,
      roleId: clientRoleId,
    });
  }

  /**
   * Crée un rôle avec ses permissions
   */
  createRole(name: RoleName, description: string, permissions: string[]): Role {
    return {
      id: uuidv4(),
      name,
      description,
      permissions,
    };
  }

  /**
   * Crée les rôles par défaut du système
   */
  createDefaultRoles(): Role[] {
    return [
      this.createRole('ADMIN', 'Administrateur système', ['*']),
      this.createRole('TECHNICIAN', 'Technicien support', [
        'tickets:read',
        'tickets:write',
        'tickets:assign',
        'users:read',
      ]),
      this.createRole('CLIENT', 'Client', [
        'tickets:read',
        'tickets:create',
        'invoices:read',
      ]),
    ];
  }

  /**
   * Hache un mot de passe
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Capitalise la première lettre
   */
  private capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
