import { Injectable } from '@nestjs/common';
import { IndexService } from '../index/index.service';
import { SearchItem, SearchResult } from '../index/index.types';

export type { SearchItem, SearchResult };

@Injectable()
export class SearchService {
  constructor(private readonly indexService: IndexService) {}

  async search(rawQuery: string, page = 1, size = 10): Promise<SearchResult> {
    return this.indexService.search(rawQuery, page, size);
  }
}
