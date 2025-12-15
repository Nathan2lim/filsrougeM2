import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Role } from '@prisma/client';
import { IUsersRepository, UserWithRole } from './users.repository.interface';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
  }): Promise<UserWithRole> {
    return this.prisma.user.create({
      data,
      include: { role: true },
    });
  }

  async findById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findByEmail(email: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async findMany(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<UserWithRole[]> {
    return this.prisma.user.findMany({
      ...options,
      include: { role: true },
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async update(id: string, data: Record<string, unknown>): Promise<UserWithRole> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({
      where: { name },
    });
  }

  async findAllRoles(): Promise<Role[]> {
    return this.prisma.role.findMany();
  }
}
