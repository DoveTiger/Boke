import { Injectable } from '@nestjs/common';
import { normalizeToSlug } from '../../common/utils/slug.util';
import {
  IndexPost,
  PostDetail,
  PostListResponse,
  PostSummary,
  SearchResult,
  TagPostItem,
  TagPostResponse,
  TagSummary,
  TopicPostItem,
  TopicPostResponse,
  TopicSummary,
} from './index.types';

interface ScoredPost {
  score: number;
  post: IndexPost;
}

@Injectable()
export class MemoryIndexRepository {
  private posts: IndexPost[] = [];

  async rebuild(posts: IndexPost[]): Promise<void> {
    this.posts = [...posts].sort((a, b) =>
      a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date),
    );
  }

  async search(rawQuery: string, page = 1, size = 10): Promise<SearchResult> {
    const query = rawQuery.trim().toLowerCase();
    const scored = this.posts
      .map((post) => this.scorePost(post, query))
      .filter((item): item is ScoredPost => item !== null)
      .sort((a, b) => (a.score === b.score ? b.post.date.localeCompare(a.post.date) : b.score - a.score));

    const total = scored.length;
    const start = (page - 1) * size;
    const items = scored.slice(start, start + size).map(({ post }) => ({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      tags: post.tags,
      topics: post.topics,
      date: post.date,
      updated: post.updated,
      pinned: post.pinned,
      lang: post.lang,
    }));

    return { total, page, size, items };
  }

  async listTags(): Promise<TagSummary[]> {
    const counter = new Map<string, TagSummary>();

    for (const post of this.posts) {
      for (const tag of post.tags) {
        const normalized = tag.trim();
        if (!normalized) {
          continue;
        }

        const slug = normalizeToSlug(normalized);
        const existing = counter.get(slug);
        if (existing) {
          existing.count += 1;
          continue;
        }

        counter.set(slug, {
          name: normalized,
          slug,
          count: 1,
        });
      }
    }

    return [...counter.values()].sort((a, b) =>
      a.count === b.count ? a.slug.localeCompare(b.slug) : b.count - a.count,
    );
  }

  async listPostsByTag(tagSlug: string, page = 1, size = 10, rawQuery?: string): Promise<TagPostResponse> {
    const normalizedSlug = normalizeToSlug(tagSlug);
    const query = rawQuery?.trim().toLowerCase();
    const all = this.posts
      .filter((post) => post.tags.some((tag) => normalizeToSlug(tag) === normalizedSlug))
      .map((post) => ({
        post,
        score: query ? this.scorePost(post, query)?.score ?? 0 : 0,
      }))
      .filter((item) => (query ? item.score > 0 : true))
      .sort((a, b) => {
        if (query && a.score !== b.score) {
          return b.score - a.score;
        }

        return b.post.date.localeCompare(a.post.date);
      });

    const total = all.length;
    const start = (page - 1) * size;
    const items = all.slice(start, start + size).map(({ post }) => this.mapTagPost(post));

    return { total, page, size, items };
  }

  async listTopics(): Promise<TopicSummary[]> {
    const counter = new Map<string, TopicSummary>();

    for (const post of this.posts) {
      for (const topic of post.topics) {
        const normalized = topic.trim();
        if (!normalized) {
          continue;
        }

        const slug = normalizeToSlug(normalized);
        const existing = counter.get(slug);
        if (existing) {
          existing.count += 1;
          continue;
        }

        counter.set(slug, {
          name: normalized,
          slug,
          count: 1,
        });
      }
    }

    return [...counter.values()].sort((a, b) =>
      a.count === b.count ? a.slug.localeCompare(b.slug) : b.count - a.count,
    );
  }

  async listPostsByTopic(topicSlug: string, page = 1, size = 10): Promise<TopicPostResponse> {
    const normalizedSlug = normalizeToSlug(topicSlug);
    const all = this.posts
      .filter((post) => post.topics.some((topic) => normalizeToSlug(topic) === normalizedSlug))
      .sort((a, b) => b.date.localeCompare(a.date));

    const total = all.length;
    const start = (page - 1) * size;
    const items = all.slice(start, start + size).map((post) => this.mapTopicPost(post));

    return { total, page, size, items };
  }

  async listPosts(page = 1, size = 10): Promise<PostListResponse> {
    const all = [...this.posts].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return b.date.localeCompare(a.date);
    });

    const total = all.length;
    const start = (page - 1) * size;
    const items = all.slice(start, start + size).map((post) => this.mapPostSummary(post));

    return { total, page, size, items };
  }

  async getPostBySlug(slug: string): Promise<PostDetail | null> {
    const normalized = slug.trim();
    const post = this.posts.find((item) => item.slug === normalized);
    return post ? this.mapPostDetail(post) : null;
  }

  private scorePost(post: IndexPost, query: string): ScoredPost | null {
    const title = post.title.toLowerCase();
    const summary = post.summary.toLowerCase();
    const tags = post.tags.map((tag) => tag.toLowerCase());

    let score = 0;

    if (title.includes(query)) {
      score += 3;
    }

    if (tags.some((tag) => tag.includes(query))) {
      score += 2;
    }

    if (summary.includes(query)) {
      score += 1;
    }

    if (score === 0) {
      return null;
    }

    return { score, post };
  }

  private mapTagPost(post: IndexPost): TagPostItem {
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

  private mapTopicPost(post: IndexPost): TopicPostItem {
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

  private mapPostSummary(post: IndexPost): PostSummary {
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

  private mapPostDetail(post: IndexPost): PostDetail {
    return {
      ...this.mapPostSummary(post),
      content: post.content,
    };
  }
}
