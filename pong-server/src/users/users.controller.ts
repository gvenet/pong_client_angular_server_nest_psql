// src/users/users.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      return { error: 'User not found' };
    }
    
    // Ne pas renvoyer le mot de passe
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      return { error: 'User not found' };
    }

    return {
      username: user.username,
      elo: user.elo,
      wins: user.wins,
      losses: user.losses,
      winRate: user.wins + user.losses > 0 
        ? ((user.wins / (user.wins + user.losses)) * 100).toFixed(1) 
        : 0,
    };
  }
}