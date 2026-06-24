import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SYSTEM_USER_TYPES = new Set(['MEMBER', 'PATIENT', 'ADMIN', 'REGIONAL_ADMIN']);

export const REACTION_TYPES = ['like', 'love', 'sad', 'bad', 'misinfo'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

/** Tally a list of {type} like rows into a per-reaction count map. */
function tallyReactions(likes?: Array<{ type?: string | null }>): Record<ReactionType, number> {
  const counts: Record<ReactionType, number> = { like: 0, love: 0, sad: 0, bad: 0, misinfo: 0 };
  for (const l of likes ?? []) {
    const t = (l.type ?? 'like') as ReactionType;
    if (t in counts) counts[t] += 1;
  }
  return counts;
}

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async list(where: any, take: number, skip: number, sort: 'popular' | 'recent' = 'recent') {
    // Soft-deleted posts are hidden from the public feed.
    const safeWhere = { ...where, deletedAt: null };

    // "popular" sorts by like count desc then by date; "recent" sorts by date only
    const orderBy: any = sort === 'popular'
      ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]
      : { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: safeWhere, orderBy, take, skip,
        include: {
          author: { select: { id: true, firstName: true, lastName: true, profileImage: true, userType: true, verified: true } },
          company: { select: { id: true, companyName: true } },
          likes: { select: { type: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.post.count({ where: safeWhere }),
    ]);
    const mapped = posts.map((p: any) => {
      const { likes, ...rest } = p;
      return {
        ...rest,
        likeCount: p._count?.likes ?? 0,
        reactions: tallyReactions(likes),
        commentCount: p._count?.comments ?? 0,
      };
    });
    return { posts: mapped, total };
  }

  async create(data: { authorId: string; content: string; category?: string; imageUrl?: string; companyId?: string }) {
    // Providers must be verified to post; members/admins can always post
    const author = await this.prisma.user.findUnique({
      where: { id: data.authorId },
      select: { userType: true, verified: true },
    });
    const isProvider = author?.userType && !SYSTEM_USER_TYPES.has(author.userType as string);
    if (isProvider && !author?.verified) {
      throw new ForbiddenException('Your account must be verified before you can post to the feed. Please upload your required documents.');
    }

    // If companyId provided, verify the user owns that company
    if (data.companyId) {
      const profile = await this.prisma.corporateAdminProfile.findFirst({
        where: { id: data.companyId, userId: data.authorId },
        select: { id: true },
      });
      if (!profile) {
        throw new Error('You do not own this company');
      }
    }
    // Return the post in the SAME shape `list()` returns so the frontend
    // can drop it straight into the feed without a refetch. Without the
    // author include, PostCard crashes on `post.author.doctorProfile?.…`.
    const created = await this.prisma.post.create({
      data,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, profileImage: true, userType: true } },
        company: { select: { id: true, companyName: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    return {
      ...created,
      likeCount: (created as any)._count?.likes ?? 0,
      commentCount: (created as any)._count?.comments ?? 0,
    };
  }

  /**
   * Set the user's reaction on a post. Clicking the same reaction again removes
   * it (toggle off); a different reaction replaces the previous one. Returns the
   * fresh per-type counts, the user's resulting reaction, and the total.
   */
  async setReaction(postId: string, userId: string, type: string) {
    const t: ReactionType = (REACTION_TYPES as readonly string[]).includes(type) ? (type as ReactionType) : 'like';
    const existing = await this.prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } });
    let userReaction: ReactionType | null;
    if (existing) {
      if (((existing as any).type ?? 'like') === t) {
        await this.prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
        userReaction = null;
      } else {
        await this.prisma.postLike.update({ where: { postId_userId: { postId, userId } }, data: { type: t } as any });
        userReaction = t;
      }
    } else {
      await this.prisma.postLike.create({ data: { postId, userId, type: t } as any });
      userReaction = t;
    }
    const rows = await this.prisma.postLike.findMany({ where: { postId }, select: { type: true } });
    const reactions = tallyReactions(rows as any);
    const likeCount = (rows as any[]).length;
    return { liked: userReaction !== null, userReaction, reactions, likeCount };
  }

  async addComment(postId: string, authorId: string, content: string) {
    return this.prisma.postComment.create({
      data: { postId, authorId, content },
    });
  }

  async findPostById(id: string) {
    return this.prisma.post.findUnique({ where: { id }, select: { id: true, authorId: true } });
  }

  /**
   * Soft-delete the post: hides it from feeds while preserving likes/comments
   * in case the author restores it or admins need an audit trail.
   * Use {@link hardDelete} (admin-only) to physically wipe the row.
   */
  async deletePost(id: string) {
    await this.prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Admin hard-delete — irreversible, cascades likes/comments. */
  async hardDelete(id: string) {
    await this.prisma.$transaction([
      this.prisma.postLike.deleteMany({ where: { postId: id } }),
      this.prisma.postComment.deleteMany({ where: { postId: id } }),
      this.prisma.post.delete({ where: { id } }),
    ]);
  }

  async getComments(postId: string, take: number, skip: number) {
    const [comments, total] = await Promise.all([
      this.prisma.postComment.findMany({
        where: { postId }, orderBy: { createdAt: 'desc' }, take, skip,
        include: { author: { select: { id: true, firstName: true, lastName: true, profileImage: true, userType: true } } },
      }),
      this.prisma.postComment.count({ where: { postId } }),
    ]);
    return { comments, total };
  }
}
