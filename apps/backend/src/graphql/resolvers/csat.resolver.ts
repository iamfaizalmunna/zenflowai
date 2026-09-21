import { Context } from '../../types/context';
import { requirePermission } from '../../security/rbac';
import { csatSummary, pendingCsats, submitCsat } from '../../services/csat.service';
import { askKnowledgeBase } from '../../services/qa.service';

export const csatResolvers = {
  Query: {
    pendingCsats: async (_: unknown, __: unknown, ctx: Context) => pendingCsats(ctx),
    csatSummary: async (_: unknown, __: unknown, ctx: Context) => {
      requirePermission(ctx.role, 'analytics:read:team', ctx.permissionOverrides);
      return csatSummary(ctx);
    },
    askKnowledgeBase: async (_: unknown, { question }: { question: string }, ctx: Context) =>
      askKnowledgeBase(ctx, question),
  },
  Mutation: {
    submitCsat: async (
      _: unknown,
      { id, rating, comment }: { id: number; rating: number; comment?: string },
      ctx: Context
    ) => {
      requirePermission(ctx.role, 'csat:submit', ctx.permissionOverrides);
      return submitCsat(ctx, id, rating, comment);
    },
  },
};
