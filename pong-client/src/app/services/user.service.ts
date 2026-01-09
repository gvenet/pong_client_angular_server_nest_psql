// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  // Profile
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  updateUsername(username: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile/username`, { username });
  }

  updateEmail(email: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile/email`, { email });
  }

  updatePassword(data: UpdatePasswordDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/profile/password`, data);
  }

  // Friends
  getFriends(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/friends`);
  }

  addFriend(friendId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/friends/${friendId}`, {});
  }

  removeFriend(friendId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/friends/${friendId}`);
  }

  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }
}