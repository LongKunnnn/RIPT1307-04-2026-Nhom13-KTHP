import { Module, forwardRef } from '@nestjs/common'; 
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaModule } from '../prisma/prisma.module'; 
import { NotificationsModule } from '../notifications/notifications.module'; 

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => NotificationsModule), 
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}