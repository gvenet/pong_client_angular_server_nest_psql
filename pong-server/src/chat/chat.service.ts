// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
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
    console.log("getGlobalMessages");
    const msgs = this.chatRepository.find({
      where: { game_id: IsNull() },
      relations: ['user'],
      order: { sentAt: 'DESC' },
      take: limit,
    });
    msgs.then((value) => console.log(value));
    return msgs;
  }

  async getGameMessages(gameId: string): Promise<ChatMessage[]> {
    return this.chatRepository.find({
      where: { game_id: gameId },
      relations: ['user'],
      order: { sentAt: 'ASC' },
    });
  }

  async getAllMessages(limit = 100): Promise<ChatMessage[]> {
    return this.chatRepository.find({
      relations: ['user'],
      order: { sentAt: 'DESC' },
      take: limit,
    });
  }

  async deleteMessage(id: string): Promise<void> {
    await this.chatRepository.delete(id);
  }

  async getChatStats(): Promise<any> {
    const totalMessages = await this.chatRepository.count();
    const globalMessages = await this.chatRepository.count({ where: { game_id: IsNull() } });
    const gameMessages = await this.chatRepository.count({ where: { game_id: Not(IsNull()) } });

    return {
      totalMessages,
      globalMessages,
      gameMessages,
    };
  }
}
