// src/game/game.entity.ts
export enum GameStatus {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface Player {
  id: string;
  username: string;
}

export class Game {
  id: string;
  player1: Player;
  player2: Player | null;
  status: GameStatus;
  score1: number;
  score2: number;
  createdAt: Date;
  startedAt: Date | null;
  
  // État du jeu
  paddle1Y: number;
  paddle2Y: number;
  ballX: number;
  ballY: number;
  ballSpeedX: number;
  ballSpeedY: number;

  constructor(player: Player) {
    this.id = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.player1 = player;
    this.player2 = null;
    this.status = GameStatus.WAITING;
    this.score1 = 0;
    this.score2 = 0;
    this.createdAt = new Date();
    this.startedAt = null;
    
    // Initialisation du jeu
    this.paddle1Y = 250;
    this.paddle2Y = 250;
    this.ballX = 400;
    this.ballY = 300;
    this.ballSpeedX = 5;
    this.ballSpeedY = 3;
  }
}