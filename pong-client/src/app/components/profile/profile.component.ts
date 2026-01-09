// src/app/components/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  selectedTab: 'profile' | 'friends' = 'profile';
  user: User | null = null;
  friends: User[] = [];
  searchQuery = '';
  searchResults: User[] = [];

  // Profile edit
  editingUsername = false;
  editingEmail = false;
  editingPassword = false;
  newUsername = '';
  newEmail = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  loading = false;
  error = '';
  success = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.newUsername = user.username;
        this.newEmail = user.email;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.error = 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });
  }

  switchTab(tab: 'profile' | 'friends') {
    this.selectedTab = tab;
    if (tab === 'friends' && this.friends.length === 0) {
      this.loadFriends();
    }
  }

  // Profile methods
  saveUsername() {
    if (!this.newUsername || this.newUsername === this.user?.username) {
      this.editingUsername = false;
      return;
    }

    this.error = '';
    this.success = '';
    this.userService.updateUsername(this.newUsername).subscribe({
      next: (user) => {
        this.user = user;
        this.editingUsername = false;
        this.success = 'Nom d\'utilisateur modifié';
        this.authService.refreshUserProfile().subscribe();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la modification';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  saveEmail() {
    if (!this.newEmail || this.newEmail === this.user?.email) {
      this.editingEmail = false;
      return;
    }

    this.error = '';
    this.success = '';
    this.userService.updateEmail(this.newEmail).subscribe({
      next: (user) => {
        this.user = user;
        this.editingEmail = false;
        this.success = 'Email modifié';
        this.authService.refreshUserProfile().subscribe();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la modification';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  savePassword() {
    if (!this.currentPassword || !this.newPassword) {
      this.error = 'Tous les champs sont requis';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.error = '';
    this.success = '';
    this.userService.updatePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.editingPassword = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.success = 'Mot de passe modifié';
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la modification';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  cancelEdit(field: 'username' | 'email' | 'password') {
    if (field === 'username') {
      this.editingUsername = false;
      this.newUsername = this.user?.username || '';
    } else if (field === 'email') {
      this.editingEmail = false;
      this.newEmail = this.user?.email || '';
    } else if (field === 'password') {
      this.editingPassword = false;
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    }
    this.error = '';
  }

  // Friends methods
  loadFriends() {
    this.userService.getFriends().subscribe({
      next: (friends) => {
        this.friends = friends;
      },
      error: (err) => {
        console.error('Error loading friends:', err);
      }
    });
  }

  searchUsers() {
    if (this.searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }

    this.userService.searchUsers(this.searchQuery).subscribe({
      next: (users) => {
        this.searchResults = users;
      },
      error: (err) => {
        console.error('Error searching users:', err);
      }
    });
  }

  addFriend(userId: string) {
    this.userService.addFriend(userId).subscribe({
      next: () => {
        this.searchQuery = '';
        this.searchResults = [];
        this.loadFriends();
        this.success = 'Ami ajouté';
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de l\'ajout';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  removeFriend(friend: User) {
    if (!confirm(`Retirer ${friend.username} de vos amis ?`)) {
      return;
    }

    this.userService.removeFriend(friend.id).subscribe({
      next: () => {
        this.loadFriends();
        this.success = 'Ami retiré';
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = 'Erreur lors de la suppression';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  isFriend(userId: string): boolean {
    return this.friends.some(f => f.id === userId);
  }

  getWinRate(user: User): string {
    const total = user.wins + user.losses;
    if (total === 0) return '0';
    return ((user.wins / total) * 100).toFixed(0);
  }

  backToLobby() {
    this.router.navigate(['/lobby']);
  }
}