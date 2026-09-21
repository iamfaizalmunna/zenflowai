import { TicketPriority } from '@prisma/client';
import { prisma } from '../utils/prisma';

export async function calculateSlaDueDates(priority: TicketPriority, from = new Date()) {
  const policy = await prisma.slaPolicy.findUnique({ where: { priority } });
  const responseHours = policy?.responseTimeHours ?? 8;
  const resolutionHours = policy?.resolutionTimeHours ?? 24;

  return {
    slaResponseDueAt: new Date(from.getTime() + responseHours * 60 * 60 * 1000),
    slaResolutionDueAt: new Date(from.getTime() + resolutionHours * 60 * 60 * 1000),
  };
}
