import { 
  Controller, Post, Get, Body, Param, Query, ParseIntPipe, UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FollowsService } from './follows.service';

// DTO của mày
import { FollowDto } from './dto/follow.dto';
import { GetFollowsDto } from './dto/get-follows.dto';
// DTO của FE (để list bài viết)
import { ListPostsQueryDto } from '../posts/dto/posts.dto';

import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';

@ApiTags('Follows (Theo dõi Người dùng & Bài viết)')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  // ==============================================================
  // 🟢 PHẦN 1: API THEO DÕI NGƯỜI DÙNG 
  // ==============================================================

  @Post('users/toggle') // Đổi nhẹ route để tránh đụng chạm với Post
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Theo dõi hoặc Bỏ theo dõi Người dùng' })
  async toggleFollowUser(@Body() data: FollowDto, @CurrentUser() user: AuthUserPayload) {
    return this.followsService.toggleFollow(user.id, data.targetUserId);
  }

  @Get('users/:userId/followers')
  @UseGuards(OptionalJwtAuthGuard) // Khách vãng lai xem được, nhưng có token thì check thêm isFollowing
  @ApiOperation({ summary: 'Lấy danh sách người theo dõi (Có phân trang & Check isFollowing)' })
  async getFollowers(
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Query() query: GetFollowsDto,
    @CurrentUser() user: AuthUserPayload | null
  ) {
    // Nếu không đăng nhập thì user id mặc định là 0 (để mapIsFollowing trả về false hết)
    const currentUserId = user?.id || 0; 
    return this.followsService.getFollowers(targetUserId, currentUserId, query.page, query.limit);
  }

  @Get('users/:userId/followings')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách người đang theo dõi (Có phân trang & Check isFollowing)' })
  async getFollowings(
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Query() query: GetFollowsDto,
    @CurrentUser() user: AuthUserPayload | null
  ) {
    const currentUserId = user?.id || 0;
    return this.followsService.getFollowings(targetUserId, currentUserId, query.page, query.limit);
  }

  // ==============================================================
  // 🔵 PHẦN 2: API THEO DÕI BÀI VIẾT (Cho Frontend)
  // ==============================================================

  @Post('posts/:postId/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lưu / Bỏ lưu (Theo dõi) Bài viết' })
  async toggleFollowPost(
    @Param('postId', ParseIntPipe) postId: number, 
    @CurrentUser() user: AuthUserPayload
  ) {
    return this.followsService.toggle(user.id, postId);
  }

  @Get('posts/:postId/check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra xem mình có đang theo dõi bài viết này không' })
  async checkFollowingPost(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: AuthUserPayload
  ) {
    const isFollowing = await this.followsService.isFollowing(user.id, postId);
    return { isFollowing };
  }

  @Get('posts/me/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách các bài viết mình đã lưu (Có phân trang)' })
  async getMyFollowedPosts(
    @Query() query: ListPostsQueryDto,
    @CurrentUser() user: AuthUserPayload
  ) {
    return this.followsService.listFollowedPosts(user.id, query);
  }

  @Get('posts/me/count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đếm tổng số bài viết mình đã lưu' })
  async countMyFollowedPosts(@CurrentUser() user: AuthUserPayload) {
    const count = await this.followsService.countFollowed(user.id);
    return { totalFollowed: count };
  }

  @Get('posts/me/ids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy mảng ID các bài viết đã lưu (Dành cho FE render)' })
  async getMyFollowedPostIds(@CurrentUser() user: AuthUserPayload) {
    const ids = await this.followsService.getFollowedPostIds(user.id);
    return { followedPostIds: ids };
  }
}