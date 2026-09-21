/**
 * GraphQL Superpowers Resolver
 *
 * Features:
 * 1. Save Queries (Persisted Queries) - save full query + hash for APQ
 * 2. Bookmark Nodes - mark any entity (Ticket, User, etc.) for quick access
 * 3. Toggle bookmarks on saved queries
 */

import { createHash } from 'crypto';
import { GraphQLError } from 'graphql';
import { prisma } from '../../utils/prisma';
import { Context } from '../../types/context';

export const superPowerResolvers = {
  Query: {
    savedQueries: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.savedQuery.findMany({
        where: { userId: ctx.userId },
        orderBy: [{ isBookmarked: 'desc' }, { updatedAt: 'desc' }],
      });
    },

    savedQuery: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.savedQuery.findFirst({ where: { id, userId: ctx.userId } });
    },

    bookmarkedNodes: async (_: unknown, { nodeType }: { nodeType?: string }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.bookmarkedNode.findMany({
        where: {
          userId: ctx.userId,
          ...(nodeType ? { nodeType } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    saveQuery: async (_: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      // Generate SHA-256 hash for APQ (Automatic Persisted Queries)
      const hash = `sha256:${createHash('sha256').update(input.query).digest('hex')}`;

      return prisma.savedQuery.create({
        data: {
          name: input.name,
          description: input.description,
          query: input.query,
          hash,
          variables: input.variables,
          tags: input.tags,
          userId: ctx.userId,
        },
      });
    },

    deleteQuery: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const sq = await prisma.savedQuery.findFirst({ where: { id, userId: ctx.userId } });
      if (!sq) throw new GraphQLError('Query not found');
      await prisma.savedQuery.delete({ where: { id } });
      return true;
    },

    toggleQueryBookmark: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const sq = await prisma.savedQuery.findFirst({ where: { id, userId: ctx.userId } });
      if (!sq) throw new GraphQLError('Query not found');
      return prisma.savedQuery.update({
        where: { id },
        data: { isBookmarked: !sq.isBookmarked },
      });
    },

    bookmarkNode: async (_: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      return prisma.bookmarkedNode.upsert({
        where: {
          userId_nodeType_nodeId: {
            userId: ctx.userId,
            nodeType: input.nodeType,
            nodeId: input.nodeId,
          },
        },
        update: {
          label: input.label,
          color: input.color,
        },
        create: {
          nodeType: input.nodeType,
          nodeId: input.nodeId,
          label: input.label,
          color: input.color ?? '#6366f1',
          userId: ctx.userId,
        },
      });
    },

    removeBookmark: async (_: unknown, { nodeType, nodeId }: any, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      await prisma.bookmarkedNode.delete({
        where: {
          userId_nodeType_nodeId: {
            userId: ctx.userId,
            nodeType,
            nodeId,
          },
        },
      });
      return true;
    },
  },
};
