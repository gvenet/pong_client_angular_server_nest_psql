// src/app/models/user.model.ts
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  elo: number;
  wins: number;
  losses: number;
  createdAt?: Date;
}
