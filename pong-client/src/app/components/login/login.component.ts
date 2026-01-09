// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  isRegisterMode = false;
  username = '';
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/lobby']);
    }
  }

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.error = '';
  }

  onSubmit() {
    this.error = '';
    this.loading = true;

    if (this.isRegisterMode) {
      // Inscription
      if (!this.username.trim() || !this.email.trim() || !this.password.trim()) {
        this.error = 'Tous les champs sont requis';
        this.loading = false;
        return;
      }

      this.authService.register(this.username, this.email, this.password).subscribe({
        next: () => {
          this.router.navigate(['/lobby']);
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de l\'inscription';
          this.loading = false;
          console.error(err);
        }
      });
    } else {
      // Connexion
      if (!this.username.trim() || !this.password.trim()) {
        this.error = 'Username et mot de passe requis';
        this.loading = false;
        return;
      }

      this.authService.login(this.username, this.password).subscribe({
        next: () => {
          this.router.navigate(['/lobby']);
        },
        error: (err) => {
          this.error = err.error?.message || 'Identifiants incorrects';
          this.loading = false;
          console.error(err);
        }
      });
    }
  }
}