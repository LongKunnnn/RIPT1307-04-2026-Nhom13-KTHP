import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    app.use(helmet()); 
  } else {
    app.use(helmet({ contentSecurityPolicy: false })); 
  }
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

  //Kích hoạt CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, 
  });

  // Validation dữ liệu đầu vào (Zod)
  app.useGlobalPipes(new ZodValidationPipe());

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`==================================================`);
  console.log(`🛡️ [Security] Helmet & Rate Limiter : Đã bật`);
  console.log(`🌐 [CORS] Cho phép truy cập từ     : ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🚀 [Core] Server đang lắng nghe tại: http://localhost:${port}`);
  console.log(`==================================================`);
}
bootstrap();