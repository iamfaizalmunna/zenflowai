import { GraphQLError } from 'graphql';
import { ArticleVisibility, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { Context } from '../types/context';

const STAFF_ROLES = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

export async function listArticles(ctx: Context, search?: string, internal = false) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }

  const where: Prisma.KnowledgeArticleWhereInput = {
    isPublished: true,
    visibility: internal && STAFF_ROLES.has(ctx.role) ? ArticleVisibility.INTERNAL : ArticleVisibility.PUBLIC,
  };

  if (search?.trim()) {
    where.OR = [
      { title: { contains: search.trim() } },
      { body: { contains: search.trim() } },
    ];
  }

  return prisma.knowledgeArticle.findMany({
    where,
    include: { category: { select: { id: true, name: true, color: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 40,
  });
}

export async function getArticle(ctx: Context, id: number) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }

  const article = await prisma.knowledgeArticle.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true, color: true } } },
  });

  if (!article || !article.isPublished) {
    throw new GraphQLError('Article not found', { extensions: { code: 'NOT_FOUND' } });
  }
  if (article.visibility === ArticleVisibility.INTERNAL && !STAFF_ROLES.has(ctx.role)) {
    throw new GraphQLError('This guide is internal', { extensions: { code: 'FORBIDDEN' } });
  }

  await prisma.knowledgeArticle.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => undefined);

  return article;
}
