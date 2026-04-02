import { Controller, Get, Param, Query } from '@nestjs/common';
import { PostsQueryDto } from './dto/posts-query.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  listPosts(@Query() query: PostsQueryDto) {
    return this.postsService.listPosts(query.page, query.size);
  }

  @Get(':slug')
  getPostBySlug(@Param('slug') slug: string) {
    return this.postsService.getPostBySlug(slug);
  }

  @Get(':slug/relations')
  getPostRelations(@Param('slug') slug: string) {
    return this.postsService.getPostRelations(slug);
  }
}
