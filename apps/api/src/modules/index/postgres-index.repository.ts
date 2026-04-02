import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { normalizeToSlug } from '../../common/utils/slug.util';
import {
  IndexPost,
  PostDetail,
  PostListResponse,
  PostSummary,
  SearchItem,
  SearchResult,
  TagPostItem,
  TagPostResponse,
  TagSummary,
  TopicPostItem,
  TopicPostResponse,
  TopicSummary,
} from './index.types';

interface PgRowBase {
  slug: string;
  title: string;
  summary: string;
  date: string;
  updated: string | null;
  pinned: boolean;
  lang: string;
  tags: string[];
}

interface PgTopicPostRow extends PgRowBase {
  topics: string[];
}

interface PgPostDetailRow extends PgTopicPostRow {
  content: string;
}

@Injectable()
export class PostgresIndexRepository implements OnModuleDestroy {
  private readonly logger = new Logger(PostgresIndexRepository.name);
  private pool: Pool | null = null;
  private schemaReady = false;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    return Boolean(databaseUrl && databaseUrl.trim().length > 0);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.schemaReady = false;
    }
  }

  async rebuild(posts: IndexPost[]): Promise<void> {
    const pool = await this.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('TRUNCATE TABLE post_topics, post_tags, posts RESTART IDENTITY');

      for (const post of posts) {
        const inserted = await client.query<{ id: number }>(
          `
          INSERT INTO posts (slug, title, summary, date, updated, pinned, lang, content)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
          `,
          [
            post.slug,
            post.title,
            post.summary,
            post.date,
            post.updated ?? null,
            post.pinned,
            post.lang,
            post.content,
          ],
        );

        const postId = inserted.rows[0]?.id;
        if (!postId) {
          continue;
        }

        for (const tagName of post.tags) {
          await client.query(
            `
            INSERT INTO post_tags (post_id, tag_name, tag_slug)
            VALUES ($1, $2, $3)
            `,
            [postId, tagName, normalizeToSlug(tagName)],
          );
        }

        for (const topicName of post.topics) {
          await client.query(
            `
            INSERT INTO post_topics (post_id, topic_name, topic_slug)
            VALUES ($1, $2, $3)
            `,
            [postId, topicName, normalizeToSlug(topicName)],
          );
        }
      }

      await client.query('COMMIT');
      this.logger.log(`Rebuilt PostgreSQL index with ${posts.length} posts`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async search(rawQuery: string, page = 1, size = 10): Promise<SearchResult> {
    const query = `%${rawQuery.trim()}%`;
    const offset = (page - 1) * size;
    const pool = await this.getPool();

    const totalResult = await pool.query<{ total: string }>(
      `
      WITH matched AS (
        SELECT
          p.id,
          (
            CASE WHEN p.title ILIKE $1 THEN 3 ELSE 0 END +
            CASE WHEN p.summary ILIKE $1 THEN 1 ELSE 0 END +
            CASE WHEN EXISTS (
              SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_name ILIKE $1
            ) THEN 2 ELSE 0 END
          ) AS score
        FROM posts p
      )
      SELECT COUNT(*)::text AS total
      FROM matched
      WHERE score > 0
      `,
      [query],
    );

    const total = Number(totalResult.rows[0]?.total ?? 0);

    const rows = await pool.query<PgTopicPostRow & { score: number }>(
      `
      WITH matched AS (
        SELECT
          p.id,
          p.slug,
          p.title,
          p.summary,
          p.date,
          p.updated,
          p.pinned,
          p.lang,
          (
            CASE WHEN p.title ILIKE $1 THEN 3 ELSE 0 END +
            CASE WHEN p.summary ILIKE $1 THEN 1 ELSE 0 END +
            CASE WHEN EXISTS (
              SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_name ILIKE $1
            ) THEN 2 ELSE 0 END
          ) AS score
        FROM posts p
      )
      SELECT
        m.slug,
        m.title,
        m.summary,
        m.date,
        m.updated,
        m.pinned,
        m.lang,
        m.score,
        COALESCE(array_agg(DISTINCT t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), '{}') AS tags,
        COALESCE(array_agg(DISTINCT tp.topic_name) FILTER (WHERE tp.topic_name IS NOT NULL), '{}') AS topics
      FROM matched m
      LEFT JOIN post_tags t ON t.post_id = m.id
      LEFT JOIN post_topics tp ON tp.post_id = m.id
      WHERE m.score > 0
      GROUP BY m.id, m.slug, m.title, m.summary, m.date, m.updated, m.pinned, m.lang, m.score
      ORDER BY m.score DESC, m.date DESC
      LIMIT $2 OFFSET $3
      `,
      [query, size, offset],
    );

    const items: SearchItem[] = rows.rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      tags: row.tags ?? [],
      topics: row.topics ?? [],
      date: row.date,
      updated: row.updated ?? undefined,
      pinned: row.pinned,
      lang: row.lang,
    }));

    return { total, page, size, items };
  }

  async listTags(): Promise<TagSummary[]> {
    const pool = await this.getPool();
    const rows = await pool.query<{ slug: string; name: string; count: string }>(
      `
      SELECT
        pt.tag_slug AS slug,
        MIN(pt.tag_name) AS name,
        COUNT(DISTINCT pt.post_id)::text AS count
      FROM post_tags pt
      GROUP BY pt.tag_slug
      ORDER BY COUNT(DISTINCT pt.post_id) DESC, pt.tag_slug ASC
      `,
    );

    return rows.rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      count: Number(row.count),
    }));
  }

  async listPostsByTag(tagSlug: string, page = 1, size = 10, rawQuery?: string): Promise<TagPostResponse> {
    const pool = await this.getPool();
    const offset = (page - 1) * size;
    const query = rawQuery?.trim();
    const searchLike = query ? `%${query}%` : null;

    const totalResult = await pool.query<{ total: string }>(
      `
      SELECT COUNT(DISTINCT p.id)::text AS total
      FROM posts p
      INNER JOIN post_tags ft ON ft.post_id = p.id
      WHERE ft.tag_slug = $1
        AND (
          $2::text IS NULL
          OR p.title ILIKE $2
          OR p.summary ILIKE $2
          OR EXISTS (
            SELECT 1 FROM post_tags spt WHERE spt.post_id = p.id AND spt.tag_name ILIKE $2
          )
        )
      `,
      [tagSlug, searchLike],
    );

    const total = Number(totalResult.rows[0]?.total ?? 0);

    const rows = await pool.query<PgTopicPostRow & { score: number }>(
      `
      WITH matched AS (
        SELECT
          p.id,
          p.slug,
          p.title,
          p.summary,
          p.date,
          p.updated,
          p.pinned,
          p.lang,
          (
            CASE WHEN $2::text IS NULL THEN 0 ELSE
              CASE WHEN p.title ILIKE $2 THEN 3 ELSE 0 END +
              CASE WHEN p.summary ILIKE $2 THEN 1 ELSE 0 END +
              CASE WHEN EXISTS (
                SELECT 1 FROM post_tags spt WHERE spt.post_id = p.id AND spt.tag_name ILIKE $2
              ) THEN 2 ELSE 0 END
            END
          ) AS score
        FROM posts p
        INNER JOIN post_tags ft ON ft.post_id = p.id AND ft.tag_slug = $1
        WHERE
          $2::text IS NULL
          OR p.title ILIKE $2
          OR p.summary ILIKE $2
          OR EXISTS (
            SELECT 1 FROM post_tags spt WHERE spt.post_id = p.id AND spt.tag_name ILIKE $2
          )
      )
      SELECT
        m.slug,
        m.title,
        m.summary,
        m.date,
        m.updated,
        m.pinned,
        m.lang,
        m.score,
        COALESCE(array_agg(DISTINCT t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), '{}') AS tags,
        COALESCE(array_agg(DISTINCT tp.topic_name) FILTER (WHERE tp.topic_name IS NOT NULL), '{}') AS topics
      FROM matched m
      LEFT JOIN post_tags t ON t.post_id = m.id
      LEFT JOIN post_topics tp ON tp.post_id = m.id
      GROUP BY m.id, m.slug, m.title, m.summary, m.date, m.updated, m.pinned, m.lang, m.score
      ORDER BY
        CASE WHEN $2::text IS NULL THEN 0 ELSE m.score END DESC,
        m.date DESC
      LIMIT $3 OFFSET $4
      `,
      [tagSlug, searchLike, size, offset],
    );

    const items: TagPostItem[] = rows.rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      tags: row.tags ?? [],
      topics: row.topics ?? [],
      date: row.date,
      updated: row.updated ?? undefined,
      pinned: row.pinned,
      lang: row.lang,
    }));

    return { total, page, size, items };
  }

  async listTopics(): Promise<TopicSummary[]> {
    const pool = await this.getPool();
    const rows = await pool.query<{ slug: string; name: string; count: string }>(
      `
      SELECT
        pt.topic_slug AS slug,
        MIN(pt.topic_name) AS name,
        COUNT(DISTINCT pt.post_id)::text AS count
      FROM post_topics pt
      GROUP BY pt.topic_slug
      ORDER BY COUNT(DISTINCT pt.post_id) DESC, pt.topic_slug ASC
      `,
    );

    return rows.rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      count: Number(row.count),
    }));
  }

  async listPostsByTopic(topicSlug: string, page = 1, size = 10): Promise<TopicPostResponse> {
    const pool = await this.getPool();
    const offset = (page - 1) * size;

    const totalResult = await pool.query<{ total: string }>(
      `
      SELECT COUNT(DISTINCT p.id)::text AS total
      FROM posts p
      INNER JOIN post_topics ft ON ft.post_id = p.id
      WHERE ft.topic_slug = $1
      `,
      [topicSlug],
    );

    const total = Number(totalResult.rows[0]?.total ?? 0);

    const rows = await pool.query<PgTopicPostRow>(
      `
      SELECT
        p.slug,
        p.title,
        p.summary,
        p.date,
        p.updated,
        p.pinned,
        p.lang,
        COALESCE(array_agg(DISTINCT t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), '{}') AS tags,
        COALESCE(array_agg(DISTINCT tp.topic_name) FILTER (WHERE tp.topic_name IS NOT NULL), '{}') AS topics
      FROM posts p
      INNER JOIN post_topics ft ON ft.post_id = p.id AND ft.topic_slug = $1
      LEFT JOIN post_tags t ON t.post_id = p.id
      LEFT JOIN post_topics tp ON tp.post_id = p.id
      GROUP BY p.id, p.slug, p.title, p.summary, p.date, p.updated, p.pinned, p.lang
      ORDER BY p.date DESC
      LIMIT $2 OFFSET $3
      `,
      [topicSlug, size, offset],
    );

    const items: TopicPostItem[] = rows.rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      tags: row.tags ?? [],
      topics: row.topics ?? [],
      date: row.date,
      updated: row.updated ?? undefined,
      pinned: row.pinned,
      lang: row.lang,
    }));

    return { total, page, size, items };
  }

  async listPosts(page = 1, size = 10): Promise<PostListResponse> {
    const pool = await this.getPool();
    const offset = (page - 1) * size;
    const totalResult = await pool.query<{ total: string }>('SELECT COUNT(*)::text AS total FROM posts');
    const total = Number(totalResult.rows[0]?.total ?? 0);

    const rows = await pool.query<PgTopicPostRow>(
      `
      SELECT
        p.slug,
        p.title,
        p.summary,
        p.date,
        p.updated,
        p.pinned,
        p.lang,
        COALESCE(array_agg(DISTINCT t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), '{}') AS tags,
        COALESCE(array_agg(DISTINCT tp.topic_name) FILTER (WHERE tp.topic_name IS NOT NULL), '{}') AS topics
      FROM posts p
      LEFT JOIN post_tags t ON t.post_id = p.id
      LEFT JOIN post_topics tp ON tp.post_id = p.id
      GROUP BY p.id, p.slug, p.title, p.summary, p.date, p.updated, p.pinned, p.lang
      ORDER BY p.pinned DESC, p.date DESC
      LIMIT $1 OFFSET $2
      `,
      [size, offset],
    );

    const items = rows.rows.map((row) => this.mapPostSummary(row));
    return { total, page, size, items };
  }

  async getPostBySlug(slug: string): Promise<PostDetail | null> {
    const pool = await this.getPool();
    const rows = await pool.query<PgPostDetailRow>(
      `
      SELECT
        p.slug,
        p.title,
        p.summary,
        p.date,
        p.updated,
        p.pinned,
        p.lang,
        p.content,
        COALESCE(array_agg(DISTINCT t.tag_name) FILTER (WHERE t.tag_name IS NOT NULL), '{}') AS tags,
        COALESCE(array_agg(DISTINCT tp.topic_name) FILTER (WHERE tp.topic_name IS NOT NULL), '{}') AS topics
      FROM posts p
      LEFT JOIN post_tags t ON t.post_id = p.id
      LEFT JOIN post_topics tp ON tp.post_id = p.id
      WHERE p.slug = $1
      GROUP BY p.id, p.slug, p.title, p.summary, p.date, p.updated, p.pinned, p.lang
      LIMIT 1
      `,
      [slug],
    );

    const row = rows.rows[0];
    return row ? this.mapPostDetail(row) : null;
  }

  private async getPool(): Promise<Pool> {
    if (!this.pool) {
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is required when INDEX_DRIVER=postgres');
      }

      this.pool = new Pool({ connectionString: databaseUrl });
    }

    if (!this.schemaReady) {
      await this.ensureSchema(this.pool);
      this.schemaReady = true;
    }

    return this.pool;
  }

  private async ensureSchema(pool: Pool): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        date DATE NOT NULL,
        updated DATE NULL,
        pinned BOOLEAN NOT NULL DEFAULT FALSE,
        lang TEXT NOT NULL DEFAULT 'zh-CN',
        content TEXT NOT NULL DEFAULT ''
      );

      ALTER TABLE posts ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';

      CREATE TABLE IF NOT EXISTS post_tags (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        tag_name TEXT NOT NULL,
        tag_slug TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS post_topics (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        topic_name TEXT NOT NULL,
        topic_slug TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
      CREATE INDEX IF NOT EXISTS idx_post_tags_slug ON post_tags(tag_slug);
      CREATE INDEX IF NOT EXISTS idx_post_topics_slug ON post_topics(topic_slug);
    `);
  }

  private mapPostSummary(row: PgTopicPostRow): PostSummary {
    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      tags: row.tags ?? [],
      topics: row.topics ?? [],
      date: row.date,
      updated: row.updated ?? undefined,
      pinned: row.pinned,
      lang: row.lang,
    };
  }

  private mapPostDetail(row: PgPostDetailRow): PostDetail {
    return {
      ...this.mapPostSummary(row),
      content: row.content ?? '',
    };
  }
}
