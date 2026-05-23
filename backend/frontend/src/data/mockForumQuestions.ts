import type { ForumRole, QuestionListItem } from '@/services/questions';

/** Dữ liệu mẫu đủ field để hiển thị cả danh sách và trang chi tiết. */
export interface MockQuestionFull extends QuestionListItem {
  body: string;
}

export const MOCK_QUESTIONS_FULL: MockQuestionFull[] = [
  {
    id: '1',
    title: 'Giải thích Big-O notation với ví dụ từ thuật toán sắp xếp',
    excerpt:
      'Mình đang học Cấu trúc dữ liệu và thấy khó phân biệt O(n log n) với O(n²). Có ai có ví dụ trực quan không ạ?',
    body:
      'Mình đang học Cấu trúc dữ liệu và thấy khó phân biệt O(n log n) với O(n²). Có ai có ví dụ trực quan không ạ?\n\n' +
      'Ví dụ mình đang so sánh merge sort với bubble sort. Cảm ơn mọi người!',
    tags: ['Cấu trúc dữ liệu', 'Khoa CNTT', 'Học phần RIPT'],
    author: 'Nguyễn Minh An',
    role: 'Sinh viên',
    date: '12/05/2026',
    votes: 24,
    answers: 5,
    views: 842,
  },
  {
    id: '2',
    title: 'REST vs GraphQL: khi nào nên chọn cho đồ án tốt nghiệp?',
    excerpt:
      'Nhóm em làm API cho hệ thống đặt phòng. Backend NestJS, mobile Flutter. Mong thầy cô góp ý hướng tiếp cận.',
    body:
      'Nhóm em làm API cho hệ thống đặt phòng. Backend NestJS, mobile Flutter.\n\n' +
      'Em đang phân vân REST thuần vs GraphQL cho mobile. Nhóm 4 người, deadline ~3 tháng. Mong thầy cô góp ý hướng tiếp cận.',
    tags: ['Phát triển Web', 'Đồ án', 'Backend'],
    author: 'Trần Hoàng Nam',
    role: 'Sinh viên',
    date: '11/05/2026',
    votes: 18,
    answers: 7,
    views: 1204,
  },
  {
    id: '3',
    title: 'Tài liệu tham khảo chuẩn hóa ERD cho hệ thống đa tenant',
    excerpt:
      'Mình cần mô hình tenant_id trên mọi bảng nghiệp vụ. Có pattern hoặc paper nào đáng đọc không?',
    body:
      'Mình cần mô hình tenant_id trên mọi bảng nghiệp vụ. Có pattern hoặc paper nào đáng đọc không?\n\n' +
      'Stack: PostgreSQL, ưu tiên row-level tenant. Cảm ơn.',
    tags: ['Cơ sở dữ liệu', 'Thiết kế hệ thống'],
    author: 'PGS. Lê Thu Hà',
    role: 'Giảng viên',
    date: '10/05/2026',
    votes: 42,
    answers: 12,
    views: 3102,
  },
  {
    id: '4',
    title: 'Lỗi CORS khi deploy frontend Netlify gọi API Nest local',
    excerpt:
      'Đã thêm origin vào enableCors nhưng vẫn bị chặn preflight. Checklist cần xem những gì?',
    body:
      'Đã thêm origin vào enableCors nhưng vẫn bị chặn preflight. Checklist cần xem những gì?\n\n' +
      'Frontend: Netlify. API: Nest, chạy local qua ngrok. Lỗi trên browser là blocked by CORS policy.',
    tags: ['Triển khai', 'Netlify', 'NestJS'],
    author: 'Phạm Gia Bảo',
    role: 'Sinh viên',
    date: '09/05/2026',
    votes: 9,
    answers: 4,
    views: 556,
  },
  {
    id: '5',
    title: 'Cách viết test E2E cho form đăng ký có OTP email (Playwright)',
    excerpt:
      'Team dùng mailhog trong CI. Muốn hỏi flow chờ email và assert mã OTP.',
    body:
      'Team dùng mailhog trong CI. Muốn hỏi flow chờ email và assert mã OTP.\n\n' +
      'Playwright + GitHub Actions. Có best practice nào để tránh flaky test không ạ?',
    tags: ['Kiểm thử', 'Playwright', 'CI/CD'],
    author: 'Hoàng Thị Mai',
    role: 'Sinh viên',
    date: '08/05/2026',
    votes: 15,
    answers: 3,
    views: 903,
  },
];

export const MOCK_QUESTIONS_FOR_LIST: QuestionListItem[] = MOCK_QUESTIONS_FULL.map(
  ({ body: _b, ...rest }) => rest,
);

export function getMockQuestionById(id: string): MockQuestionFull | undefined {
  return MOCK_QUESTIONS_FULL.find((q) => q.id === id);
}
