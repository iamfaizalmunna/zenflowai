import { GraphQLError } from 'graphql';
import { Context } from '../../types/context';
import { requirePermission } from '../../security/rbac';
import {
  blockIp,
  getAnalytics,
  getConsultantProfile,
  listAuditLogs,
  listBlockedIps,
  listConsultants,
  listSpamReports,
  reviewSpam,
  unblockIp,
} from '../../services/analytics.service';

export const analyticsResolvers = {
  Query: {
    analytics: async (_: unknown, { rangeDays }: { rangeDays?: number }, ctx: Context) => {
      requirePermission(ctx.role, 'analytics:read:team', ctx.permissionOverrides);
      return getAnalytics(ctx, rangeDays);
    },
    consultants: async (_: unknown, __: unknown, ctx: Context) => listConsultants(ctx),
    consultantProfile: async (_: unknown, { id }: { id: number }, ctx: Context) => getConsultantProfile(ctx, id),
    auditLogs: async (_: unknown, args: { page?: number; pageSize?: number }, ctx: Context) =>
      listAuditLogs(ctx, args.page ?? 1, args.pageSize ?? 30),
    blockedIps: async (_: unknown, __: unknown, ctx: Context) => listBlockedIps(ctx),
    spamReports: async (_: unknown, __: unknown, ctx: Context) => listSpamReports(ctx),
  },
  Mutation: {
    blockIpAddress: async (_: unknown, { ip, reason }: { ip: string; reason: string }, ctx: Context) =>
      blockIp(ctx, ip.trim(), reason.trim() || 'manual'),
    unblockIpAddress: async (_: unknown, { id }: { id: number }, ctx: Context) => unblockIp(ctx, id),
    reviewSpam: async (
      _: unknown,
      { id, status, note }: { id: number; status: string; note?: string },
      ctx: Context,
    ) => {
      if (status !== 'CONFIRMED' && status !== 'DISMISSED') {
        throw new GraphQLError('status must be CONFIRMED or DISMISSED', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      return reviewSpam(ctx, id, status, note);
    },
  },
};
