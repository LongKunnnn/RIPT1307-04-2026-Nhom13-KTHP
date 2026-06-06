import { Module, forwardRef } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule, 
    forwardRef(() => NotificationsModule) // Dùng để tránh lỗi Circular Dependency
  ],
  controllers: [VotesController],
  providers: [VotesService],
  exports: [VotesService], 
})
export class VotesModule {}