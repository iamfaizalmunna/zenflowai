import { GraphQLError } from 'graphql';
import { prisma } from '../../utils/prisma';
import { Context } from '../../types/context';
import { requirePermission } from '../../security/rbac';
import { checkCooldown, checkQuota } from '../../security/fairUsage';
import { analyzeContent, sanitizeContent } from '../../security/spamDetector';
import { audit } from '../../security/audit';

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

      // Permission: AGENT+ can read all; CUSTOMER reads only their own
      const canReadAll = ctx.role && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'AGENT'].includes(ctx.role);

      const where: any = {};

      if (!canReadAll) {
        where.createdById = ctx.userId;
      }

      if (filter) {
        if (filter.status) where.status = filter.status;
        if (filter.priority) where.priority = filter.priority;
        if (filter.type) where.type = filter.type;
        if (canReadAll && filter.assignedToId) where.assignedToId = filter.assignedToId;
        if (filter.categoryId) where.categoryId = filter.categoryId;
        if (filter.search) {
          where.OR = [
            { title: { contains: filter.search } },
            { description: { contains: filter.search } },
          ];
        }
      }

      const pageSize_ = Math.min(pageSize, 100); // Cap at 100
      const sortField = orderBy?.field || 'createdAt';
      const sortDir = orderBy?.direction?.toLowerCase() === 'asc' ? 'asc' : 'desc';

      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          orderBy: { [sortField]: sortDir },
          skip: (page - 1) * pageSize_,
          take: pageSize_,
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
        pageSize: pageSize_,
        totalPages: Math.ceil(total / pageSize_),
      };
    },

    ticket: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          createdBy: true,
          assignedTo: true,
          team: true,
          category: true,
          tags: { include: { tag: true } },
          comments: {
            where: ctx.role && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'AGENT'].includes(ctx.role)
              ? {}
              : { isInternal: false }, // Customers can't see internal notes
            include: { author: true },
            orderBy: { createdAt: 'asc' },
          },
          attachments: true,
          activities: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!ticket) return null;

      // CUSTOMER can only read their own tickets
      const canReadAll = ctx.role && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'AGENT'].includes(ctx.role);
      if (!canReadAll && ticket.createdById !== ctx.userId) {
        throw new GraphQLError('You do not have access to this ticket', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return ticket;
    },

    ticketStats: async (_: unknown, __: unknown, ctx: Context) => {
      requirePermission(ctx.role, 'ticket:read:all', ctx.permissionOverrides);

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
      // ── Auth & RBAC ──────────────────────────────────────────────────────────
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      requirePermission(ctx.role, 'ticket:create', ctx.permissionOverrides);

      // ── Fair Usage: Quota check ──────────────────────────────────────────────
      await checkQuota(ctx.userId, ctx.role!, 'CREATE_TICKET');

      // ── Fair Usage: Random cooldown ──────────────────────────────────────────
      await checkCooldown(ctx.userId, ctx.role!, 'CREATE_TICKET');

      // ── Sanitise input ───────────────────────────────────────────────────────
      const title = sanitizeContent(input.title ?? '');
      const description = sanitizeContent(input.description ?? '');

      if (!title || !description) {
        throw new GraphQLError('Title and description are required.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // ── AI Spam/Scam Detection ───────────────────────────────────────────────
      const spamAnalysis = await analyzeContent({
        title,
        content: description,
        userId: ctx.userId,
        ip: ctx.ip ?? undefined,
        userAgent: ctx.userAgent ?? undefined,
        role: ctx.role ?? undefined,
      });

      if (spamAnalysis.shouldBlock) {
        await audit({
          action: 'TICKET_BLOCKED_SPAM',
          category: 'SECURITY',
          severity: 'ERROR',
          actorId: ctx.userId,
          actorIp: ctx.ip,
          message: `Ticket creation blocked: spam score ${spamAnalysis.score}/100`,
          metadata: { flags: spamAnalysis.flags, score: spamAnalysis.score },
        });
        throw new GraphQLError(
          'Your submission was flagged as potential spam. Please review your content and try again.',
          { extensions: { code: 'SPAM_DETECTED', score: spamAnalysis.score } }
        );
      }

      const { tagIds, ...data } = input;

      const ticket = await prisma.ticket.create({
        data: {
          ...data,
          title,
          description,
          createdById: ctx.userId,
          tags: tagIds
            ? { create: tagIds.map((id: number) => ({ tag: { connect: { id } } })) }
            : undefined,
          activities: {
            create: [
              { action: 'created', description: 'Ticket created' },
              ...(spamAnalysis.shouldFlag
                ? [{ action: 'flagged', description: `Auto-flagged (score: ${spamAnalysis.score})`, metadata: spamAnalysis }]
                : []),
            ],
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

      // If suspicious but not blocked, create a spam report for moderator review
      if (spamAnalysis.shouldFlag) {
        await prisma.spamReport.create({
          data: {
            targetType: 'Ticket',
            targetId: ticket.id,
            reason: 'BOT_BEHAVIOR',
            aiScore: spamAnalysis.score / 100,
            aiFlags: spamAnalysis.flags,
            status: 'PENDING',
          },
        });
      }

      await audit({
        action: 'TICKET_CREATED',
        category: 'TICKET',
        severity: 'INFO',
        actorId: ctx.userId,
        actorIp: ctx.ip,
        targetType: 'Ticket',
        targetId: ticket.id,
        message: `Ticket #${ticket.id} created: "${title}"`,
      });

      return ticket;
    },

    updateTicket: async (_: unknown, { id, input }: { id: number; input: any }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      const existing = await prisma.ticket.findUnique({ where: { id } });
      if (!existing) throw new GraphQLError('Ticket not found');

      // CUSTOMER can only update their own; others need ticket:update:any
      const isOwner = existing.createdById === ctx.userId;
      if (!isOwner) {
        requirePermission(ctx.role, 'ticket:update:any', ctx.permissionOverrides);
      } else {
        requirePermission(ctx.role, 'ticket:update:own', ctx.permissionOverrides);
      }

      // Sanitise
      const { tagIds, ...data } = input;
      if (data.title) data.title = sanitizeContent(data.title);
      if (data.description) data.description = sanitizeContent(data.description);

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
            create: [{ action: 'updated', description: `Ticket updated by #${ctx.userId}` }],
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

      await audit({
        action: 'TICKET_UPDATED',
        category: 'TICKET',
        severity: 'INFO',
        actorId: ctx.userId,
        actorIp: ctx.ip,
        targetType: 'Ticket',
        targetId: id,
        message: `Ticket #${id} updated`,
      });

      return ticket;
    },

    deleteTicket: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      requirePermission(ctx.role, 'ticket:delete:any', ctx.permissionOverrides);

      await prisma.ticket.delete({ where: { id } });

      await audit({
        action: 'TICKET_DELETED',
        category: 'TICKET',
        severity: 'WARN',
        actorId: ctx.userId,
        actorIp: ctx.ip,
        targetType: 'Ticket',
        targetId: id,
        message: `Ticket #${id} deleted by ${ctx.role} #${ctx.userId}`,
      });

      return true;
    },

    assignTicket: async (_: unknown, { ticketId, userId }: any, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      requirePermission(ctx.role, 'ticket:assign', ctx.permissionOverrides);

      const ticket = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          assignedToId: userId,
          activities: {
            create: [{ action: 'assigned', description: `Assigned to user #${userId} by ${ctx.role} #${ctx.userId}` }],
          },
        },
        include: { createdBy: true, assignedTo: true, team: true, category: true, tags: { include: { tag: true } } },
      });

      await audit({
        action: 'TICKET_ASSIGNED',
        category: 'TICKET',
        severity: 'INFO',
        actorId: ctx.userId,
        targetType: 'Ticket',
        targetId: ticketId,
        message: `Ticket #${ticketId} assigned to #${userId}`,
      });

      return ticket;
    },

    resolveTicket: async (_: unknown, { id }: { id: number }, ctx: Context) => {
      if (!ctx.userId) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      requirePermission(ctx.role, 'ticket:resolve', ctx.permissionOverrides);

      const ticket = await prisma.ticket.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          activities: {
            create: [{ action: 'resolved', description: `Resolved by ${ctx.role} #${ctx.userId}` }],
          },
        },
        include: { createdBy: true, assignedTo: true, team: true, category: true, tags: { include: { tag: true } } },
      });

      return ticket;
    },
  },

  Ticket: {
    tags: (parent: any) => {
      if (parent.tags && parent.tags[0]?.tag) {
        return parent.tags.map((tt: any) => tt.tag);
      }
      return prisma.ticketTag.findMany({
        where: { ticketId: parent.id },
        include: { tag: true },
      }).then((tts) => tts.map((tt) => tt.tag));
    },
    comments: (parent: any, _: unknown, ctx: Context) => {
      if (parent.comments) return parent.comments;
      const canSeeInternal = ctx.role && ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'AGENT'].includes(ctx.role);
      return prisma.comment.findMany({
        where: { ticketId: parent.id, ...(!canSeeInternal ? { isInternal: false } : {}) },
        include: { author: true },
      });
    },
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
