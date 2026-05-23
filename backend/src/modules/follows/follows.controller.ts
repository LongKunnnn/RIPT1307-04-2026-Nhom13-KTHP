import { Controller, Post, Get, Body, Param, Req, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { FollowDto } from './dto/follow.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Bật lên khi có Auth

@ApiTags('Follows (Theo dõi người dùng)')
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('toggle')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Theo dõi hoặc Bỏ theo dõi một người dùng' })
  async toggleFollow(@Body() data: FollowDto, @Req() req: any) {
    const currentUserId = req.user?.id || 1; // Hardcode tạm
    return this.followsService.toggleFollow(currentUserId, data.targetUserId);
  }

  @Get('followers/:userId')
  @ApiOperation({ summary: 'Lấy danh sách người theo dõi (Followers) của một user' })
  @ApiParam({ name: 'userId', type: 'number' })
  async getFollowers(@Param('userId', ParseIntPipe) userId: number) {
    return this.followsService.getFollowers(userId);
  }

  @Get('followings/:userId')
  @ApiOperation({ summary: 'Lấy danh sách những người mà user này đang theo dõi (Followings)' })
  @ApiParam({ name: 'userId', type: 'number' })
  async getFollowings(@Param('userId', ParseIntPipe) userId: number) {
    return this.followsService.getFollowings(userId);
  }
}