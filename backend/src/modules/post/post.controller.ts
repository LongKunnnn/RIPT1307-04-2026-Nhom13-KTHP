import { Controller, Post, Body, Req } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Posts (Bài viết)')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @ApiBearerAuth() 
  @ApiOperation({ summary: 'Đăng bài viết mới (Yêu cầu đăng nhập)' })
  create(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    const authorId = req.user.id; 
    
    return this.postService.create(createPostDto, authorId);
  }
}