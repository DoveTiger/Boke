import { Injectable, NotFoundException } from '@nestjs/common';
import { IndexService } from '../index/index.service';
import { PostDetail, PostListResponse, PostRelationsResponse } from '../index/index.types';

@Injectable()
export class PostsService {
  constructor(private readonly indexService: IndexService) {}

  async listPosts(page = 1, size = 10): Promise<PostListResponse> {
    return this.indexService.listPosts(page, size);
  }

  async getPostBySlug(slug: string): Promise<PostDetail> {
    const post = await this.indexService.getPostBySlug(slug);
    if (!post) {
      throw new NotFoundException(`Post not found: ${slug}`);
    }

    return post;
  }

  async getPostRelations(slug: string): Promise<PostRelationsResponse> {
    const relations = await this.indexService.getPostRelations(slug, 3);
    if (!relations) {
      throw new NotFoundException(`Post not found: ${slug}`);
    }

    return relations;
  }
}
