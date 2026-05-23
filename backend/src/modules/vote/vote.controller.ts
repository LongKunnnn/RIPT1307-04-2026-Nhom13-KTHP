import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { VoteService } from './vote.service';
import { VoteDto } from './dto/create-vote.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Bật lên khi ráp Auth tuần 1

@ApiTags('Votes (Đánh giá)')
@Controller('votes')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'API dùng chung cho FE: Vote Post hoặc Comment (Value truyền 1 hoặc -1)' })
  @Post()
  async handleVote(@Body() data: VoteDto, @Req() req: any) {
    const userId = req.user?.id || 1; // Hardcode test
    return this.voteService.handleVote(userId, data.targetId, data.targetType, data.value);
  }
}