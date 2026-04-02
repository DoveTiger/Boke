import { Injectable } from '@nestjs/common';
import { IndexService } from '../index/index.service';
import { TagPostItem, TagPostResponse, TagSummary } from '../index/index.types';

export type { TagPostItem, TagPostResponse, TagSummary };

@Injectable()
export class TagsService {
  constructor(private readonly indexService: IndexService) {}

  async getTagSummaries(): Promise<TagSummary[]> {
    return this.indexService.listTags();
  }

  async getPostsByTag(tagSlug: string, page = 1, size = 10, query?: string): Promise<TagPostResponse> {
    return this.indexService.listPostsByTag(tagSlug, page, size, query);
  }
}
