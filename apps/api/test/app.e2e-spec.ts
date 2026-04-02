import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import * as path from 'path';
import { AppModule } from '../src/app.module';

describe('Blog API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.CONTENT_ROOT = path.resolve(__dirname, 'fixtures', 'posts');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health should return service health', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('boke-api');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET /api/search should search in title/summary/tags and exclude drafts', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/search')
      .query({ q: 'ai', page: 1, size: 10 })
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].slug).toBe('ai-practice');
    expect(res.body.items.every((item: { slug: string }) => item.slug !== 'draft-post')).toBe(true);
  });

  it('GET /api/posts should return published posts ordered by pinned and date', async () => {
    const res = await request(app.getHttpServer()).get('/api/posts').expect(200);

    expect(res.body.total).toBe(2);
    expect(res.body.items[0].slug).toBe('ai-practice');
    expect(res.body.items[1].slug).toBe('embedded-debug');
  });

  it('GET /api/posts/:slug should return a single post', async () => {
    const res = await request(app.getHttpServer()).get('/api/posts/embedded-debug').expect(200);

    expect(res.body.slug).toBe('embedded-debug');
    expect(res.body.tags).toEqual(expect.arrayContaining(['embedded']));
    expect(typeof res.body.content).toBe('string');
    expect(res.body.content).toContain('JTAG');
  });

  it('GET /api/posts/:slug/relations should return previous/next/related posts', async () => {
    const res = await request(app.getHttpServer()).get('/api/posts/embedded-debug/relations').expect(200);

    expect(res.body.previous).toBeNull();
    expect(res.body.next).toEqual(expect.objectContaining({ slug: 'ai-practice' }));
    expect(Array.isArray(res.body.related)).toBe(true);
    expect(res.body.related).toEqual(expect.arrayContaining([expect.objectContaining({ slug: 'ai-practice' })]));
  });

  it('GET /api/tags should return tag counts', async () => {
    const res = await request(app.getHttpServer()).get('/api/tags').expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: 'ai', count: 1 }),
        expect.objectContaining({ slug: 'embedded', count: 1 }),
      ]),
    );
  });

  it('GET /api/tags/:slug/posts should return posts by tag', async () => {
    const res = await request(app.getHttpServer()).get('/api/tags/embedded/posts').expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].slug).toBe('embedded-debug');
  });

  it('GET /api/tags/:slug/posts should support tag and search query together', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tags/ai/posts')
      .query({ q: 'engineering', page: 1, size: 10 })
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].slug).toBe('ai-practice');
  });

  it('GET /api/tags/:slug/posts should return empty list when tag-search query has no match', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/tags/ai/posts')
      .query({ q: 'embedded', page: 1, size: 10 })
      .expect(200);

    expect(res.body.total).toBe(0);
    expect(res.body.items).toEqual([]);
  });

  it('GET /api/topics should return topics and counts', async () => {
    const res = await request(app.getHttpServer()).get('/api/topics').expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: 'ai-ying-yong', name: 'AI 应用', count: 1 }),
        expect.objectContaining({ slug: 'qian-ru-shi', name: '嵌入式', count: 1 }),
      ]),
    );
  });

  it('GET /api/topics/:slug/posts should return posts by topic', async () => {
    const res = await request(app.getHttpServer()).get('/api/topics/ai-ying-yong/posts').expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items[0].slug).toBe('ai-practice');
  });

  it('GET /api/search should reject empty query', async () => {
    await request(app.getHttpServer()).get('/api/search').query({ q: '' }).expect(400);
  });
});
