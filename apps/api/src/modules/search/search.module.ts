import { Module } from '@nestjs/common';
import { IndexModule } from '../index/index.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [IndexModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
