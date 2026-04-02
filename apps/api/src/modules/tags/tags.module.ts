import { Module } from '@nestjs/common';
import { IndexModule } from '../index/index.module';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [IndexModule],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
