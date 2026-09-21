import { z } from 'zod';
import { GraphQLError } from 'graphql';
import { MessageType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { checkCooldown, checkQuota } from '../security/fairUsage';
import { sanitizeContent } from '../security/spamDetector';
import { Context } from '../types/context';
import { pubsub, messageAddedTopic, ticketUpdatedTopic } from '../utils/pubsub';
import { getTicket } from './ticket.service';

const STAFF_ROLES = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);

const messageSchema = z.object({
  ticketId: z.number().int().positive(),
  body: z.string().min(1).max(8000),
  type: z.nativeEnum(MessageType).optional(),
});

export async function addMessage(ctx: Context, raw: unknown) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }

  const input = messageSchema.parse(raw);
  const type = input.type ?? MessageType.REPLY;
  if (type === MessageType.INTERNAL_NOTE && !STAFF_ROLES.has(ctx.role)) {
    throw new GraphQLError('Internal notes are staff-only', { extensions: { code: 'FORBIDDEN' } });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) throw new GraphQLError('Ticket not found', { extensions: { code: 'NOT_FOUND' } });
  if (!STAFF_ROLES.has(ctx.role) && ticket.customerId !== ctx.userId) {
    throw new GraphQLError('You do not have access to this ticket', { extensions: { code: 'FORBIDDEN' } });
  }

  await checkQuota(ctx.userId, ctx.role, 'POST_COMMENT');
  await checkCooldown(ctx.userId, ctx.role, 'POST_COMMENT');

  const body = sanitizeContent(input.body);
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: ctx.userId,
      body,
      type,
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  if (STAFF_ROLES.has(ctx.role) && type === MessageType.REPLY && !ticket.firstRespondedAt) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        firstRespondedAt: new Date(),
        status: ticket.status === 'NEW' || ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
      },
    });
  }

  await pubsub.publish(messageAddedTopic(ticket.id), { messageAdded: message });
  const fresh = await getTicket(ctx, ticket.id);
  await pubsub.publish(ticketUpdatedTopic(ticket.id), { ticketUpdated: fresh });

  return message;
}
