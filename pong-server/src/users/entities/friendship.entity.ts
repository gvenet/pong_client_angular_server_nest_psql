// src/users/entities/friendship.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn, Column } from 'typeorm';
import { User } from './user.entity';

@Entity('friendships')
export class Friendship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  friend_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'friend_id' })
  friend: User;

  @CreateDateColumn()
  createdAt: Date;
}