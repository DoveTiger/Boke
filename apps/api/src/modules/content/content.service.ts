import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, promises as fs } from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import { PublishedPost } from './content.types';

interface RawFrontmatter {
  title?: unknown;
  slug?: unknown;
  date?: unknown;
  updated?: unknown;
  summary?: unknown;
  tags?: unknown;
  topics?: unknown;
  pinned?: unknown;
  status?: unknown;
  lang?: unknown;
}

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);
  private publishedPosts: PublishedPost[] = [];

  constructor(private readonly configService: ConfigService) {}

  getPublishedPosts(): PublishedPost[] {
    return [...this.publishedPosts];
  }

  async refresh(): Promise<void> {
    const contentRoot = this.resolveContentRoot();
    const markdownFiles = await this.collectMarkdownFiles(contentRoot);

    const posts = await Promise.all(
      markdownFiles.map(async (filePath) => {
        const raw = await fs.readFile(filePath, 'utf-8');
        return this.parsePost(raw, filePath);
      }),
    );

    this.publishedPosts = posts
      .filter((item): item is PublishedPost => item !== null)
      .sort((a, b) =>
        a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date),
      );

    this.logger.log(`Loaded ${this.publishedPosts.length} published posts from ${contentRoot}`);
  }

  private resolveContentRoot(): string {
    const configured = this.configService.get<string>('CONTENT_ROOT');
    if (configured && configured.trim().length > 0) {
      return path.resolve(configured);
    }

    const candidates = [
      path.resolve(process.cwd(), 'content', 'posts'),
      path.resolve(process.cwd(), '..', 'content', 'posts'),
      path.resolve(process.cwd(), '..', '..', 'content', 'posts'),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return candidates[0];
  }

  private async collectMarkdownFiles(rootDir: string): Promise<string[]> {
    const result: string[] = [];

    const walk = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true, encoding: 'utf-8' });
        await Promise.all(
          entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              await walk(fullPath);
              return;
            }

            if (entry.isFile() && fullPath.toLowerCase().endsWith('.md')) {
              result.push(fullPath);
            }
          }),
        );
      } catch {
        return;
      }
    };

    await walk(rootDir);
    return result;
  }

  private parsePost(fileContent: string, filePath: string): PublishedPost | null {
    const parsed = matter(fileContent);
    const data = parsed.data as RawFrontmatter;

    if (!this.isPublished(data.status)) {
      return null;
    }

    const title = this.readString(data.title);
    const slug = this.readString(data.slug);
    const date = this.readString(data.date);
    const summary = this.readString(data.summary);

    if (!title || !slug || !date || !summary) {
      this.logger.warn(`Skip invalid post metadata: ${filePath}`);
      return null;
    }

    return {
      title,
      slug,
      date,
      updated: this.readOptionalString(data.updated),
      summary,
      tags: this.readStringArray(data.tags),
      topics: this.readStringArray(data.topics),
      pinned: Boolean(data.pinned),
      lang: this.readOptionalString(data.lang) ?? 'zh-CN',
      content: parsed.content.trim(),
    };
  }

  private isPublished(status: unknown): boolean {
    return typeof status === 'string' && status.toLowerCase() === 'published';
  }

  private readString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private readOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  private readStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
