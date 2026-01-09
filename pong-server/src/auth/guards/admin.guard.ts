// src/auth/guards/admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ForbiddenException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);

      // Vérifier le rôle actuel en base de données
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      if (user.role !== 'admin') {
        throw new ForbiddenException('Admin access required');
      }

      request.user = { ...payload, role: user.role };
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Invalid token or insufficient permissions');
    }
  }
}
