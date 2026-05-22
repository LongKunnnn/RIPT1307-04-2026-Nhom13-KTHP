import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateCommentSchema = z.object({
  body: z.string().min(1),
  parentId: z.coerce.number().int().nullable().optional(),
});

export class CreateCommentDto extends createZodDto(CreateCommentSchema) {}
