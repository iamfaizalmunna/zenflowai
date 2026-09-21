import { z } from 'zod';
import { GraphQLError } from 'graphql';
import { ArticleVisibility } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { Context } from '../types/context';
import { audit } from '../security/audit';

const articleSchema = z.object({
  title: z.string().min(3).max(180),
  body: z.string().min(10).max(20000),
  visibility: z.nativeEnum(ArticleVisibility).optional(),
  categoryId: z.number().int().positive().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export async function listAdminArticles(ctx: Context) {
  if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  return prisma.knowledgeArticle.findMany({
    include: { category: { select: { id: true, name: true, color: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 80,
  });
}

export async function saveArticle(ctx: Context, raw: unknown, id?: number) {
  if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const input = articleSchema.parse(raw);
  const data = {
    title: input.title,
    body: input.body,
    visibility: input.visibility ?? ArticleVisibility.PUBLIC,
    categoryId: input.categoryId ?? null,
    isPublished: input.isPublished ?? false,
    authorId: ctx.userId,
  };

  const article = id
    ? await prisma.knowledgeArticle.update({ where: { id }, data, include: { category: true } })
    : await prisma.knowledgeArticle.create({ data, include: { category: true } });

  await audit({
    action: id ? 'ARTICLE_UPDATED' : 'ARTICLE_CREATED',
    category: 'ADMIN',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'KnowledgeArticle',
    targetId: article.id,
    message: `${article.title} saved`,
  });
  return article;
}

export async function setArticlePublished(ctx: Context, id: number, isPublished: boolean) {
  if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const article = await prisma.knowledgeArticle.update({
    where: { id },
    data: { isPublished },
    include: { category: true },
  });
  await audit({
    action: isPublished ? 'ARTICLE_PUBLISHED' : 'ARTICLE_UNPUBLISHED',
    category: 'ADMIN',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'KnowledgeArticle',
    targetId: id,
    message: `${article.title} ${isPublished ? 'published' : 'unpublished'}`,
  });
  return article;
}
