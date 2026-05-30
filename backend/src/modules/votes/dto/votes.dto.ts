import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const VoteSchema = z.object({
  targetType: z.enum(['post', 'comment'], { message: 'Loại mục tiêu chỉ được là post hoặc comment' }),
  targetId: z.number({ message: 'ID mục tiêu phải là số' }),
  value: z.union([z.literal(1), z.literal(-1)], { message: 'Giá trị vote chỉ được là 1 (upvote) hoặc -1 (downvote)' }),
});

export class VoteDto extends createZodDto(VoteSchema) {}