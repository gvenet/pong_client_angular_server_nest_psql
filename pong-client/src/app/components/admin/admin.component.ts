// src/app/components/admin/admin.component.ts
import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { ChatMessage, ChatStats } from '../../models/chat-message.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  // Users
  users: User[] = [];
  loading = true;
  error = '';
  currentUser: User | null = null;

  // Chat
  messages: ChatMessage[] = [];
  chatStats: ChatStats | null = null;
  chatLoading = false;
  chatError = '';
  selectedTab: 'users' | 'chat' = 'users';
  chatFilter: 'all' | 'global' | 'game' = 'all';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // Rafraîchir le profil utilisateur depuis le serveur pour avoir le rôle à jour
    this.authService.refreshUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user;

        // Vérifier si l'utilisateur est toujours admin
        if (user.role !== 'admin') {
          alert('Vous n\'avez plus les droits d\'administrateur');
          this.router.navigate(['/lobby']);
          return;
        }

        this.loadUsers();
      },
      error: (err) => {
        console.error('Error refreshing profile:', err);
        this.router.navigate(['/lobby']);
      }
    });
  }

  loadUsers() {
    this.loading = true;
    this.error = '';

    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        if (err.status === 403) {
          alert('Vous n\'avez plus les droits d\'administrateur');
          this.router.navigate(['/lobby']);
        } else {
          this.error = 'Erreur lors du chargement des utilisateurs';
        }
        this.loading = false;
      }
    });
  }

  deleteUser(user: User) {
    if (user.id === this.currentUser?.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte !');
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.username} ?`)) {
      return;
    }

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        if (err.status === 403) {
          alert('Vous n\'avez plus les droits d\'administrateur');
          this.router.navigate(['/lobby']);
        } else {
          alert('Erreur lors de la suppression de l\'utilisateur');
        }
      }
    });
  }

  toggleRole(user: User) {
    if (user.id === this.currentUser?.id) {
      alert('Vous ne pouvez pas modifier votre propre rôle !');
      return;
    }

    const newRole = user.role === 'admin' ? 'user' : 'admin';

    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
      },
      error: (err) => {
        console.error('Error updating role:', err);
        if (err.status === 403) {
          alert('Vous n\'avez plus les droits d\'administrateur');
          this.router.navigate(['/lobby']);
        } else {
          alert('Erreur lors de la modification du rôle');
        }
      }
    });
  }

  getRoleClass(role: string): string {
    return role === 'admin' ? 'role-admin' : 'role-user';
  }

  getWinRate(user: User): string {
    const total = user.wins + user.losses;
    if (total === 0) return '0';
    return ((user.wins / total) * 100).toFixed(0);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // Chat methods
  switchTab(tab: 'users' | 'chat') {
    this.selectedTab = tab;
    if (tab === 'chat' && this.messages.length === 0) {
      this.loadChatData();
    }
  }

  loadChatData() {
    this.chatLoading = true;
    this.chatError = '';

    // Charger les stats
    this.adminService.getChatStats().subscribe({
      next: (stats) => {
        this.chatStats = stats;
      },
      error: (err) => {
        console.error('Error loading chat stats:', err);
      }
    });

    // Charger les messages selon le filtre
    this.loadMessages();
  }

  loadMessages() {
    this.chatLoading = true;
    this.chatError = '';

    let observable;
    if (this.chatFilter === 'global') {
      observable = this.adminService.getGlobalMessages(100);
    } else {
      observable = this.adminService.getAllMessages(100);
    }

    observable.subscribe({
      next: (messages) => {
        if (this.chatFilter === 'game') {
          this.messages = messages.filter(m => m.game_id !== null);
        } else {
          this.messages = messages;
        }
        this.chatLoading = false;
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        if (err.status === 403) {
          alert('Vous n\'avez plus les droits d\'administrateur');
          this.router.navigate(['/lobby']);
        } else {
          this.chatError = 'Erreur lors du chargement des messages';
        }
        this.chatLoading = false;
      }
    });
  }

  deleteMessage(message: ChatMessage) {
    if (!confirm(`Supprimer ce message de ${message.user.username} ?`)) {
      return;
    }

    this.adminService.deleteMessage(message.id).pipe(
      switchMap(() => this.adminService.getChatStats())
    ).subscribe({
      next: (stats) => {
        this.messages = this.messages.filter(m => m.id !== message.id);
        this.chatStats = stats;
      },
      error: (err) => {
        console.error('Error:', err);
        if (err.status === 403) {
          alert('Vous n\'avez plus les droits d\'administrateur');
          this.router.navigate(['/lobby']);
        } else {
          alert('Erreur lors de la suppression du message');
        }
      }
    });
  }

  setChatFilter(filter: 'all' | 'global' | 'game') {
    this.chatFilter = filter;
    this.loadMessages();
  }

  getMessageTypeLabel(message: ChatMessage): string {
    return message.game_id ? 'Partie' : 'Global';
  }

  getMessageTypeClass(message: ChatMessage): string {
    return message.game_id ? 'type-game' : 'type-global';
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
  }

  backToLobby() {
    this.router.navigate(['/lobby']);
  }
}
