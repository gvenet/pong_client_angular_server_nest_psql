// src/app/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { ChatMessage, ChatStats } from '../models/chat-message.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/admin';

  constructor(private http: HttpClient) {}

  // Users
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  updateUserRole(userId: string, role: string): Observable<User> {
    return this.http.patch<User>(
      `${this.apiUrl}/users/${userId}/role`,
      { role }
    );
  }

  // Chat
  getAllMessages(limit?: number): Observable<ChatMessage[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/messages${params}`);
  }

  getGlobalMessages(limit?: number): Observable<ChatMessage[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/global${params}`);
  }

  getGameMessages(gameId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/messages?gameId=${gameId}`);
  }

  deleteMessage(messageId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chat/messages/${messageId}`);
  }

  getChatStats(): Observable<ChatStats> {
    return this.http.get<ChatStats>(`${this.apiUrl}/chat/stats`);
  }
}
