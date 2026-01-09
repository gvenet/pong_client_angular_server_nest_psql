// src/app/components/lobby/lobby.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { GameService } from '../../services/game.service';
import { ChatComponent } from '../chat/chat.component';
import { Game, GameStatus } from '../../models/game.model';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, ChatComponent],
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit, OnDestroy {
  username = '';
  games: Game[] = [];
  loading = false;
  error = '';
  private refreshSubscription?: Subscription;
  private userSubscription?: Subscription;

  GameStatus = GameStatus;

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user) {
      this.username = user.username;
    }

    // Surveiller les changements d'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.username = user.username;
          console.log('User changed in lobby:', user.username);
        } else {
          // Si plus d'utilisateur, rediriger vers login
          this.router.navigate(['/login']);
        }
      }
    });

    this.loadGames();

    this.refreshSubscription = interval(3000)
      .pipe(switchMap(() => this.gameService.getAllGames()))
      .subscribe({
        next: (games) => {
          this.games = games;
        },
        error: (err) => {
          console.error('Error refreshing games:', err);
        }
      });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadGames() {
    this.loading = true;
    this.gameService.getAllGames().subscribe({
      next: (games) => {
        this.games = games;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des parties';
        this.loading = false;
        console.error(err);
      }
    });
  }

  newGame() {
    this.loading = true;
    this.error = '';
    
    this.gameService.findOrCreateGame().subscribe({
      next: (result) => {
        if (result.joined) {
          console.log('Partie rejointe:', result.game);
          // Rediriger vers la page de jeu
          this.router.navigate(['/game', result.game.id]);
        } else {
          const currentUser = this.authService.currentUser;
          const isExistingGame = currentUser && 
            (result.game.player1.id === currentUser.id || result.game.player2?.id === currentUser.id);
          
          if (isExistingGame) {
            // Rediriger vers la partie existante
            this.router.navigate(['/game', result.game.id]);
          } else {
            console.log('Nouvelle partie créée:', result.game);
            // Rediriger vers la nouvelle partie
            this.router.navigate(['/game', result.game.id]);
          }
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors de la création de la partie';
        this.loading = false;
        console.error(err);
      }
    });
  }

  isMyGame(game: Game): boolean {
    const currentUser = this.authService.currentUser;
    return currentUser ? game.player1.id === currentUser.id : false;
  }

  canJoinGame(game: Game): boolean {
    return game.status === GameStatus.WAITING && !this.isMyGame(game);
  }

  canWatchGame(game: Game): boolean {
    return game.status === GameStatus.PLAYING && !this.isPlayerInGame(game);
  }

  isPlayerInGame(game: Game): boolean {
    const currentUser = this.authService.currentUser;
    if (!currentUser) return false;
    return game.player1.id === currentUser.id || game.player2?.id === currentUser.id;
  }

  handleGameCardClick(game: Game) {
    console.log('=== handleGameCardClick ===');
    console.log('Game status:', game.status);
    console.log('isMyGame:', this.isMyGame(game));
    console.log('canJoinGame:', this.canJoinGame(game));
    console.log('canWatchGame:', this.canWatchGame(game));
    
    // Si c'est ma partie, y aller directement
    if (this.isMyGame(game)) {
      console.log('→ Action: Navigating to my game');
      this.router.navigate(['/game', game.id]);
      return;
    }

    // Si la partie est en attente, la rejoindre
    if (this.canJoinGame(game)) {
      console.log('→ Action: Joining game');
      this.joinGame(game);
      return;
    }

    // Si la partie est en cours, la regarder en tant que spectateur
    if (this.canWatchGame(game)) {
      console.log('→ Action: Watching game as spectator');
      this.router.navigate(['/game', game.id], { queryParams: { spectator: 'true' } });
      return;
    }
    
    console.log('→ Action: No action taken');
  }

  joinGame(game: Game) {
    if (game.status !== GameStatus.WAITING) {
      return;
    }
    
    const currentUser = this.authService.currentUser;
    if (currentUser && game.player1.id === currentUser.id) {
      // Si c'est notre partie, y aller directement
      this.router.navigate(['/game', game.id]);
      return;
    }
    
    this.loading = true;
    this.gameService.joinGame(game.id).subscribe({
      next: (joinedGame) => {
        console.log('Partie rejointe:', joinedGame);
        // Rediriger vers la page de jeu
        this.router.navigate(['/game', joinedGame.id]);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur complète:', err);
        const errorMsg = err.error?.message || 'Impossible de rejoindre cette partie';
        
        if (errorMsg.includes('Cannot join')) {
          this.error = 'Vous avez déjà une partie active. Terminez-la avant d\'en rejoindre une autre.';
        } else {
          this.error = errorMsg;
        }
        this.loading = false;
      }
    });
  }

  getStatusText(status: GameStatus): string {
    switch (status) {
      case GameStatus.WAITING:
        return 'En attente';
      case GameStatus.PLAYING:
        return 'En cours';
      case GameStatus.FINISHED:
        return 'Terminée';
      default:
        return status;
    }
  }

  getStatusClass(status: GameStatus): string {
    switch (status) {
      case GameStatus.WAITING:
        return 'status-waiting';
      case GameStatus.PLAYING:
        return 'status-playing';
      case GameStatus.FINISHED:
        return 'status-finished';
      default:
        return '';
    }
  }

  getTimeSince(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}j`;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
