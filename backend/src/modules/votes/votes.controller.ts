import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VoteDto } from './dto/votes.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';

@Controller('votes')
@UseGuards(JwtAuthGuard)
export class VotesController {
  constructor(private votesService: VotesService) {}

  @Post()
  vote(@Body() dto: VoteDto, @CurrentUser() user: AuthUserPayload) {
    return this.votesService.vote(dto, user);
  }

  @Get('mine')
  getUserVote(
    @Query('targetType') targetType: 'post' | 'comment',
    @Query('targetId') targetId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.votesService.getUserVote(targetType, Number(targetId), user.id);
  }
}
