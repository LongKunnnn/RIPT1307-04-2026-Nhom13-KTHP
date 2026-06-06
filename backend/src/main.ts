import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  // 1. Bảo mật HTTP headers
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    app.use(helmet());
  } else {
    app.use(helmet({ contentSecurityPolicy: false }));
  }

  // 2. [QUAN TRỌNG] Đặt tiền tố 'api' cho mọi endpoint (để khớp với Frontend)
  app.setGlobalPrefix('api');

  // 3. Cấu hình Swagger (Chỉ bật ở Dev)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Student Q&A Forum API')
      .setDescription('Tài liệu API Backend cho Đồ án LTW')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, documentFactory);
  }

  // 4. Xử lý CORS (Lấy logic Regex siêu đỉnh của FE)
  // Gắn sẵn cả 8000 (Umi) và 5173 (Vite) làm fallback cho chắc cốp
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:8000, http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Thêm domain production vào danh sách cho phép
  allowedOrigins.push('https://unihub-ript.netlify.app');

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Cho phép đính kèm Cookie/Token
  });

  // 5. Validation dữ liệu đầu vào bằng Zod
  app.useGlobalPipes(new ZodValidationPipe());

  // 6. Xử lý lỗi tập trung
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 7. Khởi động Server
  await app.listen(port);

  console.log(`==================================================`);
  console.log(`🛡️ [Security] Helmet & CORS      : Đã bật`);
  console.log(`🌐 [CORS] Cho phép truy cập từ : ${allowedOrigins.join(', ')} + localhost:*`);
  console.log(`🚀 [Core] Server đang lắng nghe tại: http://localhost:${port}/api`);
  console.log(`📚 [Docs] Swagger UI nằm tại     : http://localhost:${port}/api/docs`);
  console.log(`==================================================`);
}
bootstrap();