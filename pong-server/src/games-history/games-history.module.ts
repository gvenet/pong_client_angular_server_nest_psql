// src/games-history/games-history.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistory } from './entities/game-history.entity';
import { GamesHistoryService } from './games-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameHistory])],
  providers: [GamesHistoryService],
  exports: [GamesHistoryService],
})
export class GamesHistoryModule {}