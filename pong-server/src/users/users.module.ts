// src/users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Friendship } from './entities/friendship.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Friendship]),
    forwardRef(() => AuthModule),
  ],
  providers: [UsersService],
  controllers: [UsersController, AdminController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
