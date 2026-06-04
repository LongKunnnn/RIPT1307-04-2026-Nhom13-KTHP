import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';

// TẤT CẢ MODULES (Đã chuẩn hóa số nhiều)
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { VotesModule } from './modules/votes/votes.module';
import { AdminModule } from './modules/admin/admin.module';
import { FollowsModule } from './modules/follows/follows.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { ChatModule } from './modules/chat/chat.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { JwtStrategy } from './common/strategies/jwt.strategy';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 200,
    }]),
    // Gắn các Module vào đây
    PrismaModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    VotesModule,
    AdminModule,
    FollowsModule,
    LeaderboardModule,
    RewardsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    {
      // Đăng ký JwtAuthGuard bảo vệ toàn cục (Chỉ khai báo 1 lần duy nhất)
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}