import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/auth.decorators';
import type { AuthUserPayload } from '../../common/utils/helpers';
import {
  CreatePostDto, UpdatePostDto, ListPostsQueryDto, RatePostDto, AcceptAnswerDto
} from './dto/posts.dto';

@ApiTags('Posts (Bài viết)')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // =====================================
  // ROUTE TĨNH (Phải đặt trên route /:id)
  // =====================================
  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê diễn đàn (Số bài, câu trả lời...)' })
  getForumStats() {
    return this.postsService.getForumStats();
  }

  @Public()
  @Get('tags')
  @ApiOperation({ summary: 'Lấy danh sách các Tag đang có kèm số lượng bài' })
  getTags() {
    return this.postsService.getTagsWithCount();
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('featured')
  @ApiOperation({ summary: 'Lấy danh sách bài viết nổi bật' })
  getFeatured() {
    return this.postsService.getFeatured(5);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài viết (Có lọc và phân trang)' })
  listPosts(@Query() query: ListPostsQueryDto, @CurrentUser() user: AuthUserPayload | null) {
    return this.postsService.list(query, user);
  }

  // =====================================
  // ROUTE BẢO MẬT (Phải đăng nhập)
  // =====================================
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Đăng bài viết mới' })
  createPost(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUserPayload) {
    return this.postsService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/rate')
  @ApiOperation({ summary: 'Đánh giá sao (Rate) bài viết' })
  ratePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RatePostDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.postsService.ratePost(id, user.id, dto.stars);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/rate')
  @ApiOperation({ summary: 'Xem mức đánh giá của chính mình cho bài viết này' })
  getMyRating(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUserPayload) {
    return this.postsService.getMyRating(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/accept-answer')
  @ApiOperation({ summary: 'Tác giả chốt câu trả lời đúng và trao tiền thưởng (Bounty)' })
  acceptAnswer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AcceptAnswerDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.postsService.acceptAnswer(id, dto.commentId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Sửa bài viết (Chỉ tác giả)' })
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.postsService.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài viết (Chỉ tác giả)' })
  deletePost(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUserPayload) {
    return this.postsService.delete(id, user.id);
  }

  // =====================================
  // ROUTE ĐỘNG (/:id) - Đặt dưới cùng
  // =====================================
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết bài viết (Guest xem được)' })
  getPost(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUserPayload | null) {
    return this.postsService.getById(id, user);
  }
}