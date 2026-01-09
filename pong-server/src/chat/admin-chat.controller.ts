// src/chat/admin-chat.controller.ts
import { Controller, Get, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/chat')
@UseGuards(AdminGuard)
export class AdminChatController {
  constructor(private chatService: ChatService) {}

  @Get('messages')
  async getAllMessages(
    @Query('limit') limit?: string,
    @Query('gameId') gameId?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 100;

    if (gameId) {
      return this.chatService.getGameMessages(gameId);
    } else {
      return this.chatService.getAllMessages(limitNumber);
    }
  }

  @Get('global')
  async getGlobalMessages(@Query('limit') limit?: string) {
    console.log("getGlobalMessages");
    const limitNumber = limit ? parseInt(limit, 10) : 100;
    return this.chatService.getGlobalMessages(limitNumber);
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string) {
    await this.chatService.deleteMessage(id);
    return { message: 'Message deleted successfully' };
  }

  @Get('stats')
  async getChatStats() {
    return this.chatService.getChatStats();
  }
}