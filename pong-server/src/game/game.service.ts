// src/game/game.service.ts
import { Injectable } from '@nestjs/common';
import { Game, GameStatus, Player } from './game.entity';

@Injectable()
export class GameService {
  private games: Map<string, Game> = new Map();

  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }

  getActiveGames(): Game[] {
    return Array.from(this.games.values()).filter(
      game => game.status !== GameStatus.FINISHED
    );
  }

  getGameById(id: string): Game | undefined {
    return this.games.get(id);
  }

  findWaitingGame(): Game | null {
    const waitingGame = Array.from(this.games.values()).find(
      game => game.status === GameStatus.WAITING && !game.player2
    );
    return waitingGame || null;
  }

  findPlayerActiveGame(playerId: string): Game | null {
    return Array.from(this.games.values()).find(
      game => 
        (game.status === GameStatus.WAITING || game.status === GameStatus.PLAYING) &&
        (game.player1.id === playerId || game.player2?.id === playerId)
    ) || null;
  }

  createGame(player: Player): Game {
    const game = new Game(player);
    this.games.set(game.id, game);
    return game;
  }

  joinGame(gameId: string, player: Player): Game | null {
    const game = this.games.get(gameId);
    
    if (!game) return null;
    if (game.status !== GameStatus.WAITING) return null;
    if (game.player2) return null;
    if (game.player1.id === player.id) return null;

    const existingGame = this.findPlayerActiveGame(player.id);
    if (existingGame) return null;

    game.player2 = player;
    game.status = GameStatus.PLAYING;
    game.startedAt = new Date();
    
    return game;
  }

  findOrCreateGame(player: Player): { game: Game; joined: boolean } {
    const existingGame = this.findPlayerActiveGame(player.id);
    if (existingGame) {
      return { game: existingGame, joined: false };
    }

    const waitingGame = this.findWaitingGame();
    
    if (waitingGame && waitingGame.player1.id !== player.id) {
      const joinedGame = this.joinGame(waitingGame.id, player);
      return { game: joinedGame!, joined: true };
    }
    
    const newGame = this.createGame(player);
    return { game: newGame, joined: false };
  }

  updatePaddle(gameId: string, playerId: string, paddleY: number): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    if (game.player1.id === playerId) {
      game.paddle1Y = paddleY;
    } else if (game.player2?.id === playerId) {
      game.paddle2Y = paddleY;
    }

    return game;
  }

  updateBall(gameId: string, ballX: number, ballY: number, ballSpeedX: number, ballSpeedY: number): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.ballX = ballX;
    game.ballY = ballY;
    game.ballSpeedX = ballSpeedX;
    game.ballSpeedY = ballSpeedY;

    return game;
  }

  updateScore(gameId: string, player1Score: number, player2Score: number): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.score1 = player1Score;
    game.score2 = player2Score;

    // Fin de partie si un joueur atteint 10 points
    if (player1Score >= 10 || player2Score >= 10) {
      game.status = GameStatus.FINISHED;
    }

    return game;
  }

  deleteGame(id: string): boolean {
    return this.games.delete(id);
  }
}