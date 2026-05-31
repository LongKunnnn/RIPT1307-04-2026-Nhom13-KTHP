import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetFollowsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20), // Max 50 để chống bị FE chọc thủng
});

export class GetFollowsDto extends createZodDto(GetFollowsSchema) {}