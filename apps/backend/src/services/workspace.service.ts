import { GraphQLError } from 'graphql';
import { ArticleVisibility } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { Context } from '../types/context';
import { getTicket } from './ticket.service';
import { rankRelatedArticles } from './relatedRank';
import { articleSnippet, pickReplyTemplate } from './suggestReply';
import { getArticle } from './knowledge.service';

const STAFF_ROLES = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

export async function relatedArticles(ctx: Context, ticketId: number) {
  const ticket = await getTicket(ctx, ticketId);
  const visibility = STAFF_ROLES.has(ctx.role ?? '')
    ? { in: [ArticleVisibility.PUBLIC, ArticleVisibility.INTERNAL] }
    : ArticleVisibility.PUBLIC;

  const articles = await prisma.knowledgeArticle.findMany({
    where: { isPublished: true, visibility },
    include: { category: { select: { id: true, name: true, color: true } } },
    take: 40,
  });

  return rankRelatedArticles(
    `${ticket.title} ${ticket.description}`,
    articles,
    ticket.categoryId,
    5
  );
}

export async function suggestReply(ctx: Context, ticketId: number) {
  if (!ctx.userId || !STAFF_ROLES.has(ctx.role ?? '')) {
    throw new GraphQLError('Staff only', { extensions: { code: 'FORBIDDEN' } });
  }
  const ticket = await getTicket(ctx, ticketId);
  const categoryName = ticket.category?.name ?? null;
  return pickReplyTemplate(categoryName);
}

export async function insertArticleIntoReply(ctx: Context, articleId: number) {
  const article = await getArticle(ctx, articleId);
  return articleSnippet(article.title, article.body);
}
