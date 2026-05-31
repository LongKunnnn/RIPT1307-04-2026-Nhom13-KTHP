import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/auth.decorators';
import type { AuthUserPayload } from '../../common/utils/helpers';
import { CreateCommentDto, UpdateCommentDto } from './dto/comments.dto';

@ApiTags('Comments (Bình luận & Trả lời)')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bình luận của 1 bài viết (Dạng cây)' })
  getCommentsByPost(
    @Query('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: AuthUserPayload | null,
  ) {
    // Admin thì cho xem cả bình luận ẩn, user thường chỉ xem đồ đã duyệt
    const isAdmin = user?.role === 'admin';
    return this.commentsService.listByPost(postId, isAdmin);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Thêm bình luận hoặc trả lời' })
  addComment(@Body() dto: CreateCommentDto, @CurrentUser() user: AuthUserPayload) {
    return this.commentsService.add(dto.postId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Sửa nội dung bình luận (Chỉ tác giả)' })
  updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.commentsService.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bình luận (Tác giả hoặc Admin)' })
  deleteComment(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUserPayload) {
    return this.commentsService.remove(id, user.id, user.role);
  }
}