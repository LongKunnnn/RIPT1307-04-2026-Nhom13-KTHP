import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Rút trích thông báo lỗi.
    const message = isHttpException
      ? exception.getResponse()
      : 'Lỗi hệ thống nội bộ, vui lòng thử lại sau.';

    // Ghi log chi tiết xuống terminal
    console.log('========================================');
    console.log('🔴 Error at:', request.method, request.url);
    console.log('📥 Request Body:', request.body);
    console.log('📥 Request Headers:', request.headers);
    console.log('❌ Exception:', exception);
    if (exception instanceof Error) console.log('❌ Stack:', exception.stack);
    console.log('========================================');

    // Format dữ liệu trả về cho Frontend
    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    });
  }
}
