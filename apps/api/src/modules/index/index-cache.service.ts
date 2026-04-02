import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class IndexCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(IndexCacheService.name);
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  async getJson<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (!client) {
      return null;
    }

    const raw = await client.get(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const client = this.getClient();
    if (!client) {
      return;
    }

    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  private getClient(): Redis | null {
    if (this.client) {
      return this.client;
    }

    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      return null;
    }

    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
    });

    this.client.on('error', (error) => {
      this.logger.warn(`Redis cache unavailable: ${error.message}`);
    });

    return this.client;
  }
}
