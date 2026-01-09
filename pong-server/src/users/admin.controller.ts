// src/users/admin.controller.ts
import { Controller, Get, Delete, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      elo: user.elo,
      wins: user.wins,
      losses: user.losses,
      createdAt: user.createdAt,
    }));
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }

  @Patch(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    if (role !== 'user' && role !== 'admin') {
      throw new Error('Invalid role. Must be "user" or "admin"');
    }

    const user = await this.usersService.updateRole(id, role);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      elo: user.elo,
      wins: user.wins,
      losses: user.losses,
    };
  }
}
