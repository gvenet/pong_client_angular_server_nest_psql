// src/app/models/game.model.ts
export enum GameStatus {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface Player {
  id: string;
  username: string;
}

export interface Game {
  id: string;
  player1: Player;
  player2: Player | null;
  status: GameStatus;
  score1: number;
  score2: number;
  createdAt: string;
  startedAt: string | null;
  
  // État du jeu
  paddle1Y: number;
  paddle2Y: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;
}