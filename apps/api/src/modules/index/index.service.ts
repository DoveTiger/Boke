import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizeToSlug } from '../../common/utils/slug.util';
import { ContentService } from '../content/content.service';
import {
  PostDetail,
  PostRelationsResponse,
  PostListResponse,
  PostSummary,
  SearchResult,
  TagPostResponse,
  TagSummary,
  TopicPostResponse,
  TopicSummary,
} from './index.types';
import { IndexCacheService } from './index-cache.service';
import { MemoryIndexRepository } from './memory-index.repository';
import { PostgresIndexRepository } from './postgres-index.repository';

type BackendDriver = 'memory' | 'postgres';

@Injectable()
export class IndexService implements OnModuleInit {
  private readonly logger = new Logger(IndexService.name);
  private backend: BackendDriver = 'memory';
  private cacheVersion = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly contentService: ContentService,
    private readonly memoryRepository: MemoryIndexRepository,
    private readonly postgresRepository: PostgresIndexRepository,
    private readonly cacheService: IndexCacheService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rebuild();
  }

  async rebuild(): Promise<void> {
    await this.contentService.refresh();
    const posts = this.contentService.getPublishedPosts();
    const requested = this.resolveBackendDriver();

    if (requested === 'postgres') {
      try {
        await this.postgresRepository.rebuild(posts);
        this.backend = 'postgres';
      } catch (error) {
        this.logger.warn('PostgreSQL index unavailable, fallback to memory index');
        this.logger.warn(error instanceof Error ? error.message : String(error));
        await this.memoryRepository.rebuild(posts);
        this.backend = 'memory';
      }
    } else {
      await this.memoryRepository.rebuild(posts);
      this.backend = 'memory';
    }

    this.cacheVersion = Date.now();
    this.logger.log(`Index backend ready: ${this.backend}`);
  }

  async search(query: string, page: number, size: number): Promise<SearchResult> {
    const key = this.cacheKey('search', query.trim().toLowerCase(), String(page), String(size));
    const cached = await this.cacheService.getJson<SearchResult>(key);
    if (cached) {
      return cached;
    }

    const result = await this.getRepository().search(query, page, size);
    await this.cacheService.setJson(key, result, this.cacheTtlSeconds());
    return result;
  }

  async listTags(): Promise<TagSummary[]> {
    const key = this.cacheKey('tags');
    const cached = await this.cacheService.getJson<TagSummary[]>(key);
    if (cached) {
      return cached;
    }

    const result = await this.getRepository().listTags();
    await this.cacheService.setJson(key, result, this.cacheTtlSeconds());
    return result;
  }

  async listPostsByTag(tagSlug: string, page: number, size: number, query?: string): Promise<TagPostResponse> {
    const normalizedTagSlug = normalizeToSlug(tagSlug);
    const normalizedQuery = query?.trim().toLowerCase() ?? '';
    const key = this.cacheKey('tags-posts', normalizedTagSlug, normalizedQuery, String(page), String(size));
    const cached = await this.cacheService.getJson<TagPostResponse>(key);
    if (cached) {
      return cached;
    }

    const result = await this.getRepository().listPostsByTag(normalizedTagSlug, page, size, query);
    await this.cacheService.setJson(key, result, this.cacheTtlSeconds());
    return result;
  }

  async listTopics(): Promise<TopicSummary[]> {
    const key = this.cacheKey('topics');
    const cached = await this.cacheService.getJson<TopicSummary[]>(key);
    if (cached) {
      return cached;
    }

    const result = await this.getRepository().listTopics();
    await this.cacheService.setJson(key, result, this.cacheTtlSeconds());
    return result;
  }

  async listPostsByTopic(topicSlug: string, page: number, size: number): Promise<TopicPostResponse> {
    const normalizedTopicSlug = normalizeToSlug(topicSlug);
    const key = this.cacheKey('topics-posts', normalizedTopicSlug, String(page), String(size));
    const cached = await this.cacheService.getJson<TopicPostResponse>(key);
    if (cached) {
      return cached;
    }

    const result = await this.getRepository().listPostsByTopic(normalizedTopicSlug, page, size);
    await this.cacheService.setJson(key, result, this.cacheTtlSeconds());
    return result;
  }

  async listPosts(page: number, size: number): Promise<PostListResponse> {
    const key = this.cacheKey('posts', String(page), String(size));
    const cached = await this.cacheService.getJson<PostListResponse>(key);
    if (cached) {
      return cached;
    }

    const result = await this.getRepository().listPosts(page, size);
    await this.cacheService.setJson(key, result, this.cacheTtlSeconds());
    return result;
  }

  async getPostBySlug(slug: string): Promise<PostDetail | null> {
    const key = this.cacheKey('post', slug);
    const cached = await this.cacheService.getJson<PostDetail>(key);
    if (cached) {
      return cached;
    }

    const result = await this.getRepository().getPostBySlug(slug);
    if (result) {
      await this.cacheService.setJson(key, result, this.cacheTtlSeconds());
    }
    return result;
  }

  async getPostRelations(slug: string, relatedLimit = 3): Promise<PostRelationsResponse | null> {
    const normalizedSlug = slug.trim();
    const limit = Math.max(1, Math.floor(relatedLimit));
    const key = this.cacheKey('post-relations', normalizedSlug, String(limit));
    const cached = await this.cacheService.getJson<PostRelationsResponse>(key);
    if (cached) {
      return cached;
    }

    const posts = this.contentService.getPublishedPosts();
    const currentIndex = posts.findIndex((post) => post.slug === normalizedSlug);
    if (currentIndex < 0) {
      return null;
    }

    const current = posts[currentIndex];
    const previous = posts[currentIndex + 1] ? this.mapPostSummary(posts[currentIndex + 1]) : null;
    const next = posts[currentIndex - 1] ? this.mapPostSummary(posts[currentIndex - 1]) : null;

    const relatedByScore = posts
      .filter((post) => post.slug !== normalizedSlug)
      .map((post) => ({ post, score: this.scoreRelatedPost(current, post) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => (a.score === b.score ? b.post.date.localeCompare(a.post.date) : b.score - a.score))
      .map((item) => this.mapPostSummary(item.post));

    const related: PostSummary[] = [];
    const used = new Set<string>();

    for (const item of relatedByScore) {
      if (related.length >= limit) {
        break;
      }

      related.push(item);
      used.add(item.slug);
    }

    if (related.length < limit) {
      for (const post of posts) {
        if (post.slug === normalizedSlug || used.has(post.slug)) {
          continue;
        }

        related.push(this.mapPostSummary(post));
        if (related.length >= limit) {
          break;
        }
      }
    }

    const result: PostRelationsResponse = {
      previous,
      next,
      related,
    };

    await this.cacheService.setJson(key, result, this.cacheTtlSeconds());
    return result;
  }

  private resolveBackendDriver(): BackendDriver {
    const configured = this.configService.get<string>('INDEX_DRIVER')?.toLowerCase();
    if (configured === 'postgres') {
      if (!this.postgresRepository.isConfigured()) {
        this.logger.warn('INDEX_DRIVER=postgres but DATABASE_URL is missing, fallback to memory');
        return 'memory';
      }

      return 'postgres';
    }

    return 'memory';
  }

  private getRepository(): Pick<
    MemoryIndexRepository,
    'search' | 'listTags' | 'listPostsByTag' | 'listTopics' | 'listPostsByTopic' | 'listPosts' | 'getPostBySlug'
  > {
    return this.backend === 'postgres' ? this.postgresRepository : this.memoryRepository;
  }

  private cacheKey(...parts: string[]): string {
    return ['boke', 'index', `v${this.cacheVersion}`, this.backend, ...parts].join(':');
  }

  private cacheTtlSeconds(): number {
    const value = Number(this.configService.get<string>('CACHE_TTL_SECONDS') ?? 120);
    return Number.isFinite(value) && value > 0 ? value : 120;
  }

  private mapPostSummary(post: {
    slug: string;
    title: string;
    summary: string;
    tags: string[];
    topics: string[];
    date: string;
    updated?: string;
    pinned: boolean;
    lang: string;
  }): PostSummary {
    return {
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      tags: post.tags,
      topics: post.topics,
      date: post.date,
      updated: post.updated,
      pinned: post.pinned,
      lang: post.lang,
    };
  }

  private scoreRelatedPost(
    current: { tags: string[]; topics: string[]; lang: string },
    candidate: { tags: string[]; topics: string[]; lang: string },
  ): number {
    const currentTags = new Set(current.tags.map((item) => normalizeToSlug(item)));
    const currentTopics = new Set(current.topics.map((item) => normalizeToSlug(item)));

    let tagOverlap = 0;
    for (const tag of candidate.tags) {
      if (currentTags.has(normalizeToSlug(tag))) {
        tagOverlap += 1;
      }
    }

    let topicOverlap = 0;
    for (const topic of candidate.topics) {
      if (currentTopics.has(normalizeToSlug(topic))) {
        topicOverlap += 1;
      }
    }

    const languageBonus = current.lang === candidate.lang ? 1 : 0;
    return tagOverlap * 3 + topicOverlap * 2 + languageBonus;
  }
}
