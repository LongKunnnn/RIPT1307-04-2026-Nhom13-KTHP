import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [LeaderboardController],
  providers: [LeaderboardService, PrismaService], // Giữ Prisma của mày
  exports: [LeaderboardService], // Giữ export của FE
})
export class LeaderboardModule {}