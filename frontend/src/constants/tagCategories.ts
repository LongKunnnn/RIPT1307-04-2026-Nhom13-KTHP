/** Gợi ý thẻ theo môn / lớp / khoa / lĩnh vực (đồ án yêu cầu). */
export const TAG_CATEGORIES = {
  subject: ['Cấu trúc dữ liệu', 'Phát triển Web', 'Cơ sở dữ liệu', 'RIPT'],
  class: ['Lớp D21', 'Lớp D22', 'Lớp QTKD01'],
  faculty: ['Khoa CNTT', 'Khoa Điện', 'Khoa QTKD'],
  field: ['Backend', 'Frontend', 'DevOps', 'Đồ án', 'Kiểm thử'],
} as const;

export const ALL_TAG_SUGGESTIONS = [
  ...TAG_CATEGORIES.subject,
  ...TAG_CATEGORIES.class,
  ...TAG_CATEGORIES.faculty,
  ...TAG_CATEGORIES.field,
];
