import { Context } from '../../types/context';
import { getArticle, listArticles } from '../../services/knowledge.service';

export const knowledgeResolvers = {
  Query: {
    knowledgeArticles: async (
      _: unknown,
      args: { search?: string; internal?: boolean },
      ctx: Context
    ) => listArticles(ctx, args.search, args.internal ?? false),

    knowledgeArticle: async (_: unknown, { id }: { id: number }, ctx: Context) => getArticle(ctx, id),
  },
};
