// src/games-history/entities/game-history.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('games_history')
export class GameHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.gamesAsPlayer1)
  @JoinColumn({ name: 'player1_id' })
  player1: User;

  @Column()
  player1_id: string;

  @ManyToOne(() => User, (user) => user.gamesAsPlayer2)
  @JoinColumn({ name: 'player2_id' })
  player2: User;

  @Column()
  player2_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'winner_id' })
  winner: User;

  @Column()
  winner_id: string;

  @Column()
  score1: number;

  @Column()
  score2: number;

  @Column({ nullable: true })
  duration: number; // en secondes

  @CreateDateColumn()
  playedAt: Date;
}