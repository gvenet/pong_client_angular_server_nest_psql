// src/games-history/games-history.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory } from './entities/game-history.entity';

@Injectable()
export class GamesHistoryService {
  constructor(
    @InjectRepository(GameHistory)
    private gamesHistoryRepository: Repository<GameHistory>,
  ) {}

  async saveGame(
    player1Id: string,
    player2Id: string,
    winnerId: string,
    score1: number,
    score2: number,
    duration: number,
  ): Promise<GameHistory> {
    const game = this.gamesHistoryRepository.create({
      player1_id: player1Id,
      player2_id: player2Id,
      winner_id: winnerId,
      score1,
      score2,
      duration,
    });
    return this.gamesHistoryRepository.save(game);
  }

  async getUserHistory(userId: string, limit = 10): Promise<GameHistory[]> {
    return this.gamesHistoryRepository.find({
      where: [
        { player1_id: userId },
        { player2_id: userId },
      ],
      relations: ['player1', 'player2', 'winner'],
      order: { playedAt: 'DESC' },
      take: limit,
    });
  }
}
