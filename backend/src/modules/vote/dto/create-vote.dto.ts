import { createZodDto } from 'nestjs-zod';
import { z } from 'zod'; 

export const VoteSchema = z.object({
  targetType: z.enum(['post', 'comment'], {
    error: 'targetType bắt buộc phải là "post" hoặc "comment"',
  }).describe('Đối tượng muốn vote: truyền vào "post" hoặc "comment"'),

  targetId: z.coerce.number().int({
    message: 'targetId phải là số nguyên',
  }).describe('ID của bài viết hoặc bình luận tương ứng'),

  value: z.number().refine((val) => val === 1 || val === -1, {
    message: 'Value chỉ được phép là 1 (Upvote) hoặc -1 (Downvote)',
  }).describe('Truyền 1 để Upvote, -1 để Downvote'),
});

export class VoteDto extends createZodDto(VoteSchema) {}