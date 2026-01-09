// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatRepository: Repository<ChatMessage>,
  ) {}

  async saveMessage(userId: string, message: string, gameId?: string): Promise<ChatMessage> {
    const chatMessage = this.chatRepository.create({
      user_id: userId,
      message,
      game_id: gameId || null,
    });
    return this.chatRepository.save(chatMessage);
  }

  async getGlobalMessages(limit = 50): Promise<ChatMessage[]> {
    return this.chatRepository.find({
      where: { game_id: null },
      relations: ['user'],
      order: { sentAt: 'DESC' },
      take: limit,
    });
  }

  async getGameMessages(gameId: string): Promise<ChatMessage[]> {
    return this.chatRepository.find({
      where: { game_id: gameId },
      relations: ['user'],
      order: { sentAt: 'ASC' },
    });
  }
}
