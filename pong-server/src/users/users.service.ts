// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(username: string, email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      username,
      email,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async updateStats(userId: string, won: boolean): Promise<void> {
    const user = await this.findById(userId);
    if (!user) return;

    if (won) {
      user.wins++;
      user.elo += 25;
    } else {
      user.losses++;
      user.elo = Math.max(0, user.elo - 15);
    }

    await this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async updateRole(id: string, role: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    user.role = role;
    return this.usersRepository.save(user);
  }
}
