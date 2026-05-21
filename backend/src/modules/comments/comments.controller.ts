import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comments.dto';
import { Public } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Public()
  @Get()
  list(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('includeNonPublic') includeNonPublic?: string,
  ) {
    return this.commentsService.listByPost(postId, includeNonPublic === 'true');
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  add(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.commentsService.add(postId, dto, user);
  }
}
