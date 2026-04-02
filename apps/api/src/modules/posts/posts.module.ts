import { Module } from '@nestjs/common';
import { IndexModule } from '../index/index.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [IndexModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
