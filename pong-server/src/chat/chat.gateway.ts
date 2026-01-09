// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.username = payload.username;

      console.log(`Chat - Client connected: ${client.username}`);
    } catch (error) {
      console.error('Chat WebSocket authentication error:', error);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { message: string; gameId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      return;
    }

    const savedMessage = await this.chatService.saveMessage(
      client.userId,
      data.message,
      data.gameId,
    );

    // Charger le message avec les infos utilisateur
    const messageWithUser = await this.chatService.getGlobalMessages(1);

    // Broadcast le message
    if (data.gameId) {
      // Message pour une partie spécifique
      this.server.to(data.gameId).emit('newMessage', messageWithUser[0]);
    } else {
      // Message global
      this.server.emit('newMessage', messageWithUser[0]);
    }
  }

  @SubscribeMessage('joinChatRoom')
  handleJoinRoom(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.join(`chat-${data.gameId}`);
    console.log(`${client.username} joined chat room: chat-${data.gameId}`);
  }

  @SubscribeMessage('leaveChatRoom')
  handleLeaveRoom(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(`chat-${data.gameId}`);
    console.log(`${client.username} left chat room: chat-${data.gameId}`);
  }

  @SubscribeMessage('getRecentMessages')
  async handleGetRecentMessages(
    @MessageBody() data: { gameId?: string; limit?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    let messages;
    
    if (data.gameId) {
      messages = await this.chatService.getGameMessages(data.gameId);
    } else {
      messages = await this.chatService.getGlobalMessages(data.limit || 50);
    }

    client.emit('recentMessages', messages);
  }
}