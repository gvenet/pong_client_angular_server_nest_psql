// src/app/services/chat.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id: string;
  user: {
    id: string;
    username: string;
  };
  message: string;
  sentAt: string;
  game_id: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket | null = null;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('No token available for Chat WebSocket connection');
      return;
    }

    this.socket = io('http://localhost:3000', {
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('Chat WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Chat WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message: string, gameId?: string): void {
    if (!this.socket) {
      console.error('Chat socket not connected');
      return;
    }
    this.socket.emit('sendMessage', { message, gameId });
  }

  getRecentMessages(limit = 50, gameId?: string): void {
    if (!this.socket) {
      console.error('Chat socket not connected');
      return;
    }
    this.socket.emit('getRecentMessages', { limit, gameId });
  }

  onNewMessage(): Observable<ChatMessage> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.on('newMessage', (message: ChatMessage) => {
        observer.next(message);
      });

      return () => {
        if (this.socket) {
          this.socket.off('newMessage');
        }
      };
    });
  }

  onRecentMessages(): Observable<ChatMessage[]> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.on('recentMessages', (messages: ChatMessage[]) => {
        observer.next(messages);
      });

      return () => {
        if (this.socket) {
          this.socket.off('recentMessages');
        }
      };
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}