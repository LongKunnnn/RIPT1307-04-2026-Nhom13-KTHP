import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Query
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';
import { 
  CreateUserDto, UpdateUserDto, ResolveModerationDto, 
  CreateReportDto, BannedWordDto 
} from './dto/admin.dto';

@ApiTags('Admin (Quản trị & Kiểm duyệt)')
@Controller() // Giữ nguyên để khớp route lộn xộn của FE
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==========================================
  // PUBLIC & USER ROUTES (Nằm nhầm chỗ nhưng tạm giữ)
  // ==========================================
  
  @Public()
  @Get('users/top-contributors')
  @ApiOperation({ summary: 'Lấy top người dùng đóng góp (Nên chuyển sang Leaderboard)' })
  getTopContributors() {
    return this.adminService.getTopContributors();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('reports')
  @ApiOperation({ summary: 'Gửi báo cáo vi phạm (Dành cho mọi user)' })
  createReport(@Body() dto: CreateReportDto, @CurrentUser() user: AuthUserPayload) {
    return this.adminService.createReport(dto.targetType, dto.targetId, user.id, dto.reason);
  }

  // ==========================================
  // ADMIN ROUTES (Chỉ Admin mới được vào)
  // ==========================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Get('admin/stats')
  @ApiOperation({ summary: 'Lấy thống kê tổng quan' })
  getStats() {
    return this.adminService.getStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Get('admin/users')
  @ApiOperation({ summary: 'Lấy danh sách người dùng (Cần thêm phân trang sau này)' })
  listUsers() {
    // TODO: Bổ sung Query page, limit truyền xuống Service
    return this.adminService.listUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Post('admin/users')
  @ApiOperation({ summary: 'Tạo tài khoản mới từ Admin' })
  createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Patch('admin/users/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.adminService.updateUser(id, dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Delete('admin/users/:id')
  @ApiOperation({ summary: 'Xóa người dùng' })
  deleteUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUserPayload) {
    return this.adminService.deleteUser(id, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Patch('admin/users/:id/lock')
  @ApiOperation({ summary: 'Khóa / Mở khóa tài khoản' })
  setLocked(
    @Param('id', ParseIntPipe) id: number,
    @Body('locked') locked: boolean,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.adminService.setLocked(id, locked, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Patch('admin/users/:id/password')
  @ApiOperation({ summary: 'Reset mật khẩu người dùng' })
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body('password') password: string) {
    return this.adminService.resetPassword(id, password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Get('admin/moderation/queue')
  @ApiOperation({ summary: 'Lấy hàng đợi kiểm duyệt (Report)' })
  getQueue() {
    return this.adminService.getModerationQueue();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Post('admin/moderation/resolve')
  @ApiOperation({ summary: 'Xử lý báo cáo vi phạm' })
  resolve(@Body() dto: ResolveModerationDto) {
    return this.adminService.resolveModeration(dto.item, dto.action, dto.warnMessage);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Get('admin/banned-words')
  @ApiOperation({ summary: 'Danh sách từ khóa cấm' })
  listBannedWords() {
    return this.adminService.listBannedWords();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Post('admin/banned-words')
  @ApiOperation({ summary: 'Thêm từ khóa cấm' })
  addBannedWord(@Body() dto: BannedWordDto, @CurrentUser() user: AuthUserPayload) {
    return this.adminService.addBannedWord(dto.word, dto.action, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Patch('admin/banned-words/:id')
  @ApiOperation({ summary: 'Cập nhật trạng thái từ khóa cấm' })
  updateBannedWord(@Param('id', ParseIntPipe) id: number, @Body('action') action: 'pending' | 'hidden') {
    return this.adminService.updateBannedWord(id, action);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Delete('admin/banned-words/:id')
  @ApiOperation({ summary: 'Xóa từ khóa cấm' })
  removeBannedWord(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.removeBannedWord(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Get('admin/posts')
  @ApiOperation({ summary: 'Lấy danh sách tất cả bài viết (Admin)' })
  listPostsAdmin() {
    return this.adminService.listPostsAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Get('admin/posts/:id')
  @ApiOperation({ summary: 'Lấy chi tiết bài viết (Admin)' })
  getPostAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getPostAdmin(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Delete('admin/posts/:id')
  @ApiOperation({ summary: 'Xóa bài viết (Bởi Admin)' })
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deletePost(id);
  }
}