import { TicketPriority } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { calculateDueAt } from './slaDates';

export { calculateDueAt };

export async function calculateSlaDueDates(priority: TicketPriority, from = new Date()) {
  const policy = await prisma.slaPolicy.findUnique({ where: { priority } });
  const responseHours = policy?.responseTimeHours ?? 8;
  const resolutionHours = policy?.resolutionTimeHours ?? 24;
  return calculateDueAt(from, responseHours, resolutionHours);
}
