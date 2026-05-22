import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PostsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
