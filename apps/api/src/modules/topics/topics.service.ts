import { Injectable } from '@nestjs/common';
import { IndexService } from '../index/index.service';
import { TopicPostItem, TopicPostResponse, TopicSummary } from '../index/index.types';

export type { TopicPostItem, TopicPostResponse, TopicSummary };

@Injectable()
export class TopicsService {
  constructor(private readonly indexService: IndexService) {}

  async getTopicSummaries(): Promise<TopicSummary[]> {
    return this.indexService.listTopics();
  }

  async getPostsByTopic(topicSlug: string, page = 1, size = 10): Promise<TopicPostResponse> {
    return this.indexService.listPostsByTopic(topicSlug, page, size);
  }
}
