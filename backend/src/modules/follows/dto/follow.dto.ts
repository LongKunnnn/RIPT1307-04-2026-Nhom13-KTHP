import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FollowSchema = z.object({
  targetUserId: z.coerce.number().int({ message: 'ID người dùng phải là số nguyên' })
    .describe('ID của người mà bạn muốn theo dõi / bỏ theo dõi'),
});

export class FollowDto extends createZodDto(FollowSchema) {}