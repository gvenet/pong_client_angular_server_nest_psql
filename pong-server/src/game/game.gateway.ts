// src/game/game.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { JwtService } from '@nestjs/jwt';
import { GameStatus } from './game.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  gameId?: string;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private playerSockets: Map<string, string> = new Map(); // playerId -> socketId

  constructor(
    private gameService: GameService,
    private jwtService: JwtService,
  ) { }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.username = payload.username;

      console.log(`Client connected: ${client.username} (${client.id})`);
      this.playerSockets.set(client.userId, client.id);
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.username} (${client.id})`);

    if (client.userId) {
      this.playerSockets.delete(client.userId);

      // Trouver la partie du joueur déconnecté
      if (client.gameId) {
        const game = this.gameService.getGameById(client.gameId);

        if (game && game.status !== GameStatus.FINISHED) {
          // Vérifier si le client déconnecté est un joueur réel (pas un spectateur)
          const isPlayer1 = game.player1.id === client.userId;
          const isPlayer2 = game.player2?.id === client.userId;
          const isPlayer = isPlayer1 || isPlayer2;

          if (isPlayer) {
            // Seule la déconnexion d'un joueur réel déclenche un forfait
            let winner: string;
            let winnerScore = 10;
            let loserScore = 0;

            if (isPlayer1) {
              // Player1 s'est déconnecté, Player2 gagne
              winner = game.player2?.username || 'Unknown';
              this.gameService.updateScore(client.gameId, loserScore, winnerScore);
            } else {
              // Player2 s'est déconnecté, Player1 gagne
              winner = game.player1.username;
              this.gameService.updateScore(client.gameId, winnerScore, loserScore);
            }

            // Notifier la victoire par forfait
            this.server.to(client.gameId).emit('gameFinished', {
              winner: winner,
              score1: isPlayer1 ? loserScore : winnerScore,
              score2: isPlayer2 ? loserScore : winnerScore,
              reason: 'disconnect'
            });

            console.log(`Player ${client.username} disconnected from game ${client.gameId}. ${winner} wins by forfeit.`);

            // Supprimer la partie après un délai pour laisser le temps de voir le message
            setTimeout(() => {
              this.gameService.deleteGame(client.gameId!);
              console.log(`Game ${client.gameId} deleted after player disconnect`);
            }, 5000);
          } else {
            // Spectateur déconnecté - ne rien faire
            console.log(`Spectator ${client.username} disconnected from game ${client.gameId} (no forfeit)`);
          }
        }
      }
    }
  }

  @SubscribeMessage('joinGame')
  handleJoinGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { gameId } = data;
    client.join(gameId);
    client.gameId = gameId;

    console.log(`${client.username} (${client.userId}) joined game: ${gameId}`);

    // Envoyer l'état actuel du jeu
    const game = this.gameService.getGameById(gameId);
    if (game) {
      console.log(`Game state - Player1: ${game.player1.username} (${game.player1.id}), Player2: ${game.player2?.username} (${game.player2?.id})`);
      this.server.to(gameId).emit('gameState', game);
    }
  }

  @SubscribeMessage('paddleMove')
  handlePaddleMove(
    @MessageBody() data: { gameId: string; paddleY: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { gameId, paddleY } = data;
    const game = this.gameService.updatePaddle(gameId, client.userId!, paddleY);

    if (game) {
      // Broadcast à tous les joueurs de la partie
      this.server.to(gameId).emit('gameState', game);
    }
  }

  @SubscribeMessage('ballUpdate')
  handleBallUpdate(
    @MessageBody()
    data: {
      gameId: string;
      ballX: number;
      ballY: number;
      ballSpeedX: number;
      ballSpeedY: number;
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { gameId, ballX, ballY, ballSpeedX, ballSpeedY } = data;
    const game = this.gameService.updateBall(
      gameId,
      ballX,
      ballY,
      ballSpeedX,
      ballSpeedY,
    );

    if (game) {
      this.server.to(gameId).emit('gameState', game);
    }
  }

  @SubscribeMessage('scoreUpdate')
  handleScoreUpdate(
    @MessageBody()
    data: { gameId: string; score1: number; score2: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const { gameId, score1, score2 } = data;
    const game = this.gameService.updateScore(gameId, score1, score2);

    if (game) {
      this.server.to(gameId).emit('gameState', game);

      // Si la partie est terminée, notifier
      if (game.status === GameStatus.FINISHED) {
        this.server.to(gameId).emit('gameFinished', {
          winner:
            game.score1 > game.score2 ? game.player1.username : game.player2?.username,
          score1: game.score1,
          score2: game.score2,
        });
      }
    }
  }

  @SubscribeMessage('leaveGame')
  handleLeaveGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    console.log(`[leaveGame] Received from ${client.username} for game ${data.gameId}`);

    const { gameId } = data;
    const game = this.gameService.getGameById(gameId);

    if (!game) {
      console.log(`[leaveGame] Game ${gameId} not found`);
      return;
    }

    console.log(`[leaveGame] Game found, status: ${game.status}, player1: ${game.player1.username}, player2: ${game.player2?.username}`);

    // Si la partie est en attente avec un seul joueur, la supprimer immédiatement
    if (game.status === GameStatus.WAITING && !game.player2) {
      console.log(`[leaveGame] Player ${client.username} leaving waiting game, deleting immediately`);
      this.gameService.deleteGame(gameId);
      return;
    }

    // Si la partie est en cours, l'autre joueur gagne
    if (game.status === GameStatus.PLAYING) {
      console.log(`[leaveGame] Processing forfeit for ${client.username} (${client.userId})`);

      const isPlayer1 = game.player1.id === client.userId;
      console.log(`[leaveGame] Is player1: ${isPlayer1}`);

      let winner: string;
      let winnerScore = 10;
      let loserScore = 0;

      if (isPlayer1) {
        winner = game.player2?.username || 'Unknown';
        game.score1 = loserScore;
        game.score2 = winnerScore;
      } else {
        winner = game.player1.username;
        game.score1 = winnerScore;
        game.score2 = loserScore;
      }

      game.status = GameStatus.FINISHED;

      console.log(`[leaveGame] Winner: ${winner}, scores: ${game.score1}-${game.score2}`);

      // Notifier la victoire par forfait
      this.server.to(gameId).emit('gameFinished', {
        winner: winner,
        score1: game.score1,
        score2: game.score2,
        reason: 'forfeit',
      });

      console.log(
        `Player ${client.username} left game ${gameId}. ${winner} wins by forfeit.`,
      );

      // Supprimer la partie après un délai
      setTimeout(() => {
        this.gameService.deleteGame(gameId);
        console.log(`Game ${gameId} deleted after forfeit`);
      }, 3000);
    }
  }
}