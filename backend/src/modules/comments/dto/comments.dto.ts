import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCommentSchema = z.object({
  postId: z.number({ message: 'ID bài viết không được để trống' }),
  body: z.string().min(1, 'Nội dung bình luận không được để trống'),
  parentId: z.number().nullable().optional(),
});
export class CreateCommentDto extends createZodDto(CreateCommentSchema) {}

export const UpdateCommentSchema = z.object({
  body: z.string().min(1, 'Nội dung bình luận không được để trống'),
});
export class UpdateCommentDto extends createZodDto(UpdateCommentSchema) {}