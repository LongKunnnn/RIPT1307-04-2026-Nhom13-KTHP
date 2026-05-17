import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email('Định dạng email không hợp lệ'),
  username: z.string().min(3, 'Username tối thiểu 3 ký tự').max(100, 'Username tối đa 100 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  fullName: z.string().max(150, 'Họ tên tối đa 150 ký tự').optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Định dạng email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}