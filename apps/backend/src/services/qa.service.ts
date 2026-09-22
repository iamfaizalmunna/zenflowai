import { GraphQLError } from 'graphql';
import { Context } from '../types/context';
import { consult } from './ai/consult.service';

export async function askKnowledgeBase(ctx: Context, question: string) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  const trimmed = question.trim();
  if (trimmed.length < 4) {
    throw new GraphQLError('Question is too short', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  const result = await consult({
    question: trimmed,
    role: ctx.role,
    actorId: ctx.userId,
    preferRetrieval: true,
  });
  return {
    answer: result.answer,
    confidence: result.confidence,
    citations: result.citations,
    engine: result.engine,
  };
}
