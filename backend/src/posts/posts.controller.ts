import { Controller, Get, Post, Delete, Param, Query, Body, HttpCode, HttpStatus, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Public()
  @Get()
  async list(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const take = Math.min(parseInt(limit || '20'), 50);
    const pageNum = Math.max(parseInt(page || '1'), 1);
    const skip = (pageNum - 1) * take;
    const sortMode: 'popular' | 'recent' = sort === 'popular' ? 'popular' : 'recent';
    const where: any = { isPublished: true };
    if (category) where.category = category;
    try {
      const { posts, total } = await this.postsService.list(where, take, skip, sortMode);
      return { success: true, data: { posts, total, page: pageNum, totalPages: Math.ceil(total / take) } };
    } catch {
      return { success: true, data: { posts: [], total: 0, page: 1, totalPages: 0 } };
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: { content: string; category?: string; imageUrl?: string; companyId?: string }, @CurrentUser() user: JwtPayload) {
    try {
      const post = await this.postsService.create({
        authorId: user.sub,
        content: body.content,
        category: body.category,
        imageUrl: body.imageUrl,
        companyId: body.companyId,
      });
      return { success: true, data: post };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to create post' };
    }
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async like(@Param('id') id: string, @Body() body: { type?: string }, @CurrentUser() user: JwtPayload) {
    const result = await this.postsService.setReaction(id, user.sub, body?.type ?? 'like');
    // `liked`/`likeCount` kept for backward compatibility; `reactions`/`userReaction` are new.
    return { success: true, liked: result.liked, data: result };
  }

  @Post(':id/comment')
  @HttpCode(HttpStatus.CREATED)
  async comment(@Param('id') id: string, @Body() body: { content: string }, @CurrentUser() user: JwtPayload) {
    const comment = await this.postsService.addComment(id, user.sub, body.content.trim());
    return { success: true, data: comment };
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  async commentsAlias(@Param('id') id: string, @Body() body: { content: string }, @CurrentUser() user: JwtPayload) {
    return this.comment(id, body, user);
  }

  /** DELETE /api/posts/:id — delete post (author or admin only) */
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const post = await this.postsService.findPostById(id);
    if (!post) throw new NotFoundException('Post not found');

    const isAdmin = user.userType === 'admin' || user.userType === 'regional-admin';
    if (post.authorId !== user.sub && !isAdmin) {
      throw new ForbiddenException('Not authorized to delete this post');
    }

    await this.postsService.deletePost(id);
    return { success: true, message: 'Post deleted' };
  }

  /** GET /api/posts/:id/comments — paginated comments for a post */
  @Public()
  @Get(':id/comments')
  async getComments(@Param('id') id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    try {
      const take = Math.min(parseInt(limit || '10'), 50);
      const pageNum = Math.max(parseInt(page || '1'), 1);
      const skip = (pageNum - 1) * take;
      const { comments, total } = await this.postsService.getComments(id, take, skip);
      return { success: true, data: { comments, total, page: pageNum, totalPages: Math.ceil(total / take) } };
    } catch {
      return { success: true, data: { comments: [], total: 0, page: 1, totalPages: 0 } };
    }
  }
}
