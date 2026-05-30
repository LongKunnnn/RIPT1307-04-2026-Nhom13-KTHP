import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// Tạo ra decorator @Public() để gắn vào các API mở
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);