import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { GetLeaderboardDto } from './dto/get-leaderboard.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Leaderboard (Bảng xếp hạng)')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('top')
  @ApiOperation({ summary: 'Lấy top user có điểm uy tín cao nhất' })
  async getTopUsers(@Query() query: GetLeaderboardDto) {
    return this.leaderboardService.getTopUsers(query.limit);
  }
}