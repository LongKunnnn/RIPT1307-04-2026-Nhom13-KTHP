import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { toFrontendRole } from '../../common/utils/helpers';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) throw new BadRequestException('Thiếu Refresh Token');
    return this.authService.refresh(refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUserPayload) {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/search')
  searchUsers(
    @Query('q') q: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.authService.searchUsersGlobal(q, user.id).then((rows) =>
      rows.map((u) => ({
        id: String(u.id),
        username: u.username,
        fullName: u.full_name,
        avatarUrl: u.avatar_url ?? undefined,
        role: toFrontendRole(u.role),
        faculty: u.faculty ?? undefined,
        bio: u.bio ?? undefined,
      })),
    );
  }

  @Public()
  @Get('users/:username/posts')
  getUserPosts(
    @Param('username') username: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    return this.authService.getPublicPostsByUsername(
      username,
      parseInt(page, 10) || 1,
      parseInt(pageSize, 10) || 10,
    );
  }

  @Public()
  @Get('users/:username')
  getPublicProfile(@Param('username') username: string) {
    return this.authService.getPublicProfile(username);
  }
}