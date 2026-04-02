import { Module } from '@nestjs/common';
import { ContentModule } from '../content/content.module';
import { IndexCacheService } from './index-cache.service';
import { IndexService } from './index.service';
import { MemoryIndexRepository } from './memory-index.repository';
import { PostgresIndexRepository } from './postgres-index.repository';

@Module({
  imports: [ContentModule],
  providers: [IndexCacheService, MemoryIndexRepository, PostgresIndexRepository, IndexService],
  exports: [IndexService],
})
export class IndexModule {}
