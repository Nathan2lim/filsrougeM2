import { Injectable } from '@nestjs/common';
import { IUsersRepository, UserWithRole } from './users.repository.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implémentation In-Memory du repository Users
 * Utilisée pour les tests et le développement sans base de données
 */
@Injectable()
export class UsersRepositoryInMemory implements IUsersRepository {
  private users: Map<string, UserWithRole> = new Map();
  private roles: Map<string, Role> = new Map();

  constructor() {
    this.seedRoles();
  }

  private seedRoles(): void {
    const defaultRoles: Role[] = [
      {
        id: uuidv4(),
        name: 'ADMIN',
        description: 'Administrateur',
        permissions: ['*'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'TECHNICIAN',
        description: 'Technicien',
        permissions: ['tickets:read', 'tickets:write', 'tickets:assign'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'CLIENT',
        description: 'Client',
        permissions: ['tickets:read', 'tickets:create'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    defaultRoles.forEach((role) => this.roles.set(role.id, role));
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
  }): Promise<UserWithRole> {
    const role = this.roles.get(data.roleId);
    if (!role) {
      throw new Error(`Role with id ${data.roleId} not found`);
    }

    const user: UserWithRole = {
      id: uuidv4(),
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      roleId: data.roleId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role,
    };

    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<UserWithRole | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<UserWithRole | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findMany(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<UserWithRole[]> {
    let result = Array.from(this.users.values());

    // Filtrage basique
    if (options.where) {
      result = result.filter((user) => {
        return Object.entries(options.where!).every(([key, value]) => {
          return (user as Record<string, unknown>)[key] === value;
        });
      });
    }

    // Tri
    if (options.orderBy) {
      const [field, order] = Object.entries(options.orderBy)[0];
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[field];
        const bVal = (b as Record<string, unknown>)[field];
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const skip = options.skip || 0;
    const take = options.take || result.length;
    return result.slice(skip, skip + take);
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    if (!where) {
      return this.users.size;
    }
    const filtered = await this.findMany({ where });
    return filtered.length;
  }

  async update(id: string, data: Record<string, unknown>): Promise<UserWithRole> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    const updatedUser: UserWithRole = {
      ...user,
      ...data,
      updatedAt: new Date(),
    } as UserWithRole;

    // Si le roleId change, mettre à jour la relation
    if (data.roleId && data.roleId !== user.roleId) {
      const role = this.roles.get(data.roleId as string);
      if (role) {
        updatedUser.role = role;
        updatedUser.roleId = data.roleId as string;
      }
    }

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async findRoleByName(name: string): Promise<Role | null> {
    for (const role of this.roles.values()) {
      if (role.name === name) {
        return role;
      }
    }
    return null;
  }

  async findAllRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  // Méthode utilitaire pour les tests
  clear(): void {
    this.users.clear();
  }
}

// Type local pour éviter la dépendance Prisma
interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}
