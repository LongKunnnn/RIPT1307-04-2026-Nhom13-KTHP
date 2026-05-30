import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetLeaderboardSchema = z.object({
  scope: z.enum(['global', 'tag']).optional().default('global'),
  tag: z.string().optional(),
  limit: z.preprocess((val) => Number(val) || 8, z.number().min(1).max(50).default(8)),
});

export class GetLeaderboardDto extends createZodDto(GetLeaderboardSchema) {}