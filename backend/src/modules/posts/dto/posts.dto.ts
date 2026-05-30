import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// 1. Lọc Query Params cho API Lấy danh sách bài
export const ListPostsQuerySchema = z.object({
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1).default(1)),
  pageSize: z.preprocess((val) => Number(val) || 10, z.number().min(1).max(50).default(10)),
  search: z.string().optional(),
  tag: z.string().optional(),
  difficulty: z.enum(['beginner', 'medium', 'hard', 'expert']).optional(),
  sort: z.enum(['newest', 'active', 'unanswered', 'rating', 'bounty']).optional(),
  authorId: z.preprocess((val) => (val ? Number(val) : undefined), z.number().optional()),
  includeNonPublic: z.preprocess((val) => val === 'true', z.boolean().optional()),
});
export class ListPostsQueryDto extends createZodDto(ListPostsQuerySchema) {}

// 2. Body tạo bài viết mới
export const CreatePostSchema = z.object({
  title: z.string().min(5, 'Tiêu đề bài viết phải từ 5 ký tự'),
  body: z.string().min(10, 'Nội dung bài viết quá ngắn'),
  tags: z.array(z.string()).min(1, 'Phải có ít nhất 1 tag').max(5, 'Chỉ được tối đa 5 tag'),
  difficulty: z.enum(['beginner', 'medium', 'hard', 'expert']).optional(),
  bounty: z.number().min(0, 'Điểm thưởng không được âm').optional(),
});
export class CreatePostDto extends createZodDto(CreatePostSchema) {}

// 3. Body sửa bài (Cho phép bỏ trống các trường)
export const UpdatePostSchema = CreatePostSchema.partial();
export class UpdatePostDto extends createZodDto(UpdatePostSchema) {}

// 4. Body đánh giá sao
export const RatePostSchema = z.object({
  stars: z.number().min(1, 'Đánh giá thấp nhất là 1 sao').max(5, 'Đánh giá cao nhất là 5 sao'),
});
export class RatePostDto extends createZodDto(RatePostSchema) {}

// 5. Body chọn câu trả lời đúng
export const AcceptAnswerSchema = z.object({
  commentId: z.number({ message: 'ID bình luận không được để trống' }).min(1, 'ID bình luận không hợp lệ'),
});
export class AcceptAnswerDto extends createZodDto(AcceptAnswerSchema) {}