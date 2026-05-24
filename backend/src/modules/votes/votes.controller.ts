import { Controller, Get, Post, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VotesService } from './votes.service';
import { VoteDto } from './dto/votes.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';

@ApiTags('Votes (Đánh giá Upvote/Downvote)')
@Controller('votes')
@UseGuards(JwtAuthGuard) // Khóa toàn bộ các API trong này bắt buộc phải có Token
@ApiBearerAuth()
export class VotesController {
  constructor(private votesService: VotesService) {}

  @Post()
  @ApiOperation({ summary: 'Thả vote (Truyền 1 để Upvote, -1 để Downvote). Bấm lại lần 2 để hủy vote.' })
  vote(@Body() dto: VoteDto, @CurrentUser() user: AuthUserPayload) {
    return this.votesService.vote(dto, user);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Lấy trạng thái vote hiện tại của user cho 1 bài viết/bình luận' })
  getUserVote(
    @Query('targetType') targetType: 'post' | 'comment',
    @Query('targetId', ParseIntPipe) targetId: number,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.votesService.getUserVote(targetType, targetId, user.id);
  }
}