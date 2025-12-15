import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUsersRepository } from '../repositories/users.repository.interface';
import { LoginDto } from '../dto';
import { DuplicateEntityException } from '@common/exceptions';
import { JwtPayload } from '@common/interfaces';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions: user.role.permissions,
      },
    };
  }

  async register(data: LoginDto & { firstName: string; lastName: string }) {
    const existingUser = await this.usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new DuplicateEntityException('Utilisateur', 'email', data.email);
    }

    // Récupérer le rôle CLIENT par défaut
    const clientRole = await this.usersRepository.findRoleByName('CLIENT');
    if (!clientRole) {
      throw new Error('Role CLIENT not found');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      roleId: clientRole.id,
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token invalide');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions,
      };

      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.usersRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }
}
