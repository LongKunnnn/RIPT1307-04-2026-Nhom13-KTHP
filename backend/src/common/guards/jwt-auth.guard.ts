import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<T>(err: any, user: T, info: any): T {
    if (err || !user) {
      throw err || new UnauthorizedException('Bạn cần đăng nhập để thực hiện chức năng này!');
    }
    return user;
  }
}

// 🛡️ GUARD BỔ SUNG CỦA FE: Dành cho các route cho phép cả Guest và User truy cập
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    
    // Nếu Client không gửi token lên -> Cho qua luôn (truy cập với tư cách Khách)
    if (!request.headers.authorization) {
      return true;
    }
    
    return super.canActivate(context);
  }

  handleRequest<T>(_err: any, user: T): T | null {
    return user ?? null;
  }
}