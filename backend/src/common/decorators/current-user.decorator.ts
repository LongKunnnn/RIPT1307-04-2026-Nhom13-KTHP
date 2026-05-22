import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUserPayload } from '../utils/helpers';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user ?? null;
  },
);
