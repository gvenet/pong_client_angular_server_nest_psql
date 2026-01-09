// src/users/users.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Friendship } from './entities/friendship.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
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

  // Profile management
  async updateUsername(userId: string, newUsername: string): Promise<User> {
    const existingUser = await this.findByUsername(newUsername);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Username already taken');
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.username = newUsername;
    return this.usersRepository.save(user);
  }

  async updateEmail(userId: string, newEmail: string): Promise<User> {
    const existingUser = await this.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Email already taken');
    }

    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.email = newEmail;
    return this.usersRepository.save(user);
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await this.validatePassword(currentPassword, user.password);
    if (!isValid) {
      throw new ConflictException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.usersRepository.save(user);
  }

  // Friends management
  async addFriend(userId: string, friendId: string): Promise<Friendship> {
    if (userId === friendId) {
      throw new ConflictException('Cannot add yourself as friend');
    }

    const friend = await this.findById(friendId);
    if (!friend) {
      throw new NotFoundException('User not found');
    }

    // Vérifier si déjà ami
    const existingFriendship = await this.friendshipRepository.findOne({
      where: { user_id: userId, friend_id: friendId },
    });

    if (existingFriendship) {
      throw new ConflictException('Already friends');
    }

    const friendship = this.friendshipRepository.create({
      user_id: userId,
      friend_id: friendId,
    });

    return this.friendshipRepository.save(friendship);
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await this.friendshipRepository.delete({
      user_id: userId,
      friend_id: friendId,
    });
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendships = await this.friendshipRepository.find({
      where: { user_id: userId },
      relations: ['friend'],
    });

    return friendships.map(f => f.friend);
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :query', { query: `%${query}%` })
      .andWhere('user.id != :currentUserId', { currentUserId })
      .limit(10)
      .getMany();

    return users;
  }
}
