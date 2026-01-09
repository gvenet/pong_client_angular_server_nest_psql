// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface User {
  id: string;
  username: string;
  email: string;
  elo: number;
  wins?: number;
  losses?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private storage = sessionStorage;

  constructor(private http: HttpClient) {
    const user = this.storage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }

    // Écouter les changements de sessionStorage (autre onglet)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'user' || event.key === 'token') {
          const newUser = this.storage.getItem('user');
          if (newUser) {
            this.currentUserSubject.next(JSON.parse(newUser));
          } else {
            this.currentUserSubject.next(null);
          }
        }
      });
    }
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, { username, email, password }).pipe(
      tap(response => {
        this.storage.setItem('token', response.access_token);
        this.storage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        this.storage.setItem('token', response.access_token);
        this.storage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout() {
    this.storage.removeItem('token');
    this.storage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.storage.getItem('token');
  }

  getToken(): string | null {
    return this.storage.getItem('token');
  }
}
