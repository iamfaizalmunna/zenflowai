import { GraphQLError } from 'graphql';
import { MessageType } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { Context } from '../../types/context';
import { audit } from '../../security/audit';
import { pubsub, messageAddedTopic, ticketUpdatedTopic } from '../../utils/pubsub';
import { getTicket } from '../ticket.service';
import { consult, formatKbConsultReply } from './consult.service';

async function loadNova() {
  return prisma.user.findFirst({
    where: { isAiConsultant: true, isActive: true, isBanned: false },
  });
}

async function pickHuman(teamId: number | null, excludeUserId: number): Promise<number | null> {
  const members = await prisma.teamMember.findMany({
    where: {
      ...(teamId ? { teamId } : {}),
      user: { isActive: true, isBanned: false, isAiConsultant: false, role: { in: ['AGENT', 'SUPERVISOR'] } },
    },
    select: { userId: true },
  });
  const humans = members.filter((m) => m.userId !== excludeUserId);
  if (humans.length === 0) return null;
  const loads = await Promise.all(
    humans.map(async (member) => ({
      userId: member.userId,
      openCount: await prisma.ticket.count({
        where: { assignedToId: member.userId, status: { in: ['NEW', 'OPEN', 'IN_PROGRESS', 'ON_HOLD'] } },
      }),
    }))
  );
  loads.sort((a, b) => a.openCount - b.openCount);
  return loads[0]?.userId ?? null;
}

async function postSystem(ticketId: number, novaId: number, body: string, type: MessageType) {
  const message = await prisma.ticketMessage.create({
    data: { ticketId, senderId: novaId, body, type },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });
  await pubsub.publish(messageAddedTopic(ticketId), { messageAdded: message });
  return message;
}

export async function applyAiConsult(ticketId: number): Promise<void> {
  const nova = await loadNova();
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { assignedTo: true, messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!nova || !ticket || ticket.assignedToId !== nova.id) return;

  await postSystem(ticketId, nova.id, 'Nova is checking the knowledge base…', MessageType.SYSTEM_EVENT);

  const question = `${ticket.title}\n${ticket.description}`;
  const result = await consult({
    question,
    role: 'AGENT',
    ticketId,
    actorId: nova.id,
  });

  if (result.shouldHandoff) {
    await handoffFromAi(ticketId, nova.id, 'Low match in the knowledge base — handing to a person.');
    return;
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      firstRespondedAt: ticket.firstRespondedAt ?? new Date(),
      status: ticket.status === 'NEW' || ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
    },
  });
  await postSystem(ticketId, nova.id, formatKbConsultReply(result), MessageType.REPLY);
}

export async function continueAiConsult(ticketId: number): Promise<void> {
  const nova = await loadNova();
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { assignedTo: true, messages: true },
  });
  if (!nova || !ticket || ticket.assignedToId !== nova.id) return;
  const novaReplies = ticket.messages.filter((m) => m.senderId === nova.id && m.type === 'REPLY');
  if (novaReplies.length >= 1) {
    await handoffFromAi(ticketId, nova.id, 'Still need a person after the first AI reply.');
    return;
  }
  const alreadyRunning = ticket.messages.some((m) => m.senderId === nova.id && m.type === 'SYSTEM_EVENT');
  if (alreadyRunning) return;
  await applyAiConsult(ticketId);
}

export async function handoffTicket(ctx: Context, ticketId: number) {
  if (!ctx.userId || !ctx.role) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new GraphQLError('Ticket not found', { extensions: { code: 'NOT_FOUND' } });
  const staff = new Set(['AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN']);
  if (!staff.has(ctx.role) && ticket.customerId !== ctx.userId) {
    throw new GraphQLError('You do not have access to this ticket', { extensions: { code: 'FORBIDDEN' } });
  }
  const nova = await loadNova();
  if (!nova || ticket.assignedToId !== nova.id) {
    return getTicket(ctx, ticketId);
  }
  await handoffFromAi(ticketId, nova.id, 'Customer asked for a person.');
  return getTicket(ctx, ticketId);
}

export async function handoffFromAi(ticketId: number, novaId: number, reason: string): Promise<void> {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return;
  const humanId = await pickHuman(ticket.teamId, novaId);
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedToId: humanId,
      status: ticket.status === 'NEW' ? 'OPEN' : ticket.status,
    },
  });
  const human = humanId ? await prisma.user.findUnique({ where: { id: humanId } }) : null;
  const label = human?.name ?? 'the support team';
  await postSystem(
    ticketId,
    novaId,
    `AI could not finish this. Handed to ${label}. ${reason}`,
    MessageType.SYSTEM_EVENT
  );
  await audit({
    action: 'TICKET_AI_HANDOFF',
    category: 'TICKET',
    actorId: novaId,
    targetType: 'Ticket',
    targetId: ticketId,
    message: `Handoff to ${label}`,
  });
  const fresh = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      customer: { select: { id: true, name: true, email: true, role: true, isAiConsultant: true } },
      assignedTo: { select: { id: true, name: true, email: true, role: true, isAiConsultant: true } },
      team: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, color: true } },
    },
  });
  if (fresh) await pubsub.publish(ticketUpdatedTopic(ticketId), { ticketUpdated: fresh });
}
