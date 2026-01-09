// src/chat/chat.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AdminChatController } from './admin-chat.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  providers: [ChatService, ChatGateway],
  controllers: [AdminChatController],
  exports: [ChatService],
})
export class ChatModule {}