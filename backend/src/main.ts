import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  app.use(helmet());

  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:8000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  // Validation dữ liệu đầu vào (Zod)
  app.useGlobalPipes(new ZodValidationPipe());

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix('api');

  await app.listen(port);
  
  console.log(`==================================================`);
  console.log(`🛡️ [Security] Helmet & Rate Limiter : Đã bật`);
  console.log(`🌐 [CORS] Cho phép truy cập từ     : ${allowedOrigins.join(', ')} + localhost:*`);
  console.log(`🚀 [Core] Server đang lắng nghe tại: http://localhost:${port}`);
  console.log(`==================================================`);
}
bootstrap();