import { GraphQLError } from 'graphql';
import { ArticleVisibility } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { Context } from '../types/context';
import { rankRelatedWithScores } from './relatedRank';
import { buildKbAnswer } from './qaAnswer';

const STAFF = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

export async function askKnowledgeBase(ctx: Context, question: string) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  const trimmed = question.trim();
  if (trimmed.length < 4) {
    throw new GraphQLError('Question is too short', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const visibility = STAFF.has(ctx.role)
    ? { in: [ArticleVisibility.PUBLIC, ArticleVisibility.INTERNAL] as ArticleVisibility[] }
    : ArticleVisibility.PUBLIC;

  const articles = await prisma.knowledgeArticle.findMany({
    where: { isPublished: true, visibility },
    select: { id: true, title: true, body: true, categoryId: true },
    take: 40,
  });

  const ranked = rankRelatedWithScores(trimmed, articles, null, 5);
  return buildKbAnswer(
    ranked.map((row) => ({
      id: row.article.id,
      title: row.article.title,
      body: row.article.body,
      score: row.score,
    }))
  );
}
