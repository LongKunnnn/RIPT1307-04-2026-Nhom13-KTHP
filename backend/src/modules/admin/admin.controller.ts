import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';
import { Public } from '../../common/decorators/auth.decorators';

@Controller()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Public()
  @Get('users/top-contributors')
  getTopContributors() {
    return this.adminService.getTopContributors();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/stats')
  getStats() {
    return this.adminService.getStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/users')
  createUser(
    @Body()
    body: {
      email: string;
      displayName: string;
      role: string;
      faculty?: string;
      password?: string;
    },
  ) {
    return this.adminService.createUser(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/users/:id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      email: string;
      displayName: string;
      role: string;
      faculty?: string;
      password?: string;
    },
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.adminService.updateUser(id, body, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/users/:id')
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.adminService.deleteUser(id, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/users/:id/lock')
  setLocked(
    @Param('id', ParseIntPipe) id: number,
    @Body('locked') locked: boolean,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.adminService.setLocked(id, locked, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/users/:id/password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('password') password: string,
  ) {
    return this.adminService.resetPassword(id, password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/moderation/queue')
  getQueue() {
    return this.adminService.getModerationQueue();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/moderation/resolve')
  resolve(
    @Body()
    body: {
      item: Record<string, string>;
      action: string;
      warnMessage?: string;
    },
  ) {
    return this.adminService.resolveModeration(
      body.item as {
        targetType: 'post' | 'comment';
        targetId: string;
        reportId?: string;
      },
      body.action as 'keep' | 'warn' | 'delete',
      body.warnMessage,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/banned-words')
  listBannedWords() {
    return this.adminService.listBannedWords();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/banned-words')
  addBannedWord(
    @Body() body: { word: string; action: 'pending' | 'hidden' },
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.adminService.addBannedWord(body.word, body.action, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/banned-words/:id')
  updateBannedWord(
    @Param('id', ParseIntPipe) id: number,
    @Body('action') action: 'pending' | 'hidden',
  ) {
    return this.adminService.updateBannedWord(id, action);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/banned-words/:id')
  removeBannedWord(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeBannedWord(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/posts')
  listPostsAdmin() {
    return this.adminService.listPostsAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/posts/:id')
  getPostAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getPostAdmin(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('admin/posts/:id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deletePost(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reports')
  createReport(
    @Body()
    body: { targetType: 'post' | 'comment'; targetId: number; reason: string },
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.adminService.createReport(
      body.targetType,
      body.targetId,
      user.id,
      body.reason,
    );
  }
}
