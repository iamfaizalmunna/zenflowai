import { GraphQLError } from 'graphql';
import { ZodError } from 'zod';
import { TicketPriority } from '@prisma/client';
import { Context } from '../../types/context';
import { requirePermission } from '../../security/rbac';
import {
  listRoutingRules,
  listSlaPolicies,
  listTeams,
  saveRoutingRule,
  saveTeam,
  setUserActive,
  updateSlaPolicy,
} from '../../services/admin.service';
import { listAdminArticles, saveArticle, setArticlePublished } from '../../services/knowledgeAdmin.service';

function mapZod(err: unknown): never {
  if (err instanceof ZodError) {
    throw new GraphQLError(err.issues[0]?.message ?? 'Invalid input', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  throw err;
}

export const adminResolvers = {
  Query: {
    teams: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      requirePermission(ctx.role, 'team:read', ctx.permissionOverrides);
      return listTeams();
    },
    routingRules: async (_: unknown, __: unknown, ctx: Context) => {
      requirePermission(ctx.role, 'routing:read', ctx.permissionOverrides);
      return listRoutingRules();
    },
    slaPolicies: async (_: unknown, __: unknown, ctx: Context) => {
      requirePermission(ctx.role, 'sla:read', ctx.permissionOverrides);
      return listSlaPolicies();
    },
    adminArticles: async (_: unknown, __: unknown, ctx: Context) => {
      requirePermission(ctx.role, 'knowledge:update', ctx.permissionOverrides);
      return listAdminArticles(ctx);
    },
  },
  Mutation: {
    saveTeam: async (_: unknown, { id, input }: { id?: number; input: { name: string; description?: string; isDefault?: boolean } }, ctx: Context) => {
      requirePermission(ctx.role, id ? 'team:update' : 'team:create', ctx.permissionOverrides);
      return saveTeam(ctx, input, id);
    },
    saveRoutingRule: async (_: unknown, { id, input }: { id?: number; input: unknown }, ctx: Context) => {
      requirePermission(ctx.role, id ? 'routing:update' : 'routing:create', ctx.permissionOverrides);
      try {
        return await saveRoutingRule(ctx, input, id);
      } catch (err) {
        return mapZod(err);
      }
    },
    updateSlaPolicy: async (
      _: unknown,
      args: { priority: TicketPriority; responseTimeHours: number; resolutionTimeHours: number },
      ctx: Context
    ) => {
      requirePermission(ctx.role, 'sla:update', ctx.permissionOverrides);
      return updateSlaPolicy(ctx, args.priority, args.responseTimeHours, args.resolutionTimeHours);
    },
    setUserActive: async (_: unknown, { id, isActive }: { id: number; isActive: boolean }, ctx: Context) => {
      requirePermission(ctx.role, 'user:update:any', ctx.permissionOverrides);
      return setUserActive(ctx, id, isActive);
    },
    saveArticle: async (_: unknown, { id, input }: { id?: number; input: unknown }, ctx: Context) => {
      requirePermission(ctx.role, id ? 'knowledge:update' : 'knowledge:create', ctx.permissionOverrides);
      try {
        return await saveArticle(ctx, input, id);
      } catch (err) {
        return mapZod(err);
      }
    },
    setArticlePublished: async (_: unknown, { id, isPublished }: { id: number; isPublished: boolean }, ctx: Context) => {
      requirePermission(ctx.role, 'knowledge:update', ctx.permissionOverrides);
      return setArticlePublished(ctx, id, isPublished);
    },
  },
};
