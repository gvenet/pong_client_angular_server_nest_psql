// src/auth/auth.service.ts (mise à jour)
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async register(username: string, email: string, password: string) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Créer l'utilisateur
    const user = await this.usersService.create(username, email, password);

    // Générer le token
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        elo: user.elo,
        role: user.role,
      },
    };
  }

  async login(username: string, password: string) {
    // Trouver l'utilisateur
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Générer le token
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        elo: user.elo,
        wins: user.wins,
        losses: user.losses,
        role: user.role,
      },
    };
  }

  async validateUser(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      return null;
    }
    return { id: user.id, username: user.username };
  }
}