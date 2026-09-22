import { z } from 'zod';
import { GraphQLError } from 'graphql';
import { Prisma, TicketPriority, TicketStatus, TicketType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { generateTicketNumber } from '../utils/ticketNumber';
import { calculateSlaDueDates } from './sla.service';
import { evaluateRouting, saveRoutingDecision } from './routing.service';
import { checkCooldown, checkQuota } from '../security/fairUsage';
import { analyzeContent, sanitizeContent } from '../security/spamDetector';
import { audit } from '../security/audit';
import { Context } from '../types/context';
import { pubsub, TICKET_CREATED_TOPIC, ticketUpdatedTopic } from '../utils/pubsub';
import { openCsatForTicket } from './csat.service';
import { notifyUser } from './notify.service';

const createSchema = z.object({
  title: z.string().min(4).max(180),
  description: z.string().min(10).max(8000),
  categoryId: z.number().int().positive().optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  type: z.nativeEnum(TicketType).optional(),
});

const TICKET_INCLUDE = {
  customer: { select: { id: true, name: true, email: true, role: true, isAiConsultant: true } },
  assignedTo: { select: { id: true, name: true, email: true, role: true, isAiConsultant: true } },
  team: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, color: true } },
} satisfies Prisma.TicketInclude;

const STAFF_ROLES = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

export async function listTickets(
  ctx: Context,
  filter?: { status?: TicketStatus; priority?: TicketPriority; search?: string },
  page = 1,
  pageSize = 20
) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }

  const where: Prisma.TicketWhereInput = {};
  if (!STAFF_ROLES.has(ctx.role)) {
    where.customerId = ctx.userId;
  }
  if (filter?.status) where.status = filter.status;
  if (filter?.priority) where.priority = filter.priority;
  if (filter?.search) {
    where.OR = [
      { title: { contains: filter.search } },
      { description: { contains: filter.search } },
      { ticketNumber: { contains: filter.search } },
    ];
  }

  const take = Math.min(pageSize, 50);
  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: TICKET_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total, page, pageSize: take, totalPages: Math.ceil(total / take) };
}

export async function getTicket(ctx: Context, id: number) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      ...TICKET_INCLUDE,
      messages: {
        where: STAFF_ROLES.has(ctx.role) ? undefined : { type: { not: 'INTERNAL_NOTE' } },
        include: { sender: { select: { id: true, name: true, role: true, isAiConsultant: true } } },
        orderBy: { createdAt: 'asc' },
      },
      consultAttempts: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!ticket) throw new GraphQLError('Ticket not found', { extensions: { code: 'NOT_FOUND' } });
  if (!STAFF_ROLES.has(ctx.role) && ticket.customerId !== ctx.userId) {
    throw new GraphQLError('You do not have access to this ticket', { extensions: { code: 'FORBIDDEN' } });
  }
  return ticket;
}

export async function createTicket(ctx: Context, raw: unknown) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }

  const input = createSchema.parse(raw);
  const title = sanitizeContent(input.title);
  const description = sanitizeContent(input.description);

  await checkQuota(ctx.userId, ctx.role, 'CREATE_TICKET');
  await checkCooldown(ctx.userId, ctx.role, 'CREATE_TICKET');

  const spam = await analyzeContent({
    title,
    content: description,
    userId: ctx.userId,
    ip: ctx.ip ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
    role: ctx.role,
  });

  if (spam.shouldBlock) {
    throw new GraphQLError('Your submission was flagged as potential spam.', {
      extensions: { code: 'SPAM_DETECTED', score: spam.score },
    });
  }

  let priority = input.priority ?? TicketPriority.MEDIUM;
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (category && !input.priority) priority = category.defaultPriority;
  }

  const routing = await evaluateRouting({
    title,
    description,
    categoryId: input.categoryId,
    priority,
  });
  if (routing.priorityOverride) priority = routing.priorityOverride;

  const sla = await calculateSlaDueDates(priority);
  const ticketNumber = await generateTicketNumber();

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      title,
      description,
      priority,
      type: input.type ?? TicketType.QUESTION,
      status: routing.assignedUserId ? TicketStatus.OPEN : TicketStatus.NEW,
      customerId: ctx.userId,
      categoryId: input.categoryId,
      teamId: routing.teamId,
      assignedToId: routing.assignedUserId,
      slaResponseDueAt: sla.slaResponseDueAt,
      slaResolutionDueAt: sla.slaResolutionDueAt,
      isSpamFlagged: spam.shouldFlag,
      aiClassificationScore: spam.score,
      messages: {
        create: {
          senderId: ctx.userId,
          body: description,
          type: 'REPLY',
        },
      },
    },
    include: TICKET_INCLUDE,
  });

  await saveRoutingDecision(ticket.id, routing);

  await notifyUser(
    ctx.userId,
    'TICKET_CREATED',
    `Ticket created ${ticket.ticketNumber}`,
    ticket.title,
    ticket.id
  );
  if (routing.assignedUserId && routing.assignedUserId !== ctx.userId) {
    await notifyUser(
      routing.assignedUserId,
      'TICKET_ASSIGNED',
      `New ticket assigned ${ticket.ticketNumber}`,
      ticket.title,
      ticket.id
    );
  }

  await audit({
    action: 'TICKET_CREATED',
    category: 'TICKET',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'Ticket',
    targetId: ticket.id,
    message: `${ticket.ticketNumber} created`,
  });

  await pubsub.publish(TICKET_CREATED_TOPIC, { ticketCreated: ticket });
  scheduleAiConsult(ticket.id);

  return ticket;
}

export async function updateTicket(
  ctx: Context,
  id: number,
  input: { status?: TicketStatus; priority?: TicketPriority; assignedToId?: number | null }
) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  if (!STAFF_ROLES.has(ctx.role)) {
    throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });
  }

  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) throw new GraphQLError('Ticket not found', { extensions: { code: 'NOT_FOUND' } });

  const data: Prisma.TicketUpdateInput = {};
  if (input.status) {
    data.status = input.status;
    if (input.status === 'RESOLVED') data.resolvedAt = new Date();
    if (input.status === 'CLOSED') data.closedAt = new Date();
    if (input.status === 'IN_PROGRESS' && !existing.firstRespondedAt) {
      data.firstRespondedAt = new Date();
    }
  }
  if (input.priority) data.priority = input.priority;
  if (input.assignedToId !== undefined) {
    data.assignedTo = input.assignedToId
      ? { connect: { id: input.assignedToId } }
      : { disconnect: true };
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data,
    include: TICKET_INCLUDE,
  });

  if (input.status === 'RESOLVED') {
    await openCsatForTicket(ticket.id, ticket.customerId);
  }

  await audit({
    action: 'TICKET_UPDATED',
    category: 'TICKET',
    actorId: ctx.userId,
    actorIp: ctx.ip,
    targetType: 'Ticket',
    targetId: id,
    message: `${ticket.ticketNumber} updated`,
  });

  await pubsub.publish(ticketUpdatedTopic(id), { ticketUpdated: ticket });

  return ticket;
}

export async function ticketCounts(ctx: Context) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  const scope: Prisma.TicketWhereInput = STAFF_ROLES.has(ctx.role)
    ? {}
    : { customerId: ctx.userId };

  const [open, waiting, resolved] = await Promise.all([
    prisma.ticket.count({ where: { ...scope, status: { in: ['NEW', 'OPEN'] } } }),
    prisma.ticket.count({ where: { ...scope, status: { in: ['IN_PROGRESS', 'ON_HOLD'] } } }),
    prisma.ticket.count({ where: { ...scope, status: { in: ['RESOLVED', 'CLOSED'] } } }),
  ]);

  return { open, waiting, resolved };
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}
