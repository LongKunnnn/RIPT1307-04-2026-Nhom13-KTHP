# 🚀 Diễn đàn Hỏi đáp Sinh viên (Forum Q&A) - Backend Service

Hệ thống Backend cung cấp nền tảng học thuật dạng Q&A dành cho sinh viên và giảng viên trao đổi kiến thức, thảo luận chuyên sâu tương tự mô hình StackOverflow.

## 🛠 Công nghệ & Kiến trúc

- **Framework:** [NestJS](https://nestjs.com/) (TypeScript)
- **Cơ sở dữ liệu:** MySQL (Quản lý dữ liệu quan hệ)
- **ORM:** [Prisma ORM](https://www.prisma.io/)
- **Xác thực & Bảo mật:** JWT Access Token (`@nestjs/passport`), Mã hóa mật khẩu bằng `bcrypt`, Phân quyền Role-based (STUDENT, TEACHER, ADMIN)
- **Xác thực dữ liệu (Validation):** [Zod](https://zod.dev/) thông qua `nestjs-zod`

---

## 📦 Cấu trúc Thư mục

Dự án được xây dựng theo mô hình **Feature-based Modular** (chia theo từng cụm tính năng độc lập):

```text
backend/
├── prisma/                  # Quản lý DB Schema & Migrations
├── src/
│   ├── common/              # Tiện ích dùng chung (Constants, Decorators, Filters, Guards, Interceptors)
│   ├── modules/             # Các module nghiệp vụ độc lập (Auth, Users, Posts, Tags, Comments, Votes...)
│   ├── prisma/              # Global Prisma Service
│   ├── app.module.ts        # Module gốc root
│   └── main.ts              # Entry point (Cấu hình CORS, Global Pipes/Filters)
└── ...