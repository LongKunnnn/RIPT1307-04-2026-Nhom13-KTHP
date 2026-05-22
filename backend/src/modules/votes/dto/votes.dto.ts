import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const VoteSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.coerce.number().int(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export class VoteDto extends createZodDto(VoteSchema) {}
