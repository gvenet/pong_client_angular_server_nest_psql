// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { GameHistory } from '../../games-history/entities/game-history.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: 1000 })
  elo: number;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  losses: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => GameHistory, (game) => game.player1)
  gamesAsPlayer1: GameHistory[];

  @OneToMany(() => GameHistory, (game) => game.player2)
  gamesAsPlayer2: GameHistory[];

  @OneToMany(() => ChatMessage, (message) => message.user)
  messages: ChatMessage[];
}
