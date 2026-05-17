import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

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
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email hoặc Username đã tồn tại trong hệ thống.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password_hash: hashedPassword,
        full_name: dto.fullName || 'Thành viên mới', // Nếu không truyền tên thì set mặc định
      },
      select: {
        id: true,
        email: true,
        username: true,
        full_name: true,
        role: true,
        created_at: true,
      },
    });

    return newUser;
  }

  // ==============================
  // HÀM HỖ TRỢ TẠO TOKEN
  // ==============================
  async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'access_secret',
        expiresIn: '15m', // Access Token sống ngắn
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh_secret',
        expiresIn: '7d', // Refresh Token sống dài
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // ==============================
  // 2. ĐĂNG NHẬP (LOGIN)
  // ==============================
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Tài khoản không hợp lệ hoặc đã bị khóa.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) throw new UnauthorizedException('Thông tin đăng nhập không chính xác.');

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
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username,
        role: user.role, 
        fullName: user.full_name 
      },
      ...tokens,
    };
  }

  // ==============================
  // 3. LÀM MỚI TOKEN (REFRESH)
  // ==============================
  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh_secret',
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

      if (!isValid) throw new UnauthorizedException('Token không hợp lệ hoặc đã bị thu hồi.');

      // Xóa phiên (token) cũ đi (Xoay vòng Token - Tăng cường ATBMTT)
      await this.prisma.refreshToken.delete({ where: { id: currentTokenId } });

      // Lấy thông tin user để tạo token mới
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('Không tìm thấy người dùng.');

      const newTokens = await this.generateTokens(user.id, user.email, user.role);

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
      throw new UnauthorizedException('Phiên làm việc đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại.');
    }
  }
}