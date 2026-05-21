import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { Public } from '../../common/decorators/auth.decorators';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Public()
  @Get()
  get(
    @Query('scope') scope?: string,
    @Query('tag') tag?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedScope = scope === 'tag' ? 'tag' : 'global';
    const lim = Math.min(20, Math.max(1, Number(limit) || 8));
    return this.leaderboardService.getLeaderboard(parsedScope, tag, lim);
  }
}
