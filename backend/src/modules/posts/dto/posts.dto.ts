import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ListPostsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(['newest', 'active', 'bounty', 'unanswered', 'rating']).optional().default('newest'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  authorId: z.coerce.number().int().optional(),
  includeNonPublic: z.coerce.boolean().optional(),
});

const CreatePostSchema = z.object({
  title: z.string().min(5).max(255),
  body: z.string().min(10),
  tags: z.array(z.string().min(1)).max(10).default([]),
  bounty: z.coerce.number().int().min(0).max(10000).optional().default(0),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
});

const RatePostSchema = z.object({
  stars: z.coerce.number().int().min(1).max(5),
});

const AcceptAnswerSchema = z.object({
  commentId: z.coerce.number().int().positive(),
});

const UpdateModerationSchema = z.object({
  status: z.enum(['published', 'pending', 'hidden']),
  note: z.string().optional(),
});

const UpdatePostSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  body: z.string().min(10).optional(),
  tags: z.array(z.string().min(1)).max(10).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

export class ListPostsQueryDto extends createZodDto(ListPostsSchema) {}
export class CreatePostDto extends createZodDto(CreatePostSchema) {}
export class UpdatePostDto extends createZodDto(UpdatePostSchema) {}
export class UpdateModerationDto extends createZodDto(UpdateModerationSchema) {}
export class RatePostDto extends createZodDto(RatePostSchema) {}
export class AcceptAnswerDto extends createZodDto(AcceptAnswerSchema) {}
