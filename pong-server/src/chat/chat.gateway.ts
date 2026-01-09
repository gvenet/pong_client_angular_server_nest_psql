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

    // Recharger le message avec les relations utilisateur
    let messageWithUser;
    if (data.gameId) {
      // Pour un message de partie, charger directement depuis la base
      const messages = await this.chatService.getGameMessages(data.gameId);
      messageWithUser = messages[messages.length - 1]; // Dernier message
    } else {
      // Pour le chat global
      const messages = await this.chatService.getGlobalMessages(1);
      messageWithUser = messages[0];
    }

    // Broadcast le message
    if (data.gameId) {
      // Message pour une partie spécifique - envoyer à tous les clients de la room (y compris l'émetteur)
      this.server.in(data.gameId).emit('newMessage', messageWithUser);
      console.log(`Message sent to game room ${data.gameId} by ${client.username}`);
    } else {
      // Message global
      this.server.emit('newMessage', messageWithUser);
    }
  }

  @SubscribeMessage('joinChatRoom')
  handleJoinRoom(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.join(data.gameId);
    console.log(`${client.username} joined chat room: ${data.gameId}`);
  }

  @SubscribeMessage('leaveChatRoom')
  handleLeaveRoom(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(data.gameId);
    console.log(`${client.username} left chat room: ${data.gameId}`);
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