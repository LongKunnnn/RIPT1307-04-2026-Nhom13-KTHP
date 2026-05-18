import { Controller, Get, Post, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';
import { ListPostsQueryDto } from '../posts/dto/posts.dto';

@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private followsService: FollowsService) {}

  @Get('mine/ids')
  getFollowedIds(@CurrentUser() user: AuthUserPayload) {
    return this.followsService.getFollowedPostIds(user.id);
  }

  @Get('mine/count')
  count(@CurrentUser() user: AuthUserPayload) {
    return this.followsService.countFollowed(user.id);
  }

  @Get('mine/posts')
  listPosts(@CurrentUser() user: AuthUserPayload, @Query() query: ListPostsQueryDto) {
    return this.followsService.listFollowedPosts(user.id, query);
  }

  @Get(':postId/status')
  status(@CurrentUser() user: AuthUserPayload, @Param('postId', ParseIntPipe) postId: number) {
    return this.followsService.isFollowing(user.id, postId);
  }

  @Post(':postId/toggle')
  toggle(@CurrentUser() user: AuthUserPayload, @Param('postId', ParseIntPipe) postId: number) {
    return this.followsService.toggle(user.id, postId);
  }
}
