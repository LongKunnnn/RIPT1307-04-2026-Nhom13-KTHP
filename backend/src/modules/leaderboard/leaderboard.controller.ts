import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { GetLeaderboardDto } from './dto/get-leaderboard.dto';
import { Public } from '../../common/decorators/auth.decorators';

@ApiTags('Leaderboard (Bảng xếp hạng)')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Public() // Mở cửa cho khách vãng lai xem bảng xếp hạng
  @Get()
  @ApiOperation({ summary: 'Lấy bảng xếp hạng điểm uy tín (Global hoặc theo Tag)' })
  async getLeaderboard(@Query() query: GetLeaderboardDto) {
    // Truyền thẳng data đã được DTO gọt dũa sạch sẽ xuống Service
    // Lưu ý: Tên hàm dưới Service phải khớp với nhau (ở đây tao gọi theo tên FE là getLeaderboard)
    return this.leaderboardService.getLeaderboard(query.scope, query.tag, query.limit);
  }
}