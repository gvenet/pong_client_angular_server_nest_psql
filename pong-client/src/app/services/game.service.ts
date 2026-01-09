// src/app/services/game.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Game } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'http://localhost:3000/games';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllGames(): Observable<Game[]> {
    return this.http.get<Game[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  getGame(id: string): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  findOrCreateGame(): Observable<{ game: Game; joined: boolean }> {
    return this.http.post<{ game: Game; joined: boolean }>(
      `${this.apiUrl}/find-or-create`,
      {},
      { headers: this.getHeaders() }
    );
  }

  joinGame(gameId: string): Observable<Game> {
    return this.http.post<Game>(
      `${this.apiUrl}/${gameId}/join`,
      {},
      { headers: this.getHeaders() }
    );
  }
}