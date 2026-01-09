// src/users/users.controller.ts
import { Controller, Get, Put, Post, Delete, UseGuards, Request, Body, Param, Query } from '@nestjs/common';
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

  // Update profile
  @UseGuards(JwtAuthGuard)
  @Put('profile/username')
  async updateUsername(@Request() req, @Body('username') username: string) {
    const user = await this.usersService.updateUsername(req.user.id, username);
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/email')
  async updateEmail(@Request() req, @Body('email') email: string) {
    const user = await this.usersService.updateEmail(req.user.id, email);
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/password')
  async updatePassword(
    @Request() req,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.usersService.updatePassword(req.user.id, currentPassword, newPassword);
    return { message: 'Password updated successfully' };
  }

  // Friends management
  @UseGuards(JwtAuthGuard)
  @Get('friends')
  async getFriends(@Request() req) {
    const friends = await this.usersService.getFriends(req.user.id);
    return friends.map(friend => ({
      id: friend.id,
      username: friend.username,
      elo: friend.elo,
      wins: friend.wins,
      losses: friend.losses,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Post('friends/:friendId')
  async addFriend(@Request() req, @Param('friendId') friendId: string) {
    await this.usersService.addFriend(req.user.id, friendId);
    return { message: 'Friend added successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('friends/:friendId')
  async removeFriend(@Request() req, @Param('friendId') friendId: string) {
    await this.usersService.removeFriend(req.user.id, friendId);
    return { message: 'Friend removed successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUsers(@Request() req, @Query('q') query: string) {
    if (!query || query.length < 2) {
      return [];
    }

    const users = await this.usersService.searchUsers(query, req.user.id);
    return users.map(user => ({
      id: user.id,
      username: user.username,
      elo: user.elo,
    }));
  }
}