import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { prisma } from '../../utils/prisma';
import { Context } from '../../types/context';

export const userResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.user.findUnique({ where: { id: ctx.userId } });
    },

    users: async (_: unknown, { role }: { role?: string }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.user.findMany({
        where: role ? { role: role as any } : undefined,
        orderBy: { name: 'asc' },
      });
    },

    user: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.user.findUnique({ where: { id } });
    },

    notifications: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.notification.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    },
  },

  Mutation: {
    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHORIZED' } });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new GraphQLError('Invalid credentials', { extensions: { code: 'UNAUTHORIZED' } });

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return { token, user };
    },

    register: async (_: unknown, { email, name, password, role }: any) => {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) throw new GraphQLError('Email already in use', { extensions: { code: 'BAD_USER_INPUT' } });

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, name, password: hashed, role: role || 'CUSTOMER' },
      });

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return { token, user };
    },

    markNotificationRead: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.notification.update({ where: { id }, data: { read: true } });
    },

    markAllNotificationsRead: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      await prisma.notification.updateMany({
        where: { userId: ctx.userId, read: false },
        data: { read: true },
      });
      return true;
    },
  },

  User: {
    createdTickets: (parent: any) =>
      prisma.ticket.findMany({ where: { createdById: parent.id } }),
    assignedTickets: (parent: any) =>
      prisma.ticket.findMany({ where: { assignedToId: parent.id } }),
    savedQueries: (parent: any) =>
      prisma.savedQuery.findMany({ where: { userId: parent.id } }),
  },
};
