import { createZodDto } from 'nestjs-zod';
import { CreateCommentSchema } from './create-comment.dto';

export const UpdateCommentSchema = CreateCommentSchema.pick({ content: true });

export class UpdateCommentDto extends createZodDto(UpdateCommentSchema) {}