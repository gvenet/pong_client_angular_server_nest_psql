// src/game/game.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: 'YOUR_SECRET_KEY_CHANGE_THIS',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}