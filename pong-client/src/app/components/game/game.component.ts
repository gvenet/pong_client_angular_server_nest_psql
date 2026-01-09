// src/app/components/game/game.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { AuthService } from '../../services/auth.service';
import { WebsocketService } from '../../services/websocket.service';
import { Game, GameStatus } from '../../models/game.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: false }) 
  set canvasRef(ref: ElementRef<HTMLCanvasElement>) {
    if (ref && !this.ctx) {
      this._canvasRef = ref;
      this.initCanvas();
    }
  }
  get canvasRef(): ElementRef<HTMLCanvasElement> {
    return this._canvasRef;
  }
  
  private _canvasRef!: ElementRef<HTMLCanvasElement>;
  
  gameId: string = '';
  game: Game | null = null;
  loading = true;
  error = '';
  winner = '';
  disconnectReason = '';
  isSpectator = false;
  
  private ctx!: CanvasRenderingContext2D;
  private animationId?: number;
  private gameStateSubscription?: Subscription;
  private gameFinishedSubscription?: Subscription;
  
  // Dimensions du jeu
  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 600;
  private readonly PADDLE_WIDTH = 15;
  private readonly PADDLE_HEIGHT = 100;
  private readonly BALL_SIZE = 15;
  
  // Contrôles
  private mouseY = 0;
  private lastPaddleUpdate = 0;
  private lastBallUpdate = 0;
  
  GameStatus = GameStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private authService: AuthService,
    private wsService: WebsocketService
  ) {}

  ngOnInit() {
    this.gameId = this.route.snapshot.params['id'];
    
    // Vérifier si on est en mode spectateur
    this.isSpectator = this.route.snapshot.queryParams['spectator'] === 'true';
    console.log('Mode spectateur:', this.isSpectator);
    
    // Connexion WebSocket
    this.wsService.connect();
    
    // Écouter les mises à jour du jeu
    this.gameStateSubscription = this.wsService.onGameState().subscribe({
      next: (game) => {
        this.game = game;
        
        if (!this.animationId && game.status === GameStatus.PLAYING && this.ctx) {
          this.startGame();
        }
      },
      error: (err) => {
        console.error('WebSocket error:', err);
      }
    });

    // Écouter la fin de partie
    this.gameFinishedSubscription = this.wsService.onGameFinished().subscribe({
      next: (data) => {
        this.winner = data.winner;
        
        // Vérifier si c'est une victoire par déconnexion ou forfait
        if (data.reason === 'disconnect') {
          this.disconnectReason = 'L\'adversaire s\'est déconnecté';
        } else if (data.reason === 'forfeit') {
          this.disconnectReason = 'Victoire par abandon';
        }
        
        // Mettre à jour le score final avant d'arrêter
        if (this.game) {
          this.game.score1 = data.score1;
          this.game.score2 = data.score2;
          this.game.status = GameStatus.FINISHED;
          
          // Dessiner une dernière fois avec le score final
          this.draw();
        }
        
        this.stopGame();
      }
    });
    
    // Charger les données initiales
    this.loadGame();
    
    // Écouter le mouvement de la souris (seulement si pas spectateur)
    if (!this.isSpectator) {
      window.addEventListener('mousemove', this.handleMouseMove);
    }
  }

  ngAfterViewInit() {
    // Le canvas sera initialisé automatiquement via le setter
  }

  ngOnDestroy() {
    if (this.gameStateSubscription) {
      this.gameStateSubscription.unsubscribe();
    }
    if (this.gameFinishedSubscription) {
      this.gameFinishedSubscription.unsubscribe();
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  loadGame() {
    this.loading = true;
    this.gameService.getGame(this.gameId).subscribe({
      next: (game) => {
        this.game = game;
        this.loading = false;
        
        // Rejoindre la room WebSocket
        this.wsService.joinGame(this.gameId);
        
        if (game.status === GameStatus.PLAYING) {
          this.startGame();
        }
      },
      error: (err) => {
        this.error = 'Partie introuvable';
        this.loading = false;
        console.error(err);
      }
    });
  }

  initCanvas() {
    if (!this._canvasRef) {
      console.error('Canvas ref not available');
      return;
    }
    const canvas = this._canvasRef.nativeElement;
    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;
    this.ctx = canvas.getContext('2d')!;
    console.log('Canvas initialisé:', canvas.width, 'x', canvas.height);
    
    // Si le jeu est en cours et qu'on vient d'initialiser le canvas, démarrer
    if (this.game?.status === GameStatus.PLAYING && !this.animationId) {
      this.startGame();
    }
  }

  startGame() {
    if (!this.animationId) {
      this.gameLoop();
    }
  }

  stopGame() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
  }

  handleMouseMove = (e: MouseEvent) => {
    // Récupérer la position Y de la souris par rapport au canvas
    if (!this._canvasRef) return;
    
    const canvas = this._canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.mouseY = e.clientY - rect.top;
    
    // Limiter entre 0 et la hauteur du canvas
    this.mouseY = Math.max(0, Math.min(this.CANVAS_HEIGHT, this.mouseY));
  }

  gameLoop = () => {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  update() {
    if (!this.game || this.game.status !== GameStatus.PLAYING) return;
    
    // Les spectateurs ne participent pas au jeu
    if (this.isSpectator) return;
    
    const currentUser = this.authService.currentUser;
    if (!currentUser) return;
    
    const isPlayer1 = this.game.player1.id === currentUser.id;
    const now = Date.now();
    
    // Calculer la position du paddle en fonction de la souris
    // Centrer le paddle sur la position de la souris
    let targetPaddleY = this.mouseY - (this.PADDLE_HEIGHT / 2);
    
    // Limiter dans les bounds du canvas
    targetPaddleY = Math.max(0, Math.min(this.CANVAS_HEIGHT - this.PADDLE_HEIGHT, targetPaddleY));
    
    // Envoyer les mises à jour du paddle (throttle à 60fps)
    if (now - this.lastPaddleUpdate > 16) {
      this.wsService.sendPaddleMove(this.gameId, targetPaddleY);
      this.lastPaddleUpdate = now;
    }

    // Seulement le joueur 1 gère la physique de la balle
    if (isPlayer1 && now - this.lastBallUpdate > 16) {
      let ballX = this.game.ballX + this.game.ballSpeedX;
      let ballY = this.game.ballY + this.game.ballSpeedY;
      let ballSpeedX = this.game.ballSpeedX;
      let ballSpeedY = this.game.ballSpeedY;
      
      // Collision avec les murs haut/bas
      if (ballY <= 0 || ballY >= this.CANVAS_HEIGHT - this.BALL_SIZE) {
        ballSpeedY = -ballSpeedY;
        ballY = Math.max(0, Math.min(this.CANVAS_HEIGHT - this.BALL_SIZE, ballY));
      }
      
      // Collision avec paddle gauche
      if (ballX <= this.PADDLE_WIDTH && 
          ballY + this.BALL_SIZE >= this.game.paddle1Y && 
          ballY <= this.game.paddle1Y + this.PADDLE_HEIGHT) {
        ballSpeedX = Math.abs(ballSpeedX) * 1.05;
        ballX = this.PADDLE_WIDTH;
      }
      
      // Collision avec paddle droit
      if (ballX + this.BALL_SIZE >= this.CANVAS_WIDTH - this.PADDLE_WIDTH && 
          ballY + this.BALL_SIZE >= this.game.paddle2Y && 
          ballY <= this.game.paddle2Y + this.PADDLE_HEIGHT) {
        ballSpeedX = -Math.abs(ballSpeedX) * 1.05;
        ballX = this.CANVAS_WIDTH - this.PADDLE_WIDTH - this.BALL_SIZE;
      }
      
      // But marqué
      let scoreUpdated = false;
      let score1 = this.game.score1;
      let score2 = this.game.score2;

      if (ballX < 0) {
        score2++;
        scoreUpdated = true;
        ballX = this.CANVAS_WIDTH / 2;
        ballY = this.CANVAS_HEIGHT / 2;
        ballSpeedX = 5;
        ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);
      }
      
      if (ballX > this.CANVAS_WIDTH) {
        score1++;
        scoreUpdated = true;
        ballX = this.CANVAS_WIDTH / 2;
        ballY = this.CANVAS_HEIGHT / 2;
        ballSpeedX = -5;
        ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);
      }

      // Envoyer les mises à jour
      this.wsService.sendBallUpdate(this.gameId, ballX, ballY, ballSpeedX, ballSpeedY);
      
      if (scoreUpdated) {
        this.wsService.sendScoreUpdate(this.gameId, score1, score2);
      }

      this.lastBallUpdate = now;
    }
  }

  draw() {
    if (!this.ctx || !this.game) {
      console.log('Draw skipped - ctx:', !!this.ctx, 'game:', !!this.game);
      return;
    }
    
    // Fond
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Ligne centrale
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.CANVAS_WIDTH / 2, 0);
    this.ctx.lineTo(this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Paddle gauche
    this.ctx.fillStyle = '#667eea';
    this.ctx.fillRect(0, this.game.paddle1Y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
    
    // Paddle droit
    this.ctx.fillStyle = '#764ba2';
    this.ctx.fillRect(this.CANVAS_WIDTH - this.PADDLE_WIDTH, this.game.paddle2Y, this.PADDLE_WIDTH, this.PADDLE_HEIGHT);
    
    // Balle
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(this.game.ballX, this.game.ballY, this.BALL_SIZE, this.BALL_SIZE);
    
    // Scores
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.game.score1.toString(), this.CANVAS_WIDTH / 4, 60);
    this.ctx.fillText(this.game.score2.toString(), (this.CANVAS_WIDTH * 3) / 4, 60);
  }

  getControls(): string {
    if (this.isSpectator) {
      return 'Mode spectateur - Vous observez la partie';
    }
    return 'Déplacez votre souris pour contrôler votre paddle';
  }

  backToLobby() {
    console.log('backToLobby called, game status:', this.game?.status, 'isSpectator:', this.isSpectator);
    
    // Les spectateurs peuvent partir sans conséquence
    if (this.isSpectator) {
      this.stopGame();
      this.router.navigate(['/lobby']);
      return;
    }
    
    // Si la partie est en cours, notifier le serveur du forfait
    if (this.game && (this.game.status === GameStatus.PLAYING || this.game.status === GameStatus.WAITING )) {
      console.log('Sending leaveGame for gameId:', this.gameId);
      this.wsService.leaveGame(this.gameId);
      
      // Attendre un peu que le message soit envoyé avant de naviguer
      setTimeout(() => {
        console.log('Navigating to lobby after forfeit');
        this.stopGame();
        this.router.navigate(['/lobby']);
      }, 500);
    } else {
      // Partie déjà terminée ou en attente, naviguer directement
      console.log('Navigating to lobby directly');
      this.stopGame();
      this.router.navigate(['/lobby']);
    }
  }
}