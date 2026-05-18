import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email('Định dạng email không hợp lệ'),
  username: z
    .string()
    .min(3, 'Username tối thiểu 3 ký tự')
    .max(100, 'Username tối đa 100 ký tự')
    .optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  fullName: z.string().max(150, 'Họ tên tối đa 150 ký tự').optional(),
  birthday: z.string().optional(), // YYYY-MM-DD
  role: z.enum(['STUDENT', 'LECTURER', 'student', 'teacher']).optional(),
  faculty: z.string().max(150).optional(),
});

const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(100).optional(),
  fullName: z.string().max(150).optional(),
  birthday: z.string().optional(),
  bio: z.string().max(1000).optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  faculty: z.string().max(150).optional(),
  avatarUrl: z.string().url().optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Định dạng email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
