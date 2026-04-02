import { Module } from '@nestjs/common';
import { IndexModule } from '../index/index.module';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

@Module({
  imports: [IndexModule],
  controllers: [TopicsController],
  providers: [TopicsService],
})
export class TopicsModule {}
