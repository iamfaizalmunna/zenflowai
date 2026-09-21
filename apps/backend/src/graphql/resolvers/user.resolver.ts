import { GraphQLError } from 'graphql';
import { Context } from '../../types/context';
import { requirePermission } from '../../security/rbac';
import { prisma } from '../../utils/prisma';
import { auditModeration } from '../../security/audit';

export const userResolvers = {
  Query: {
    users: async (_: unknown, { role }: { role?: string }, ctx: Context) => {
      requirePermission(ctx.role, 'user:read:all', ctx.permissionOverrides);
      return prisma.user.findMany({
        where: role ? { role: role as any } : undefined,
        orderBy: { name: 'asc' },
      });
    },

    user: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      // Own profile: always allowed. Others: need user:read:all
      if (id !== ctx.userId) requirePermission(ctx.role, 'user:read:all', ctx.permissionOverrides);
      return prisma.user.findUnique({ where: { id } });
    },
  },

  Mutation: {
    updateMe: async (_: unknown, data: { name?: string; email?: string }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.user.update({
        where: { id: ctx.userId },
        data: {
          ...(data.name  ? { name: data.name.trim() } : {}),
          ...(data.email ? { email: data.email.toLowerCase().trim() } : {}),
        },
      });
    },

    banUser: async (_: unknown, { id, reason }: { id: number; reason: string }, ctx: Context) => {
      requirePermission(ctx.role, 'user:ban', ctx.permissionOverrides);
      const target = await prisma.user.findUnique({ where: { id } });
      if (!target) throw new GraphQLError('User not found');
      // Cannot ban same or higher role
      const hierarchy: Record<string, number> = { CUSTOMER: 0, AGENT: 1, SUPERVISOR: 2, ADMIN: 3, SUPER_ADMIN: 4 };
      if ((hierarchy[target.role] ?? 0) >= (hierarchy[ctx.role ?? ''] ?? 0)) {
        throw new GraphQLError('Cannot ban a user with equal or higher role', { extensions: { code: 'FORBIDDEN' } });
      }
      const banned = await prisma.user.update({
        where: { id },
        data: { isBanned: true, banReason: reason, bannedAt: new Date() },
      });
      await auditModeration('USER_BANNED', {
        actorId: ctx.userId, actorIp: ctx.ip,
        targetType: 'User', targetId: id,
        message: `User #${id} banned by ${ctx.role} #${ctx.userId}. Reason: ${reason}`,
      });
      return banned;
    },

    unbanUser: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      requirePermission(ctx.role, 'user:unban', ctx.permissionOverrides);
      const unbanned = await prisma.user.update({
        where: { id },
        data: { isBanned: false, banReason: null, bannedAt: null },
      });
      await auditModeration('USER_UNBANNED', {
        actorId: ctx.userId, actorIp: ctx.ip,
        targetType: 'User', targetId: id,
        message: `User #${id} unbanned by ${ctx.role} #${ctx.userId}`,
      });
      return unbanned;
    },

    changeUserRole: async (_: unknown, { id, role }: { id: number; role: string }, ctx: Context) => {
      requirePermission(ctx.role, `user:role:set:${role.toLowerCase()}`, ctx.permissionOverrides);
      const updated = await prisma.user.update({ where: { id }, data: { role: role as any } });
      await auditModeration('USER_ROLE_CHANGED', {
        actorId: ctx.userId, actorIp: ctx.ip,
        targetType: 'User', targetId: id,
        message: `User #${id} role changed to ${role} by #${ctx.userId}`,
      });
      return updated;
    },
  },
};
