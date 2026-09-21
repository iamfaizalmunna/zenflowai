import { Context } from '../../types/context';
import { getArticle, listArticles } from '../../services/knowledge.service';
import { insertArticleIntoReply, relatedArticles as listRelated, suggestReply as buildSuggestedReply } from '../../services/workspace.service';
import { requirePermission } from '../../security/rbac';

export const knowledgeResolvers = {
  Query: {
    knowledgeArticles: async (
      _: unknown,
      args: { search?: string; internal?: boolean },
      ctx: Context
    ) => listArticles(ctx, args.search, args.internal ?? false),

    knowledgeArticle: async (_: unknown, { id }: { id: number }, ctx: Context) => getArticle(ctx, id),

    relatedArticles: async (_: unknown, { ticketId }: { ticketId: number }, ctx: Context) =>
      listRelated(ctx, ticketId),

    suggestReply: async (_: unknown, { ticketId }: { ticketId: number }, ctx: Context) => {
      requirePermission(ctx.role, 'ticket:update:assigned', ctx.permissionOverrides);
      return buildSuggestedReply(ctx, ticketId);
    },

    articleSnippet: async (_: unknown, { articleId }: { articleId: number }, ctx: Context) =>
      insertArticleIntoReply(ctx, articleId),
  },
};
