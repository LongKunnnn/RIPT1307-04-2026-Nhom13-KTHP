import { Controller, Get, Post, Patch, Body, Req, Query, Param } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { UpdatePostDto } from './dto/update-post.dto';

@ApiTags('Posts (Bài viết)')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng bài viết mới (Yêu cầu đăng nhập)' })
  create(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    const authorId = req.user.id;

    return this.postService.create(createPostDto, authorId);
  }

  @Public()
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tag') tag?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;

    return this.postService.findAll(pageNumber, limitNumber, tag);
  }

  @Public() 
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const postId = parseInt(id, 10);

    return this.postService.findOne(postId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdatePostDto, 
    @Req() req: any,
  ) {
    const postId = parseInt(id, 10);
    const userId = req.user.id; 
    
    return this.postService.update(postId, userId, updateData);
  }
}