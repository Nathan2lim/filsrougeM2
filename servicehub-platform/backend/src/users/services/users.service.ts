import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUsersRepository } from '../repositories/users.repository.interface';
import { CreateUserDto, UpdateUserDto } from '../dto';
import {
  EntityNotFoundException,
  DuplicateEntityException,
} from '@common/exceptions';

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new DuplicateEntityException('Utilisateur', 'email', createUserDto.email);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Si pas de roleId fourni, assigner le rôle CLIENT par défaut
    let roleId = createUserDto.roleId;
    if (!roleId) {
      const clientRole = await this.usersRepository.findRoleByName('CLIENT');
      if (!clientRole) {
        throw new Error('Le rôle CLIENT par défaut n\'existe pas');
      }
      roleId = clientRole.id;
    }

    const user = await this.usersRepository.create({
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      password: hashedPassword,
      roleId,
    });

    const { password: _, ...result } = user;
    return result;
  }

  async findAll(params: FindAllParams) {
    const { page, limit, search, role } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = { name: role };
    }

    const [users, total] = await Promise.all([
      this.usersRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.usersRepository.count(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map(({ password: _, ...user }) => user),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException('Utilisateur', id);
    }

    const { password: _, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException('Utilisateur', id);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new DuplicateEntityException('Utilisateur', 'email', updateUserDto.email);
      }
    }

    const dataToUpdate: Record<string, unknown> = { ...updateUserDto };

    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.usersRepository.update(id, dataToUpdate);
    const { password: _, ...result } = updatedUser;
    return result;
  }

  async delete(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException('Utilisateur', id);
    }

    await this.usersRepository.delete(id);
    return { message: 'Utilisateur supprimé avec succès' };
  }

  async activate(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException('Utilisateur', id);
    }

    const updatedUser = await this.usersRepository.update(id, { isActive: true });
    const { password: _, ...result } = updatedUser;
    return result;
  }

  async deactivate(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException('Utilisateur', id);
    }

    const updatedUser = await this.usersRepository.update(id, { isActive: false });
    const { password: _, ...result } = updatedUser;
    return result;
  }
}
