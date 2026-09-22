import { GraphQLError } from 'graphql';
import { Context } from '../../types/context';
import { requirePermission } from '../../security/rbac';
import { listMyNotifications, markNotificationRead } from '../../services/notify.service';

export const notificationResolvers = {
  Query: {
    myNotifications: async (_: unknown, __: unknown, ctx: Context) => {
      requirePermission(ctx.role, 'notification:read:own', ctx.permissionOverrides);
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return listMyNotifications(ctx.userId);
    },
  },
  Mutation: {
    markNotificationRead: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      requirePermission(ctx.role, 'notification:update:own', ctx.permissionOverrides);
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return markNotificationRead(ctx.userId, id);
    },
  },
};
