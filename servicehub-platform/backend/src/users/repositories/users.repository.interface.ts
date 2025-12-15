import { User, Role } from '@prisma/client';

export type UserWithRole = User & { role: Role };

export interface IUsersRepository {
  create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
  }): Promise<UserWithRole>;

  findById(id: string): Promise<UserWithRole | null>;

  findByEmail(email: string): Promise<UserWithRole | null>;

  findMany(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<UserWithRole[]>;

  count(where?: Record<string, unknown>): Promise<number>;

  update(id: string, data: Record<string, unknown>): Promise<UserWithRole>;

  delete(id: string): Promise<void>;

  findRoleByName(name: string): Promise<Role | null>;

  findAllRoles(): Promise<Role[]>;
}
