import { Controller, Get, Param, Query } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { TagsService } from './tags.service';

class PaginationQueryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q?: string;

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

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  listTags() {
    return this.tagsService.getTagSummaries();
  }

  @Get(':slug/posts')
  listPostsByTag(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.tagsService.getPostsByTag(slug, query.page, query.size, query.q);
  }
}
