import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateCommentSchema = z.object({
    post_id: z
        .number({ message: 'post_id bắt buộc phải là một số' })
        .int('post_id phải là số nguyên')
        .positive('post_id phải là số dương')
        .describe('ID của bài viết'), // Thay thế hoàn toàn cho @ApiProperty(description)

    author_id: z
        .number({ message: 'author_id bắt buộc phải là một số' })
        .int('author_id phải là số nguyên')
        .positive('author_id phải là số dương')
        .describe('ID của tác giả bình luận'),
        
    parent_id: z
        .number({ message: 'parent_id phải là một số' })
        .int('parent_id phải là số nguyên')
        .positive('parent_id phải là số dương')
        .optional()
        .nullable()
        .describe('ID bình luận cha (null hoặc bỏ trống nếu là comment gốc)'),

    content: z
        .string({ message: 'Nội dung bình luận không hợp lệ' })
        .trim()
        .min(1, 'Nội dung bình luận không được để trống')
        .max(3000, 'Bình luận tối đa 3000 ký tự')
        .describe('Nội dung bình luận'),
});

// ✨ PHÉP THUẬT NẰM Ở ĐÂY: 1 DÒNG TỰ SINH CLASS + TỰ GEN SWAGGER
export class CreateCommentDto extends createZodDto(CreateCommentSchema) { }
