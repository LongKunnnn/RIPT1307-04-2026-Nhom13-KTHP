import { Prisma, UserRole, User } from '@prisma/client';
import { toBackendRole, toFrontendRole } from '../../common/utils/helpers';
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ==============================
  // 1. ĐĂNG KÝ (REGISTER)
  // ==============================
  async register(dto: RegisterDto) {
    const username = dto.username ?? dto.email.split('@')[0].slice(0, 100);
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Email hoặc Username đã tồn tại trong hệ thống.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.role
      ? (toBackendRole(dto.role) as UserRole)
      : UserRole.student;

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        username,
        password_hash: hashedPassword,
        full_name: dto.fullName || 'Thành viên mới',
        birthday: dto.birthday ? new Date(dto.birthday) : null,
        role,
        faculty: dto.faculty,
      },
    });

    const tokens = await this.generateTokens(
      newUser.id,
      newUser.email,
      newUser.role,
    );
    const tokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        user_id: newUser.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: this.mapUser(newUser),
      ...tokens,
    };
  }

  mapUser(user: User) {
    return {
      id: String(user.id),
      email: user.email,
      username: user.username,
      displayName: user.full_name,
      role: toFrontendRole(user.role),
      faculty: user.faculty ?? undefined,
      locked: user.is_active === false,
      rewardPoints: user.reward_points ?? 0,
      createdAt: user.created_at?.toISOString() ?? new Date().toISOString(),
      birthday: user.birthday?.toISOString() ?? undefined,
      bio: user.bio ?? undefined,
      socialLinks: (user.social_links as Record<string, string>) ?? undefined,
      avatarUrl: user.avatar_url ?? undefined,
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Không tìm thấy người dùng.');
    return this.mapUser(user);
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    return this.mapUser(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: { username: dto.username, id: { not: userId } },
      });
      if (existing) throw new BadRequestException('Username đã được sử dụng.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        full_name: dto.fullName,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        bio: dto.bio,
        social_links: dto.socialLinks as Prisma.JsonObject,
        faculty: dto.faculty,
        avatar_url: dto.avatarUrl,
      },
    });

    return this.mapUser(updated);
  }

  // ==============================
  // HÀM HỖ TRỢ TẠO TOKEN
  // ==============================
  async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ||
          'access_secret',
        expiresIn: '15m', // Access Token sống ngắn
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'refresh_secret',
        expiresIn: '7d', // Refresh Token sống dài
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ==============================
  // 2. ĐĂNG NHẬP (LOGIN)
  // ==============================
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException(
        'Tài khoản không hợp lệ hoặc đã bị khóa.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác.');

    // Tạo cặp token mới
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Lưu Hash của Refresh Token vào DB để quản lý phiên
    const salt = await bcrypt.genSalt(10);
    const tokenHash = await bcrypt.hash(tokens.refreshToken, salt);

    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày sau
      },
    });

    return {
      user: this.mapUser(user),
      ...tokens,
    };
  }

  // ==============================
  // 3. QUÊN MẬT KHẨU (FORGOT PASSWORD)
  // ==============================
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Vì lý do bảo mật, không báo lỗi nếu email không tồn tại
      return {
        message:
          'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        reset_password_token: resetTokenHash,
        reset_password_expires: new Date(Date.now() + 3600000), // 1 giờ sau
      },
    });

    // MÔ PHỎNG GỬI EMAIL: Log token ra console
    console.log(
      `[FORGOT PASSWORD] Reset Token for ${dto.email}: ${resetToken}`,
    );

    return {
      message:
        'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
      // Demo purposes only: return token in response if in development
      resetToken:
        this.configService.get('NODE_ENV') === 'development'
          ? resetToken
          : undefined,
    };
  }

  // ==============================
  // 4. ĐẶT LẠI MẬT KHẨU (RESET PASSWORD)
  // ==============================
  async resetPassword(dto: ResetPasswordDto) {
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        reset_password_token: resetTokenHash,
        reset_password_expires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn.');
    }

    // KIỂM TRA MẬT KHẨU MỚI KHÔNG TRÙNG MẬT KHẨU CŨ
    const isSamePassword = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu hiện tại.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
      },
    });

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  // ==============================
  // 5. LÀM MỚI TOKEN (REFRESH)
  // ==============================
  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'refresh_secret',
      });

      // Tìm các token đang active của user này trong DB
      const storedTokens = await this.prisma.refreshToken.findMany({
        where: { user_id: payload.sub, revoked_at: null },
      });

      // Kiểm tra token gửi lên có khớp với mã băm nào trong DB không
      let isValid = false;
      let currentTokenId = 0;
      for (const t of storedTokens) {
        if (await bcrypt.compare(refreshToken, t.token_hash)) {
          isValid = true;
          currentTokenId = t.id;
          break;
        }
      }

      if (!isValid)
        throw new UnauthorizedException(
          'Token không hợp lệ hoặc đã bị thu hồi.',
        );

      // Xóa phiên (token) cũ đi (Xoay vòng Token - Tăng cường ATBMTT)
      await this.prisma.refreshToken.delete({ where: { id: currentTokenId } });

      // Lấy thông tin user để tạo token mới
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException('Không tìm thấy người dùng.');

      const newTokens = await this.generateTokens(
        user.id,
        user.email,
        user.role,
      );

      // Lưu lại mã băm của Refresh Token mới
      const tokenHash = await bcrypt.hash(newTokens.refreshToken, 10);
      await this.prisma.refreshToken.create({
        data: {
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return newTokens;
    } catch (e) {
      throw new UnauthorizedException(
        'Phiên làm việc đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại.',
      );
    }
  }
}
