import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { UsersModule } from './users/users.module';
import { GamesHistoryModule } from './games-history/games-history.module';
import { ChatModule } from './chat/chat.module';
import { User } from './users/entities/user.entity';
import { GameHistory } from './games-history/entities/game-history.entity';
import { ChatMessage } from './chat/entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'pong_user',
      password: 'pong_password',
      database: 'pong_db',
      entities: [User, GameHistory, ChatMessage],
      synchronize: true, // ⚠️ À mettre false en production
      logging: true,
    }),
    AuthModule,
    GameModule,
    UsersModule,
    GamesHistoryModule,
    ChatModule,
  ],
})
export class AppModule {}