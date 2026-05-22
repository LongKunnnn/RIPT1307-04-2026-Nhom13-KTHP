import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import {
  AcceptAnswerDto,
  CreatePostDto,
  ListPostsQueryDto,
  RatePostDto,
  UpdatePostDto,
} from './dto/posts.dto';
import { Public } from '../../common/decorators/auth.decorators';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  list(
    @Query() query: ListPostsQueryDto,
    @CurrentUser() user: AuthUserPayload | null,
  ) {
    return this.postsService.list(query, user);
  }

  @Public()
  @Get('tags')
  getTags() {
    return this.postsService.getTagsWithCount();
  }

  @Public()
  @Get('stats')
  getStats() {
    return this.postsService.getForumStats();
  }

  @Public()
  @Get('featured')
  getFeatured() {
    return this.postsService.getFeatured();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rate')
  rate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RatePostDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.postsService.ratePost(id, user.id, dto.stars);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/my-rating')
  getMyRating(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.postsService.getMyRating(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept-answer')
  acceptAnswer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AcceptAnswerDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.postsService.acceptAnswer(id, dto.commentId, user.id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  getById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUserPayload | null,
  ) {
    return this.postsService.getById(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUserPayload) {
    return this.postsService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    const post = await this.postsService.getById(id);
    if (post.authorId !== String(user.id) && user.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài viết này');
    }
    return this.postsService.update(id, dto);
  }
}
