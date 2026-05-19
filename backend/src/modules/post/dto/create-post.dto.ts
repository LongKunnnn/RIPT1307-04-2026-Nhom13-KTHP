import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.string().min(5, 'Tiêu đề bài viết phải có ít nhất 5 ký tự').max(255),
  content: z.string().min(10, 'Nội dung bài viết phải có ít nhất 10 ký tự'),
  excerpt: z.string().max(500).optional(),
  tags: z.array(z.string()).optional().default([]), 
});

export class CreatePostDto extends createZodDto(CreatePostSchema) {}