// src/app/services/websocket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Game } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('No token available for WebSocket connection');
      return;
    }

    this.socket = io('http://localhost:3000', {
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGame(gameId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }
    this.socket.emit('joinGame', { gameId });
  }

  sendPaddleMove(gameId: string, paddleY: number): void {
    if (!this.socket) return;
    this.socket.emit('paddleMove', { gameId, paddleY });
  }

  sendBallUpdate(
    gameId: string,
    ballX: number,
    ballY: number,
    ballSpeedX: number,
    ballSpeedY: number
  ): void {
    if (!this.socket) return;
    this.socket.emit('ballUpdate', {
      gameId,
      ballX,
      ballY,
      ballSpeedX,
      ballSpeedY
    });
  }

  sendScoreUpdate(gameId: string, score1: number, score2: number): void {
    if (!this.socket) return;
    this.socket.emit('scoreUpdate', { gameId, score1, score2 });
  }

  leaveGame(gameId: string): void {
    if (!this.socket) {
      console.error('Socket not connected, cannot leave game');
      return;
    }
    if (!this.socket.connected) {
      console.error('Socket disconnected, cannot leave game');
      return;
    }
    console.log(`Sending leaveGame event for game ${gameId}`);
    this.socket.emit('leaveGame', { gameId });
  }

  onGameState(): Observable<Game> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.on('gameState', (game: Game) => {
        observer.next(game);
      });

      return () => {
        if (this.socket) {
          this.socket.off('gameState');
        }
      };
    });
  }

  onGameFinished(): Observable<{ winner: string; score1: number; score2: number; reason?: string }> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.on('gameFinished', (data) => {
        observer.next(data);
      });

      return () => {
        if (this.socket) {
          this.socket.off('gameFinished');
        }
      };
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}