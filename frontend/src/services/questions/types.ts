/**
 * Kiểu dữ liệu domain câu hỏi — giữ đồng bộ với payload/response API backend khi nối dây.
 */

export type ForumRole = 'Sinh viên' | 'Giảng viên';

export interface QuestionListItem {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  author: string;
  role: ForumRole;
  date: string;
  votes: number;
  answers: number;
  views: number;
}

/** Body gửi lên API POST (ví dụ POST /questions). */
export interface CreateQuestionPayload {
  title: string;
  body: string;
  tags: string[];
}

/** Response tối thiểu sau khi tạo — backend có thể bổ sung field khác. */
export interface CreateQuestionResult {
  id: string;
}

export interface QuestionService {
  createQuestion(payload: CreateQuestionPayload): Promise<CreateQuestionResult>;
}
