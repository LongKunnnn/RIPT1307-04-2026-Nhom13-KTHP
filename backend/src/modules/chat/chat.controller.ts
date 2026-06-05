import { Controller, Get, Post, Body, Query, UseGuards, ParseIntPipe, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';

@ApiTags('Chat 1:1')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('search-users')
  @ApiOperation({ summary: 'Tìm trong danh sách đã từng nhắn tin (hộp thư chính)' })
  searchInboxPartners(
    @Query('q') query: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.chatService.searchInboxPartners(query, user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Lấy hoặc tạo cuộc trò chuyện với 1 người dùng' })
  getOrCreateConversation(
    @Body('userId') userId: number,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.chatService.getOrCreateConversation(user.id, userId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lấy danh sách các cuộc trò chuyện của tôi' })
  getMyConversations(@CurrentUser() user: AuthUserPayload) {
    return this.chatService.getMyConversations(user.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Lấy tin nhắn trong cuộc trò chuyện' })
  getMessages(
    @Param('id', ParseIntPipe) conversationId: number,
    @CurrentUser() user: AuthUserPayload,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '30',
  ) {
    return this.chatService.getMessages(conversationId, user.id, parseInt(page), parseInt(pageSize));
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn trong cuộc trò chuyện' })
  sendMessage(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body('content') content: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.chatService.sendMessage(conversationId, user.id, content);
  }
}
