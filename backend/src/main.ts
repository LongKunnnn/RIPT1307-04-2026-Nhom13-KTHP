import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  app.use(helmet());

  //Kích hoạt CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Cho phép đính kèm cookie nếu có
  });

  // Validation dữ liệu đầu vào (Zod)
  app.useGlobalPipes(new ZodValidationPipe());

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(port);
  
  console.log(`==================================================`);
  console.log(`🛡️ [Security] Helmet & Rate Limiter : Đã bật`);
  console.log(`🌐 [CORS] Cho phép truy cập từ     : ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🚀 [Core] Server đang lắng nghe tại: http://localhost:${port}`);
  console.log(`==================================================`);
}
bootstrap();