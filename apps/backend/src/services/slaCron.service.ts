import { NotificationType, TicketStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { isSlaBreached, isSlaWarning, shouldAutoClose } from './slaSweep';

const OPEN = ['NEW', 'OPEN', 'IN_PROGRESS', 'ON_HOLD'] as const;

async function notifyOnce(userId: number, type: NotificationType, ticketId: number, title: string, body: string) {
  const existing = await prisma.notification.findFirst({
    where: { userId, type, ticketId },
  });
  if (existing) return;
  await prisma.notification.create({
    data: { userId, type, ticketId, title, body },
  });
}

async function staffRecipients(assignedToId: number | null): Promise<number[]> {
  const ids = new Set<number>();
  if (assignedToId) ids.add(assignedToId);
  const leads = await prisma.user.findMany({
    where: { role: { in: ['SUPERVISOR', 'ADMIN'] }, isActive: true, isBanned: false },
    select: { id: true },
    take: 20,
  });
  for (const u of leads) ids.add(u.id);
  return [...ids];
}

export async function runSlaSweep(now = new Date()): Promise<{ warned: number; breached: number; closed: number }> {
  let warned = 0;
  let breached = 0;
  let closed = 0;

  const openTickets = await prisma.ticket.findMany({
    where: { status: { in: [...OPEN] } },
    select: {
      id: true,
      ticketNumber: true,
      title: true,
      assignedToId: true,
      slaResponseDueAt: true,
      slaResolutionDueAt: true,
      slaResponseBreached: true,
      slaResolutionBreached: true,
      firstRespondedAt: true,
    },
  });

  for (const ticket of openTickets) {
    const due = !ticket.firstRespondedAt ? ticket.slaResponseDueAt : ticket.slaResolutionDueAt;
    const alreadyBreached = !ticket.firstRespondedAt ? ticket.slaResponseBreached : ticket.slaResolutionBreached;
    if (!due) continue;

    if (isSlaWarning(due, now) && !alreadyBreached) {
      const recipients = await staffRecipients(ticket.assignedToId);
      for (const userId of recipients) {
        await notifyOnce(
          userId,
          'SLA_WARNING',
          ticket.id,
          `SLA warning ${ticket.ticketNumber}`,
          ticket.title
        );
      }
      warned += 1;
    }

    if (isSlaBreached(due, now) && !alreadyBreached) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: !ticket.firstRespondedAt
          ? { slaResponseBreached: true }
          : { slaResolutionBreached: true },
      });
      const recipients = await staffRecipients(ticket.assignedToId);
      for (const userId of recipients) {
        await notifyOnce(
          userId,
          'SLA_BREACHED',
          ticket.id,
          `SLA breached ${ticket.ticketNumber}`,
          ticket.title
        );
      }
      breached += 1;
    }
  }

  const resolved = await prisma.ticket.findMany({
    where: { status: TicketStatus.RESOLVED, resolvedAt: { not: null } },
    select: { id: true, resolvedAt: true, ticketNumber: true },
  });

  for (const ticket of resolved) {
    if (!ticket.resolvedAt || !shouldAutoClose(ticket.resolvedAt, now)) continue;
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.CLOSED, closedAt: now },
    });
    closed += 1;
  }

  await prisma.csatSurvey.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
    data: { status: 'EXPIRED' },
  });

  return { warned, breached, closed };
}
