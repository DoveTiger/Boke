import { Controller, Get, Param, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { TopicsService } from './topics.service';

class PaginationQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  size: number = 10;
}

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  listTopics() {
    return this.topicsService.getTopicSummaries();
  }

  @Get(':slug/posts')
  listPostsByTopic(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.topicsService.getPostsByTopic(slug, query.page, query.size);
  }
}