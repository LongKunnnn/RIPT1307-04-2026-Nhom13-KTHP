import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';

// ⚠️ Mở comment dòng này và trỏ đúng đường dẫn đến cái JWT Guard mà mày đã làm ở Tuần 1
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@ApiTags('Comments (Bình luận)')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('post/:postId')
  @ApiOperation({ summary: 'Lấy danh sách bình luận 2 cấp của một bài viết' })
  @ApiParam({ name: 'postId', type: 'number', description: 'ID của bài viết' })
  async getCommentsByPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentService.getCommentsByPost(postId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Viết bình luận gốc hoặc Reply' })
  async create(@Body() data: CreateCommentDto, @Req() req: any) {
    // Tạm thời hardcode userId = 1 để test Swagger. Khi bật Guard thì xài req.user.id
    const userId = req.user?.id || 1; 
    return this.commentService.create(userId, data);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chỉnh sửa nội dung bình luận' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID của bình luận cần sửa' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCommentDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 1;
    return this.commentService.update(id, userId, data);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa mềm bình luận (Ném vào thùng rác)' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID của bình luận cần xóa' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.id || 1;
    const userRole = req.user?.role || 'USER'; 
    
    return this.commentService.remove(id, userId, userRole);
  }
}