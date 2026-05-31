import { Module } from '@nestjs/common';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';
import { PrismaService } from '../prisma/prisma.service';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PostsModule], 
  controllers: [FollowsController],
  providers: [FollowsService, PrismaService], 
  exports: [FollowsService], 
})
export class FollowsModule {}