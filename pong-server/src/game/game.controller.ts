// src/game/game.controller.ts
import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GameService } from './game.service';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameService: GameService) {}

  @Get()
  getAllGames() {
    return this.gameService.getActiveGames();
  }

  @Get(':id')
  getGame(@Param('id') id: string) {
    const game = this.gameService.getGameById(id);
    if (!game) {
      return { error: 'Game not found' };
    }
    return game;
  }

  @Post('find-or-create')
  findOrCreateGame(@Request() req) {
    const player = {
      id: req.user.id,
      username: req.user.username
    };
    
    return this.gameService.findOrCreateGame(player);
  }

  @Post(':id/join')
  joinGame(@Param('id') id: string, @Request() req) {
    const player = {
      id: req.user.id,
      username: req.user.username
    };
    
    const game = this.gameService.joinGame(id, player);
    
    if (!game) {
      throw new Error('Cannot join this game');
    }
    
    return game;
  }
}