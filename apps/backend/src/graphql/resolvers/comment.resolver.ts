import { GraphQLError } from 'graphql';
import { prisma } from '../../utils/prisma';
import { Context } from '../../types/context';

export const commentResolvers = {
  Query: {},

  Mutation: {
    addComment: async (_: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      const comment = await prisma.comment.create({
        data: {
          body: input.body,
          isInternal: input.isInternal ?? false,
          ticketId: input.ticketId,
          authorId: ctx.userId,
        },
        include: { author: true, ticket: true },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          ticketId: input.ticketId,
          action: 'commented',
          description: `Comment added by user #${ctx.userId}`,
        },
      });

      return comment;
    },

    deleteComment: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      const comment = await prisma.comment.findUnique({ where: { id } });
      if (!comment) throw new GraphQLError('Comment not found');
      if (comment.authorId !== ctx.userId && ctx.role !== 'ADMIN') {
        throw new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } });
      }
      await prisma.comment.delete({ where: { id } });
      return true;
    },
  },

  Comment: {
    author: (parent: any) =>
      parent.author ?? prisma.user.findUnique({ where: { id: parent.authorId } }),
    ticket: (parent: any) =>
      parent.ticket ?? prisma.ticket.findUnique({ where: { id: parent.ticketId } }),
  },
};
