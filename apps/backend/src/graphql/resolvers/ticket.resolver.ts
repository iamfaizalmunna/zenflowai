import { GraphQLError } from 'graphql';
import { prisma } from '../../utils/prisma';
import { Context } from '../../types/context';

export const ticketResolvers = {
  Query: {
    tickets: async (
      _: unknown,
      {
        filter,
        orderBy,
        page = 1,
        pageSize = 20,
      }: {
        filter?: any;
        orderBy?: { field: string; direction: string };
        page?: number;
        pageSize?: number;
      },
      ctx: Context
    ) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      const where: any = {};

      if (filter) {
        if (filter.status) where.status = filter.status;
        if (filter.priority) where.priority = filter.priority;
        if (filter.type) where.type = filter.type;
        if (filter.assignedToId) where.assignedToId = filter.assignedToId;
        if (filter.categoryId) where.categoryId = filter.categoryId;
        if (filter.search) {
          where.OR = [
            { title: { contains: filter.search } },
            { description: { contains: filter.search } },
          ];
        }
      }

      const sortField = orderBy?.field || 'createdAt';
      const sortDir = orderBy?.direction?.toLowerCase() === 'asc' ? 'asc' : 'desc';

      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          orderBy: { [sortField]: sortDir },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            createdBy: true,
            assignedTo: true,
            team: true,
            category: true,
            tags: { include: { tag: true } },
          },
        }),
        prisma.ticket.count({ where }),
      ]);

      return {
        tickets,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },

    ticket: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.ticket.findUnique({
        where: { id },
        include: {
          createdBy: true,
          assignedTo: true,
          team: true,
          category: true,
          tags: { include: { tag: true } },
          comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
          attachments: true,
          activities: { orderBy: { createdAt: 'desc' } },
        },
      });
    },

    ticketStats: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      const [total, open, inProgress, resolved, closed, byPriorityRaw, byTypeRaw] = await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: 'OPEN' } }),
        prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.ticket.count({ where: { status: 'RESOLVED' } }),
        prisma.ticket.count({ where: { status: 'CLOSED' } }),
        prisma.ticket.groupBy({ by: ['priority'], _count: { id: true } }),
        prisma.ticket.groupBy({ by: ['type'], _count: { id: true } }),
      ]);

      const byPriority = Object.fromEntries(byPriorityRaw.map((r) => [r.priority, r._count.id]));
      const byType = Object.fromEntries(byTypeRaw.map((r) => [r.type, r._count.id]));

      return { total, open, inProgress, resolved, closed, byPriority, byType };
    },

    categories: (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.category.findMany({ orderBy: { name: 'asc' } });
    },

    tags: (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.tag.findMany({ orderBy: { name: 'asc' } });
    },
  },

  Mutation: {
    createTicket: async (_: unknown, { input }: { input: any }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      const { tagIds, ...data } = input;

      const ticket = await prisma.ticket.create({
        data: {
          ...data,
          createdById: ctx.userId,
          tags: tagIds
            ? { create: tagIds.map((id: number) => ({ tag: { connect: { id } } })) }
            : undefined,
          activities: {
            create: [{ action: 'created', description: 'Ticket created' }],
          },
        },
        include: {
          createdBy: true,
          assignedTo: true,
          team: true,
          category: true,
          tags: { include: { tag: true } },
        },
      });

      return ticket;
    },

    updateTicket: async (_: unknown, { id, input }: { id: number; input: any }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      const { tagIds, ...data } = input;

      const ticket = await prisma.ticket.update({
        where: { id },
        data: {
          ...data,
          ...(tagIds !== undefined && {
            tags: {
              deleteMany: {},
              create: tagIds.map((tagId: number) => ({ tag: { connect: { id: tagId } } })),
            },
          }),
          activities: {
            create: [{ action: 'updated', description: 'Ticket updated' }],
          },
        },
        include: {
          createdBy: true,
          assignedTo: true,
          team: true,
          category: true,
          tags: { include: { tag: true } },
        },
      });

      return ticket;
    },

    deleteTicket: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      await prisma.ticket.delete({ where: { id } });
      return true;
    },

    assignTicket: async (_: unknown, { ticketId, userId }: any, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.ticket.update({
        where: { id: ticketId },
        data: {
          assignedToId: userId,
          activities: {
            create: [{ action: 'assigned', description: `Ticket assigned to user #${userId}` }],
          },
        },
        include: { createdBy: true, assignedTo: true, team: true, category: true, tags: { include: { tag: true } } },
      });
    },

    resolveTicket: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      return prisma.ticket.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          activities: {
            create: [{ action: 'resolved', description: 'Ticket resolved' }],
          },
        },
        include: { createdBy: true, assignedTo: true, team: true, category: true, tags: { include: { tag: true } } },
      });
    },
  },

  Ticket: {
    tags: (parent: any) => {
      // If tags are already loaded with nested tag data, unwrap
      if (parent.tags && parent.tags[0]?.tag) {
        return parent.tags.map((tt: any) => tt.tag);
      }
      return prisma.ticketTag.findMany({
        where: { ticketId: parent.id },
        include: { tag: true },
      }).then((tts) => tts.map((tt) => tt.tag));
    },
    comments: (parent: any) =>
      parent.comments ?? prisma.comment.findMany({ where: { ticketId: parent.id }, include: { author: true } }),
    activities: (parent: any) =>
      parent.activities ?? prisma.activity.findMany({ where: { ticketId: parent.id }, orderBy: { createdAt: 'desc' } }),
    attachments: (parent: any) =>
      parent.attachments ?? prisma.attachment.findMany({ where: { ticketId: parent.id } }),
    isBookmarked: async (parent: any, _: unknown, ctx: Context) => {
      if (!ctx.userId) return false;
      const bookmark = await prisma.bookmarkedNode.findUnique({
        where: { userId_nodeType_nodeId: { userId: ctx.userId, nodeType: 'Ticket', nodeId: parent.id } },
      });
      return !!bookmark;
    },
  },
};
