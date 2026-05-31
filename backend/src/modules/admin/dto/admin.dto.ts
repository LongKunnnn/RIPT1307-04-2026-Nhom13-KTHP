import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  displayName: z.string().min(1, 'Tên không được để trống'),
  role: z.enum(['admin', 'teacher', 'student']),
  faculty: z.string().optional(),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự').optional(),
});
export class CreateUserDto extends createZodDto(CreateUserSchema) {}

export const UpdateUserSchema = CreateUserSchema.partial();
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

export const ResolveModerationSchema = z.object({
  item: z.object({
    targetType: z.enum(['post', 'comment']),
    targetId: z.string().or(z.number()),
    reportId: z.string().or(z.number()).optional(),
  }),
  action: z.enum(['keep', 'warn', 'delete']),
  warnMessage: z.string().optional(),
});
export class ResolveModerationDto extends createZodDto(ResolveModerationSchema) {}

export const CreateReportSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.number(),
  reason: z.string().min(10, 'Lý do báo cáo phải chi tiết hơn (ít nhất 10 ký tự)'),
});
export class CreateReportDto extends createZodDto(CreateReportSchema) {}

export const BannedWordSchema = z.object({
  word: z.string().min(1, 'Từ cấm không được để trống'),
  action: z.enum(['pending', 'hidden']),
});
export class BannedWordDto extends createZodDto(BannedWordSchema) {}